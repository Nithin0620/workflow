"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireWorkspaceMember, requireProjectAccess } from "@/lib/auth/session";
import { createIssueSchema, updateIssueSchema, createCommentSchema } from "@/lib/validators";
import { broadcastProjectEvent } from "@/lib/realtime/events";
import { createUserNotification } from "@/actions/notifications";
import { IssueStatus, IssuePriority, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

/**
 * Creates a new issue with atomic auto-incremented issue number
 */
export async function createIssue(projectId: string, input: CreateIssueInput) {
  const { user, project } = await requireProjectAccess(projectId, "EDITOR");

  const parsed = createIssueSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, description, status, priority, assigneeId, sprintId, estimate, dueDate } = parsed.data;

  const issue = await prisma.$transaction(async (tx) => {
    // Atomically increment project issue sequence
    const updatedProject = await tx.project.update({
      where: { id: projectId },
      data: { issueSequence: { increment: 1 } },
    });

    const issueNumber = updatedProject.issueSequence;

    // Get max order in the target status column for placing at top
    const lastIssue = await tx.issue.findFirst({
      where: { projectId, status: status as IssueStatus },
      orderBy: { order: "desc" },
    });

    const order = lastIssue ? lastIssue.order + 1000 : 1000;

    const newIssue = await tx.issue.create({
      data: {
        projectId,
        projectKey: project.key,
        issueNumber,
        title,
        description,
        status: status as IssueStatus,
        priority: priority as IssuePriority,
        order,
        assigneeId: assigneeId || null,
        creatorId: user.id,
        sprintId: sprintId || null,
        estimate: estimate || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignee: { select: { id: true, name: true, image: true, email: true } },
        creator: { select: { id: true, name: true, image: true } },
      },
    });

    // Log Activity
    await tx.activityLog.create({
      data: {
        workspaceId: project.workspaceId,
        issueId: newIssue.id,
        actorId: user.id,
        action: "ISSUE_CREATED",
        details: {
          key: `${project.key}-${issueNumber}`,
          title: newIssue.title,
          status: newIssue.status,
        },
      },
    });

    return newIssue;
  });

  // Send notification if assigned to any user (including self)
  if (assigneeId) {
    const isSelf = assigneeId === user.id;
    await createUserNotification({
      userId: assigneeId,
      title: isSelf ? "Issue Assigned to You" : "New Issue Assigned",
      message: isSelf
        ? `You assigned yourself to ${project.key}-${issue.issueNumber}: ${issue.title}`
        : `${user.name || "A teammate"} assigned you to ${project.key}-${issue.issueNumber}: ${issue.title}`,
    });
  }

  // Broadcast real-time event to all teammates on this board
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
      issue,
    },
  });

  return { success: true, issue };
}

/**
 * Moves an issue to a new status / Kanban column position (Optimistic DND support)
 */
export async function moveIssue(
  issueId: string,
  newStatus: IssueStatus,
  newOrder: number
) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
  });

  if (!issue) {
    return { error: "Issue not found" };
  }

  const { user, project } = await requireProjectAccess(issue.projectId, "EDITOR");

  const oldStatus = issue.status;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedIssue = await tx.issue.update({
      where: { id: issueId },
      data: {
        status: newStatus,
        order: newOrder,
      },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
      },
    });

    if (oldStatus !== newStatus) {
      await tx.activityLog.create({
        data: {
          workspaceId: project.workspaceId,
          issueId: issue.id,
          actorId: user.id,
          action: "STATUS_CHANGED",
          details: { from: oldStatus, to: newStatus },
        },
      });
    }

    return updatedIssue;
  });

  // Broadcast real-time card move
  broadcastProjectEvent({
    type: "ISSUE_MOVED",
    projectId: issue.projectId,
    timestamp: Date.now(),
    actor: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    },
    data: {
      issueId,
      targetStatus: newStatus,
      newOrder,
    },
  });

  return { success: true, issue: updated };
}

/**
 * Retrieves full issue details including comments, activity logs, attachments, and members
 */
export async function getIssueDetails(issueId: string) {
  const user = await requireAuth();

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      project: {
        include: {
          workspace: {
            include: {
              members: {
                include: {
                  user: { select: { id: true, name: true, image: true, email: true } },
                },
              },
            },
          },
        },
      },
      assignee: { select: { id: true, name: true, image: true, email: true } },
      creator: { select: { id: true, name: true, image: true, email: true } },
      sprint: true,
      labels: true,
      attachments: {
        include: {
          uploader: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      comments: {
        include: {
          author: { select: { id: true, name: true, image: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      activityLogs: {
        include: {
          actor: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!issue) {
    return null;
  }

  await requireWorkspaceMember(issue.project.workspaceId);

  return issue;
}

/**
 * Updates issue details (title, description, status, priority, assignee, estimate, due date)
 */
export async function updateIssueDetails(issueId: string, input: UpdateIssueInput) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { project: true },
  });

  if (!issue) {
    return { error: "Issue not found" };
  }

  const { user } = await requireProjectAccess(issue.projectId, "EDITOR");

  const parsed = updateIssueSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, description, status, priority, assigneeId, sprintId, estimate, dueDate, order } = parsed.data;

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
      },
      include: {
        assignee: { select: { id: true, name: true, image: true, email: true } },
        creator: { select: { id: true, name: true, image: true } },
      },
    });

    // Record activity if key fields changed
    const changes: Record<string, Prisma.InputJsonValue> = {};
    if (status && status !== issue.status) changes.status = { from: issue.status, to: status };
    if (priority && priority !== issue.priority) changes.priority = { from: issue.priority, to: priority };
    if (assigneeId !== undefined && assigneeId !== issue.assigneeId) changes.assigneeId = { from: issue.assigneeId, to: assigneeId };
    if (title && title !== issue.title) changes.title = { from: issue.title, to: title };

    if (Object.keys(changes).length > 0) {
      await tx.activityLog.create({
        data: {
          workspaceId: issue.project.workspaceId,
          issueId: issue.id,
          actorId: user.id,
          action: "ISSUE_UPDATED",
          details: changes,
        },
      });
    }

    return updatedIssue;
  });

  // Send notification if newly assigned or reassigned (including self)
  if (assigneeId && assigneeId !== issue.assigneeId) {
    const isSelf = assigneeId === user.id;
    await createUserNotification({
      userId: assigneeId,
      title: "Issue Assigned to You",
      message: isSelf
        ? `You assigned yourself to ${issue.projectKey}-${issue.issueNumber}: ${updated.title}`
        : `${user.name || "A teammate"} assigned you to ${issue.projectKey}-${issue.issueNumber}: ${updated.title}`,
    });
  }

  // Broadcast real-time issue update
  broadcastProjectEvent({
    type: "ISSUE_UPDATED",
    projectId: issue.projectId,
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
        projectKey: issue.projectKey,
        issueNumber: issue.issueNumber,
        title: updated.title,
        status: updated.status,
        priority: updated.priority,
        estimate: updated.estimate,
        assignee: updated.assignee,
      },
    },
  });

  return { success: true, issue: updated };
}

/**
 * Adds a new comment to an issue
 */
export async function addIssueComment(issueId: string, content: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { project: true },
  });

  if (!issue) {
    return { error: "Issue not found" };
  }

  const { user } = await requireProjectAccess(issue.projectId, "VIEWER");

  const parsed = createCommentSchema.safeParse({ issueId, content });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const comment = await prisma.$transaction(async (tx) => {
    const newComment = await tx.comment.create({
      data: {
        issueId,
        authorId: user.id,
        content: parsed.data.content,
      },
      include: {
        author: { select: { id: true, name: true, image: true, email: true } },
      },
    });

    await tx.activityLog.create({
      data: {
        workspaceId: issue.project.workspaceId,
        issueId: issue.id,
        actorId: user.id,
        action: "COMMENT_ADDED",
        details: { commentId: newComment.id, snippet: content.slice(0, 80) },
      },
    });

    return newComment;
  });

  // 1. Notify assignee on comment
  if (issue.assigneeId) {
    const isSelfAssignee = issue.assigneeId === user.id;
    await createUserNotification({
      userId: issue.assigneeId,
      title: "New Comment on Assigned Issue",
      message: isSelfAssignee
        ? `You commented on your assigned issue ${issue.projectKey}-${issue.issueNumber}: "${content.slice(0, 60)}"`
        : `${user.name || "A teammate"} commented on your assigned issue ${issue.projectKey}-${issue.issueNumber}: "${content.slice(0, 60)}"`,
    });
  }

  // 2. Notify creator if creator is different from assignee
  if (issue.creatorId && issue.creatorId !== issue.assigneeId) {
    const isSelfCreator = issue.creatorId === user.id;
    await createUserNotification({
      userId: issue.creatorId,
      title: "New Comment on Your Issue",
      message: isSelfCreator
        ? `You commented on your issue ${issue.projectKey}-${issue.issueNumber}: "${content.slice(0, 60)}"`
        : `${user.name || "A teammate"} commented on your issue ${issue.projectKey}-${issue.issueNumber}: "${content.slice(0, 60)}"`,
    });
  }

  // Broadcast real-time comment
  broadcastProjectEvent({
    type: "COMMENT_ADDED",
    projectId: issue.projectId,
    timestamp: Date.now(),
    actor: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    },
    data: {
      issueId,
      comment: {
        id: comment.id,
        issueId: comment.issueId,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        author: comment.author,
      },
    },
  });

  return { success: true, comment };
}

/**
 * Deletes an issue by ID (Allowed for Project OWNER or issue creator)
 */
export async function deleteIssue(issueId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { project: { include: { workspace: true } } },
  });

  if (!issue) {
    return { error: "Issue not found" };
  }

  const { user, projectRole } = await requireProjectAccess(issue.projectId);

  // Only Project Owner or Creator can delete
  if (projectRole !== "OWNER" && issue.creatorId !== user.id) {
    return { error: "Forbidden: You do not have permission to delete this issue." };
  }

  await prisma.issue.delete({
    where: { id: issueId },
  });

  // Broadcast real-time deletion
  broadcastProjectEvent({
    type: "ISSUE_DELETED",
    projectId: issue.projectId,
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

  return { success: true };
}

/**
 * Retrieves all issues for a given project grouped for Kanban board
 */
export async function getProjectIssues(projectId: string) {
  await requireProjectAccess(projectId, "VIEWER");

  const issues = await prisma.issue.findMany({
    where: { projectId },
    include: {
      assignee: { select: { id: true, name: true, image: true, email: true } },
      creator: { select: { id: true, name: true, image: true } },
      labels: true,
      _count: {
        select: {
          comments: true,
          attachments: true,
        },
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  return issues;
}
