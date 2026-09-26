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
import { createSprintSchema } from "@/lib/validators";
import { broadcastProjectEvent } from "@/lib/realtime/events";

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
 * GET /api/v1/projects/[projectId]/sprints
 * Returns sprints for project (active, planned, completed) with issue counts and point totals.
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

    const sprints = await prisma.sprint.findMany({
      where: { projectId },
      include: {
        issues: {
          select: {
            id: true,
            status: true,
            estimate: true,
          },
        },
      },
      orderBy: { number: "asc" },
    });

    const enrichedSprints = sprints.map((sprint) => {
      const totalIssues = sprint.issues.length;
      const completedIssues = sprint.issues.filter((i) => i.status === "DONE").length;
      const openIssues = totalIssues - completedIssues;
      const totalPoints = sprint.issues.reduce((sum, i) => sum + (i.estimate || 0), 0);
      const completedPoints = sprint.issues
        .filter((i) => i.status === "DONE")
        .reduce((sum, i) => sum + (i.estimate || 0), 0);
      const openPoints = totalPoints - completedPoints;

      // Status classification
      let status: "ACTIVE" | "COMPLETED" | "PLANNED" = "PLANNED";
      if (sprint.isActive) {
        status = "ACTIVE";
      } else if (new Date(sprint.endDate) < new Date() && !sprint.isActive) {
        status = "COMPLETED";
      }

      return {
        id: sprint.id,
        projectId: sprint.projectId,
        name: sprint.name,
        number: sprint.number,
        goal: sprint.goal,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        isActive: sprint.isActive,
        status,
        createdAt: sprint.createdAt,
        updatedAt: sprint.updatedAt,
        totalIssues,
        openIssues,
        completedIssues,
        totalPoints,
        openPoints,
        completedPoints,
      };
    });

    return apiSuccess({ sprints: enrichedSprints });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * POST /api/v1/projects/[projectId]/sprints
 * Creates a new sprint. Requires EDITOR or OWNER role.
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
      return apiForbidden("You do not have permission to create sprints in this project");
    }

    const body = await req.json();
    const parsed = createSprintSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid sprint payload", 400);
    }

    const { name, goal, startDate, endDate } = parsed.data;

    const lastSprint = await prisma.sprint.findFirst({
      where: { projectId },
      orderBy: { number: "desc" },
      select: { number: true },
    });

    const sprint = await prisma.sprint.create({
      data: {
        projectId,
        name,
        goal: goal || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        number: (lastSprint?.number ?? 0) + 1,
        isActive: false,
      },
    });

    await prisma.activityLog.create({
      data: {
        workspaceId: access.project.workspaceId,
        actorId: user.id,
        action: "SPRINT_CREATED",
        details: { sprintId: sprint.id, name: sprint.name },
      },
    });

    try {
      broadcastProjectEvent({
        type: "SPRINT_CREATED",
        projectId,
        timestamp: Date.now(),
        actor: { id: user.id, name: user.name, email: user.email, image: user.image },
        data: { sprint: { id: sprint.id, name: sprint.name, number: sprint.number } },
      });
    } catch {
      // ignore broadcast error
    }

    return apiSuccess({ sprint }, 201);
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}
