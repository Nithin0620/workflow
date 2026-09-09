import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  getApiUser,
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
} from "@/lib/api/auth";
import { updateIssueSchema } from "@/lib/validators";
import { broadcastProjectEvent } from "@/lib/realtime/events";
import { createUserNotification } from "@/actions/notifications";
import { IssuePriority, IssueStatus, Prisma } from "@prisma/client";

type RouteContext = {
  params: Promise<{ issueId: string }> | { issueId: string };
};

async function getIssueId(context: RouteContext): Promise<string> {
  const resolved = await context.params;
  return resolved.issueId;
}

async function checkIssueAccess(issueId: string, userId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      project: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!issue) return null;

  const workspaceMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: issue.project.workspaceId,
        userId,
      },
    },
  });

  if (!workspaceMember) return null;

  let effectiveRole: "OWNER" | "EDITOR" | "VIEWER" | null = null;

  if (workspaceMember.role === "OWNER" || workspaceMember.role === "ADMIN") {
    effectiveRole = "OWNER";
  } else if (issue.project.members.length > 0) {
    effectiveRole = issue.project.members[0].role;
  } else if (issue.project.isPrivate) {
    effectiveRole = null;
  } else {
    effectiveRole = workspaceMember.role === "VIEWER" ? "VIEWER" : "EDITOR";
  }

  return { issue, project: issue.project, workspaceMember, effectiveRole };
}

/**
 * GET /api/v1/issues/[issueId]
 * Returns issue with assignees, labels, sprint, column, comments, attachments, activities.
 */
export async function GET(req: Request | NextRequest, context: RouteContext) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const issueId = await getIssueId(context);
    const access = await checkIssueAccess(issueId, user.id);

    if (!access || !access.effectiveRole) {
      return apiNotFound("Issue not found or access denied");
    }

    const [issueCore, comments, activityLogs, column] = await Promise.all([
      prisma.issue.findUnique({
        where: { id: issueId },
        include: {
          assignee: {
            select: { id: true, name: true, image: true, email: true },
          },
          creator: {
            select: { id: true, name: true, image: true, email: true },
          },
          labels: true,
          sprint: {
            select: {
              id: true,
              name: true,
              number: true,
              goal: true,
              startDate: true,
              endDate: true,
              isActive: true,
            },
          },
          attachments: {
            include: {
              uploader: {
                select: { id: true, name: true, image: true, email: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          gitLinks: {
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: {
              comments: true,
              attachments: true,
            },
          },
        },
      }),
      prisma.comment.findMany({
        where: { issueId },
        include: {
          author: {
            select: { id: true, name: true, image: true, email: true },
          },
          attachments: {
            include: {
              uploader: { select: { id: true, name: true, image: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.activityLog.findMany({
        where: { issueId },
        include: {
          actor: {
            select: { id: true, name: true, image: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.boardColumn.findFirst({
        where: { projectId: access.project.id, key: access.issue.status },
      }),
    ]);

    if (!issueCore) {
      return apiNotFound("Issue not found");
    }

    return apiSuccess({
      issue: {
        ...issueCore,
        column: column || null,
        comments,
        activityLogs,
        commentsCount: issueCore._count.comments,
        attachmentsCount: issueCore._count.attachments,
      },
    });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * PATCH /api/v1/issues/[issueId]
 * Updates issue details, moves column/status, reorders, assigns, labels, sprint.
 * Requires EDITOR or OWNER role.
 */
export async function PATCH(req: Request | NextRequest, context: RouteContext) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const issueId = await getIssueId(context);
    const access = await checkIssueAccess(issueId, user.id);

    if (!access || !access.effectiveRole) {
      return apiNotFound("Issue not found or access denied");
    }

    if (access.effectiveRole === "VIEWER") {
      return apiForbidden("You do not have permission to update this issue");
    }

    const body = await req.json();
    const parsed = updateIssueSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid update payload", 400);
    }

    const {
      title,
      description,
      status,
      priority,
      assigneeId,
      sprintId,
      labelIds,
      estimate,
      dueDate,
      order,
    } = parsed.data;

    // Validate sprint if provided
    if (sprintId) {
      const sprint = await prisma.sprint.findFirst({
        where: { id: sprintId, projectId: access.project.id },
      });
      if (!sprint) {
        return apiError("Sprint not found in this project", 400);
      }
    }

    // Validate assignee if provided
    if (assigneeId) {
      const assigneeMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: access.project.workspaceId,
            userId: assigneeId,
          },
        },
      });
      if (!assigneeMember) {
        return apiError("Assignee is not a member of this workspace", 400);
      }
    }

    const oldIssue = access.issue;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedIssue = await tx.issue.update({
        where: { id: issueId },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(status !== undefined && { status: status as IssueStatus }),
          ...(priority !== undefined && { priority: priority as IssuePriority }),
          ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
          ...(sprintId !== undefined && { sprintId: sprintId || null }),
          ...(estimate !== undefined && { estimate: estimate ?? null }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
          ...(order !== undefined && { order }),
          ...(labelIds !== undefined && {
            labels: {
              set: labelIds.map((id) => ({ id })),
            },
          }),
        },
        include: {
          assignee: {
            select: { id: true, name: true, image: true, email: true },
          },
          creator: {
            select: { id: true, name: true, image: true, email: true },
          },
          labels: true,
          sprint: {
            select: {
              id: true,
              name: true,
              number: true,
              isActive: true,
              startDate: true,
              endDate: true,
            },
          },
          _count: {
            select: {
              comments: true,
              attachments: true,
            },
          },
        },
      });

      // Record activity changes
      const changes: Record<string, Prisma.InputJsonValue> = {};
      if (status && status !== oldIssue.status) changes.status = { from: oldIssue.status, to: status };
      if (priority && priority !== oldIssue.priority) changes.priority = { from: oldIssue.priority, to: priority };
      if (assigneeId !== undefined && assigneeId !== oldIssue.assigneeId) changes.assigneeId = { from: oldIssue.assigneeId, to: assigneeId };
      if (title && title !== oldIssue.title) changes.title = { from: oldIssue.title, to: title };

      if (Object.keys(changes).length > 0) {
        await tx.activityLog.create({
          data: {
            workspaceId: access.project.workspaceId,
            issueId: oldIssue.id,
            actorId: user.id,
            action: status && status !== oldIssue.status ? "STATUS_CHANGED" : "ISSUE_UPDATED",
            details: changes,
          },
        });
      }

      return updatedIssue;
    });

    const column = await prisma.boardColumn.findFirst({
      where: { projectId: access.project.id, key: updated.status },
    });

    const responseIssue = {
      ...updated,
      column: column || null,
      commentsCount: updated._count.comments,
      attachmentsCount: updated._count.attachments,
    };

    // Reassignment notification
    if (assigneeId && assigneeId !== oldIssue.assigneeId) {
      const isSelf = assigneeId === user.id;
      try {
        await createUserNotification({
          userId: assigneeId,
          title: "Issue Assigned to You",
          message: isSelf
            ? `You assigned yourself to ${oldIssue.projectKey}-${oldIssue.issueNumber}: ${updated.title}`
            : `${user.name || "A teammate"} assigned you to ${oldIssue.projectKey}-${oldIssue.issueNumber}: ${updated.title}`,
        });
      } catch {
        // ignore notification failure
      }
    }

    try {
      if (status && status !== oldIssue.status) {
        broadcastProjectEvent({
          type: "ISSUE_MOVED",
          projectId: access.project.id,
          timestamp: Date.now(),
          actor: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          },
          data: {
            issueId,
            targetStatus: updated.status,
            newOrder: updated.order,
          },
        });
      } else {
        broadcastProjectEvent({
          type: "ISSUE_UPDATED",
          projectId: access.project.id,
          timestamp: Date.now(),
          actor: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          },
          data: {
            issueId,
            issue: {
              id: updated.id,
              projectKey: updated.projectKey,
              issueNumber: updated.issueNumber,
              title: updated.title,
              status: updated.status,
              priority: updated.priority,
              estimate: updated.estimate,
              sprintId: updated.sprintId,
              assignee: updated.assignee,
              _count: updated._count,
            },
          },
        });
      }
    } catch {
      // ignore broadcast failure
    }

    return apiSuccess({ issue: responseIssue });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * DELETE /api/v1/issues/[issueId]
 * Deletes issue. Requires EDITOR or OWNER role.
 */
export async function DELETE(req: Request | NextRequest, context: RouteContext) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const issueId = await getIssueId(context);
    const access = await checkIssueAccess(issueId, user.id);

    if (!access || !access.effectiveRole) {
      return apiNotFound("Issue not found or access denied");
    }

    if (access.effectiveRole === "VIEWER") {
      return apiForbidden("You do not have permission to delete this issue");
    }

    await prisma.issue.delete({
      where: { id: issueId },
    });

    try {
      broadcastProjectEvent({
        type: "ISSUE_DELETED",
        projectId: access.project.id,
        timestamp: Date.now(),
        actor: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        data: {
          issueId,
        },
      });
    } catch {
      // ignore broadcast failure
    }

    return apiSuccess({ message: "Issue deleted successfully" });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}
