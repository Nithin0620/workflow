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
import { createIssueSchema } from "@/lib/validators";
import { broadcastProjectEvent } from "@/lib/realtime/events";
import { createUserNotification } from "@/actions/notifications";
import { IssuePriority, IssueStatus, Prisma } from "@prisma/client";

type RouteContext = {
  params: Promise<{ projectId: string }> | { projectId: string };
};

async function getProjectId(context: RouteContext): Promise<string> {
  const resolved = await context.params;
  return resolved.projectId;
}

async function checkProjectRole(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        where: { userId },
      },
    },
  });

  if (!project) return null;

  const workspaceMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: project.workspaceId,
        userId,
      },
    },
  });

  if (!workspaceMember) return null;

  let effectiveRole: "OWNER" | "EDITOR" | "VIEWER" | null = null;

  if (workspaceMember.role === "OWNER" || workspaceMember.role === "ADMIN") {
    effectiveRole = "OWNER";
  } else if (project.members.length > 0) {
    effectiveRole = project.members[0].role;
  } else if (project.isPrivate) {
    effectiveRole = null;
  } else {
    effectiveRole = workspaceMember.role === "VIEWER" ? "VIEWER" : "EDITOR";
  }

  return { project, workspaceMember, effectiveRole };
}

/**
 * GET /api/v1/projects/[projectId]/issues
 * Query params: sprintId, columnId, assigneeId, priority, search
 * Returns issues with assignees, labels, sprint, column, commentsCount, attachmentsCount.
 */
export async function GET(req: Request | NextRequest, context: RouteContext) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const projectId = await getProjectId(context);
    const access = await checkProjectRole(projectId, user.id);

    if (!access || !access.effectiveRole) {
      return apiNotFound("Project not found or access denied");
    }

    const url = new URL(req.url);
    const sprintIdParam = url.searchParams.get("sprintId");
    const columnIdParam = url.searchParams.get("columnId");
    const assigneeIdParam = url.searchParams.get("assigneeId");
    const priorityParam = url.searchParams.get("priority");
    const searchParam = url.searchParams.get("search");

    const where: Prisma.IssueWhereInput = {
      projectId,
    };

    if (sprintIdParam !== null) {
      if (sprintIdParam === "none" || sprintIdParam === "null" || sprintIdParam === "backlog") {
        where.sprintId = null;
      } else if (sprintIdParam.trim()) {
        where.sprintId = sprintIdParam;
      }
    }

    if (columnIdParam) {
      if (Object.values(IssueStatus).includes(columnIdParam as IssueStatus)) {
        where.status = columnIdParam as IssueStatus;
      } else {
        const col = await prisma.boardColumn.findFirst({
          where: {
            projectId,
            OR: [{ id: columnIdParam }, { key: columnIdParam }],
          },
        });
        if (col && Object.values(IssueStatus).includes(col.key as IssueStatus)) {
          where.status = col.key as IssueStatus;
        }
      }
    }

    if (assigneeIdParam !== null) {
      if (assigneeIdParam === "unassigned" || assigneeIdParam === "none" || assigneeIdParam === "null") {
        where.assigneeId = null;
      } else if (assigneeIdParam.trim()) {
        where.assigneeId = assigneeIdParam;
      }
    }

    if (priorityParam && Object.values(IssuePriority).includes(priorityParam as IssuePriority)) {
      where.priority = priorityParam as IssuePriority;
    }

    if (searchParam && searchParam.trim()) {
      const q = searchParam.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const [issues, columns] = await Promise.all([
      prisma.issue.findMany({
        where,
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
        orderBy: { order: "asc" },
      }),
      prisma.boardColumn.findMany({
        where: { projectId },
        orderBy: { order: "asc" },
      }),
    ]);

    const columnMap = new Map<string, (typeof columns)[0]>();
    columns.forEach((col) => {
      columnMap.set(col.key, col);
    });

    const enrichedIssues = issues.map((issue) => {
      const column = columnMap.get(issue.status) || null;
      return {
        ...issue,
        column,
        commentsCount: issue._count.comments,
        attachmentsCount: issue._count.attachments,
      };
    });

    return apiSuccess({ issues: enrichedIssues });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * POST /api/v1/projects/[projectId]/issues
 * Creates a new issue, generates next issue sequence/key, links assignees, labels, sprint.
 * Creates activity log and sends notification.
 * Requires EDITOR or OWNER role.
 */
export async function POST(req: Request | NextRequest, context: RouteContext) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const projectId = await getProjectId(context);
    const access = await checkProjectRole(projectId, user.id);

    if (!access || !access.effectiveRole) {
      return apiNotFound("Project not found or access denied");
    }

    if (access.effectiveRole === "VIEWER") {
      return apiForbidden("You do not have permission to create issues in this project");
    }

    const body = await req.json();
    const parsed = createIssueSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid issue payload", 400);
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
    } = parsed.data;

    if (sprintId) {
      const sprint = await prisma.sprint.findFirst({
        where: { id: sprintId, projectId },
      });
      if (!sprint) {
        return apiError("Sprint not found in this project", 400);
      }
    }

    if (assigneeId) {
      const assigneeWsMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: access.project.workspaceId,
            userId: assigneeId,
          },
        },
      });
      if (!assigneeWsMember) {
        return apiError("Assignee is not a member of this workspace", 400);
      }
    }

    const issue = await prisma.$transaction(async (tx) => {
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: { issueSequence: { increment: 1 } },
      });

      const issueNumber = updatedProject.issueSequence;

      const lastIssue = await tx.issue.findFirst({
        where: { projectId, status: status as IssueStatus },
        orderBy: { order: "desc" },
      });

      const order = lastIssue ? lastIssue.order + 1000 : 1000;

      const newIssue = await tx.issue.create({
        data: {
          projectId,
          projectKey: access.project.key,
          issueNumber,
          title,
          description: description || null,
          status: (status as IssueStatus) || IssueStatus.TODO,
          priority: (priority as IssuePriority) || IssuePriority.MEDIUM,
          order,
          assigneeId: assigneeId || null,
          creatorId: user.id,
          sprintId: sprintId || null,
          estimate: estimate ?? null,
          dueDate: dueDate ? new Date(dueDate) : null,
          ...(labelIds && labelIds.length > 0
            ? {
                labels: {
                  connect: labelIds.map((id) => ({ id })),
                },
              }
            : {}),
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

      await tx.activityLog.create({
        data: {
          workspaceId: access.project.workspaceId,
          issueId: newIssue.id,
          actorId: user.id,
          action: "ISSUE_CREATED",
          details: {
            key: `${access.project.key}-${issueNumber}`,
            title: newIssue.title,
            status: newIssue.status,
          },
        },
      });

      return newIssue;
    });

    const column = await prisma.boardColumn.findFirst({
      where: { projectId, key: issue.status },
    });

    const responseIssue = {
      ...issue,
      column: column || null,
      commentsCount: issue._count.comments,
      attachmentsCount: issue._count.attachments,
    };

    if (assigneeId) {
      const isSelf = assigneeId === user.id;
      try {
        await createUserNotification({
          userId: assigneeId,
          title: isSelf ? "Issue Assigned to You" : "New Issue Assigned",
          message: isSelf
            ? `You assigned yourself to ${access.project.key}-${issue.issueNumber}: ${issue.title}`
            : `${user.name || "A teammate"} assigned you to ${access.project.key}-${issue.issueNumber}: ${issue.title}`,
        });
      } catch {
        // ignore notification error
      }
    }

    try {
      broadcastProjectEvent({
        type: "ISSUE_CREATED",
        projectId,
        timestamp: Date.now(),
        actor: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        data: {
          issue: {
            id: issue.id,
            projectKey: issue.projectKey,
            issueNumber: issue.issueNumber,
            title: issue.title,
            status: issue.status,
            priority: issue.priority,
            estimate: issue.estimate,
            sprintId: issue.sprintId,
            assignee: issue.assignee,
            _count: issue._count,
          },
        },
      });
    } catch {
      // ignore broadcast error
    }

    return apiSuccess({ issue: responseIssue }, 201);
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}
