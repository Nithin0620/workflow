"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireWorkspaceMember } from "@/lib/auth/session";
import { createIssueSchema, updateIssueSchema, createCommentSchema } from "@/lib/validators";
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
  const user = await requireAuth();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { workspace: true },
  });

  if (!project) {
    return { error: "Project not found" };
  }

  await requireWorkspaceMember(project.workspaceId, ["OWNER", "ADMIN", "MEMBER"]);

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
  const user = await requireAuth();

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { project: true },
  });

  if (!issue) {
    return { error: "Issue not found" };
  }

  await requireWorkspaceMember(issue.project.workspaceId, ["OWNER", "ADMIN", "MEMBER"]);

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
          workspaceId: issue.project.workspaceId,
          issueId: issue.id,
          actorId: user.id,
          action: "STATUS_CHANGED",
          details: { from: oldStatus, to: newStatus },
        },
      });
    }

    return updatedIssue;
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
  const user = await requireAuth();

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { project: true },
  });

  if (!issue) {
    return { error: "Issue not found" };
  }

  await requireWorkspaceMember(issue.project.workspaceId, ["OWNER", "ADMIN", "MEMBER"]);

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

  return { success: true, issue: updated };
}

/**
 * Adds a new comment to an issue
 */
export async function addIssueComment(issueId: string, content: string) {
  const user = await requireAuth();

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { project: true },
  });

  if (!issue) {
    return { error: "Issue not found" };
  }

  await requireWorkspaceMember(issue.project.workspaceId, ["OWNER", "ADMIN", "MEMBER"]);

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

  return { success: true, comment };
}

/**
 * Retrieves all issues for a given project grouped for Kanban board
 */
export async function getProjectIssues(projectId: string) {
  const user = await requireAuth();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return [];
  }

  await requireWorkspaceMember(project.workspaceId);

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
