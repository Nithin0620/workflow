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
import { updateSprintSchema } from "@/lib/validators";
import { broadcastProjectEvent } from "@/lib/realtime/events";

type RouteContext = {
  params: Promise<{ sprintId: string }> | { sprintId: string };
};

async function getSprintId(context: RouteContext): Promise<string> {
  const resolved = await context.params;
  return resolved.sprintId;
}

async function checkSprintAccess(sprintId: string, userId: string) {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
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

  if (!sprint) return null;

  const workspaceMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: sprint.project.workspaceId,
        userId,
      },
    },
  });

  if (!workspaceMember) return null;

  let effectiveRole: "OWNER" | "EDITOR" | "VIEWER" | null = null;

  if (workspaceMember.role === "OWNER" || workspaceMember.role === "ADMIN") {
    effectiveRole = "OWNER";
  } else if (sprint.project.members.length > 0) {
    effectiveRole = sprint.project.members[0].role;
  } else if (sprint.project.isPrivate) {
    effectiveRole = null;
  } else {
    effectiveRole = workspaceMember.role === "VIEWER" ? "VIEWER" : "EDITOR";
  }

  return { sprint, project: sprint.project, workspaceMember, effectiveRole };
}

/**
 * GET /api/v1/sprints/[sprintId]
 * Returns sprint detail and issues in sprint.
 */
export async function GET(req: Request | NextRequest, context: RouteContext) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const sprintId = await getSprintId(context);
    const access = await checkSprintAccess(sprintId, user.id);

    if (!access || !access.effectiveRole) {
      return apiNotFound("Sprint not found or access denied");
    }

    const [sprint, issues, columns] = await Promise.all([
      prisma.sprint.findUnique({
        where: { id: sprintId },
      }),
      prisma.issue.findMany({
        where: { sprintId },
        include: {
          assignee: {
            select: { id: true, name: true, image: true, email: true },
          },
          creator: {
            select: { id: true, name: true, image: true, email: true },
          },
          labels: true,
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
        where: { projectId: access.project.id },
        orderBy: { order: "asc" },
      }),
    ]);

    if (!sprint) {
      return apiNotFound("Sprint not found");
    }

    const columnMap = new Map<string, (typeof columns)[0]>();
    columns.forEach((col) => {
      columnMap.set(col.key, col);
    });

    const enrichedIssues = issues.map((issue) => ({
      ...issue,
      column: columnMap.get(issue.status) || null,
      commentsCount: issue._count.comments,
      attachmentsCount: issue._count.attachments,
    }));

    const totalIssues = enrichedIssues.length;
    const completedIssues = enrichedIssues.filter((i) => i.status === "DONE").length;
    const openIssues = totalIssues - completedIssues;
    const totalPoints = enrichedIssues.reduce((sum, i) => sum + (i.estimate || 0), 0);
    const completedPoints = enrichedIssues
      .filter((i) => i.status === "DONE")
      .reduce((sum, i) => sum + (i.estimate || 0), 0);
    const openPoints = totalPoints - completedPoints;

    return apiSuccess({
      sprint: {
        ...sprint,
        totalIssues,
        openIssues,
        completedIssues,
        totalPoints,
        openPoints,
        completedPoints,
      },
      issues: enrichedIssues,
    });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * PATCH /api/v1/sprints/[sprintId]
 * Updates sprint metadata (name, dates, goal) or transitions status
 * (PLANNED -> ACTIVE, ACTIVE -> COMPLETED, or isActive boolean).
 * Requires EDITOR or OWNER role.
 */
export async function PATCH(req: Request | NextRequest, context: RouteContext) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const sprintId = await getSprintId(context);
    const access = await checkSprintAccess(sprintId, user.id);

    if (!access || !access.effectiveRole) {
      return apiNotFound("Sprint not found or access denied");
    }

    if (access.effectiveRole === "VIEWER") {
      return apiForbidden("You do not have permission to update this sprint");
    }

    const body = await req.json();
    const parsed = updateSprintSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid update payload", 400);
    }

    const { name, goal, startDate, endDate, isActive, status } = parsed.data;

    let targetIsActive = isActive;
    let isCompleting = false;

    if (status === "ACTIVE") {
      targetIsActive = true;
    } else if (status === "COMPLETED") {
      targetIsActive = false;
      isCompleting = true;
    } else if (status === "PLANNED") {
      targetIsActive = false;
    } else if (isActive === false && access.sprint.isActive) {
      isCompleting = true;
    }

    const updatedSprint = await prisma.$transaction(async (tx) => {
      // If setting to active, deactivate other active sprints in the project
      if (targetIsActive === true) {
        await tx.sprint.updateMany({
          where: {
            projectId: access.project.id,
            isActive: true,
            id: { not: sprintId },
          },
          data: { isActive: false },
        });
      }

      // If completing sprint, move unfinished issues back to backlog (sprintId: null)
      if (isCompleting) {
        await tx.issue.updateMany({
          where: {
            sprintId,
            status: { notIn: ["DONE", "CANCELED"] },
          },
          data: { sprintId: null },
        });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (goal !== undefined) updateData.goal = goal || null;
      if (startDate !== undefined) updateData.startDate = new Date(startDate);
      if (endDate !== undefined) updateData.endDate = new Date(endDate);
      if (targetIsActive !== undefined) updateData.isActive = targetIsActive;
      if (isCompleting && !endDate) updateData.endDate = new Date();

      const result = await tx.sprint.update({
        where: { id: sprintId },
        data: updateData,
      });

      let action = "SPRINT_UPDATED";
      if (targetIsActive === true && !access.sprint.isActive) {
        action = "SPRINT_STARTED";
      } else if (isCompleting) {
        action = "SPRINT_COMPLETED";
      }

      await tx.activityLog.create({
        data: {
          workspaceId: access.project.workspaceId,
          actorId: user.id,
          action,
          details: { sprintId: result.id, name: result.name, status, isActive: targetIsActive },
        },
      });

      return result;
    });

    try {
      broadcastProjectEvent({
        type: "SPRINT_UPDATED",
        projectId: access.project.id,
        timestamp: Date.now(),
        actor: { id: user.id, name: user.name, email: user.email, image: user.image },
        data: { sprintId: updatedSprint.id, isActive: updatedSprint.isActive },
      });
    } catch {
      // ignore broadcast failure
    }

    return apiSuccess({ sprint: updatedSprint });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * DELETE /api/v1/sprints/[sprintId]
 * Deletes sprint and unassigns all issues (moves to backlog).
 * Requires EDITOR or OWNER role.
 */
export async function DELETE(req: Request | NextRequest, context: RouteContext) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const sprintId = await getSprintId(context);
    const access = await checkSprintAccess(sprintId, user.id);

    if (!access || !access.effectiveRole) {
      return apiNotFound("Sprint not found or access denied");
    }

    if (access.effectiveRole === "VIEWER") {
      return apiForbidden("You do not have permission to delete this sprint");
    }

    await prisma.$transaction(async (tx) => {
      await tx.issue.updateMany({
        where: { sprintId },
        data: { sprintId: null },
      });

      await tx.sprint.delete({
        where: { id: sprintId },
      });

      await tx.activityLog.create({
        data: {
          workspaceId: access.project.workspaceId,
          actorId: user.id,
          action: "SPRINT_DELETED",
          details: { sprintId, name: access.sprint.name },
        },
      });
    });

    try {
      broadcastProjectEvent({
        type: "SPRINT_DELETED",
        projectId: access.project.id,
        timestamp: Date.now(),
        actor: { id: user.id, name: user.name, email: user.email, image: user.image },
        data: { sprintId },
      });
    } catch {
      // ignore broadcast failure
    }

    return apiSuccess({ message: "Sprint deleted successfully" });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}
