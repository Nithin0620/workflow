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
import { updateProjectSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ projectId: string }> | { projectId: string };
};

async function getProjectId(context: RouteContext): Promise<string> {
  const resolved = await context.params;
  return resolved.projectId;
}

/**
 * Helper to check user access and effective role for a project.
 * - Workspace OWNER or ADMIN => effective role "OWNER"
 * - Project member => assigned ProjectRole ("OWNER", "EDITOR", "VIEWER")
 * - If not explicitly member but workspace MEMBER:
 *     - If project.isPrivate => no access (null)
 *     - If not private => "EDITOR" (or "VIEWER" if workspace role is VIEWER)
 */
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
 * GET /api/v1/projects/[projectId]
 * Returns project with columns, members, active sprint, repository, and issue count.
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

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        columns: {
          orderBy: { order: "asc" },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, image: true, email: true } },
          },
        },
        lead: {
          select: { id: true, name: true, image: true, email: true },
        },
        sprints: {
          where: { isActive: true },
          take: 1,
        },
        repository: {
          select: {
            id: true,
            repoUrl: true,
            repoOwner: true,
            repoName: true,
            defaultBranch: true,
            aiScanEnabled: true,
            cronSchedule: true,
            lastScannedAt: true,
            status: true,
          },
        },
        _count: {
          select: {
            issues: true,
            members: true,
            columns: true,
          },
        },
      },
    });

    if (!project) {
      return apiNotFound("Project not found");
    }

    const activeSprint = project.sprints[0] || null;

    return apiSuccess({
      project: {
        ...project,
        activeSprint,
        role: access.effectiveRole,
      },
    });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * PATCH /api/v1/projects/[projectId]
 * Updates project details (name, description, color, isPrivate, leadId).
 * Requires project EDITOR or OWNER role.
 */
export async function PATCH(req: Request | NextRequest, context: RouteContext) {
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
      return apiForbidden("You do not have permission to update this project");
    }

    const body = await req.json();
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid update payload", 400);
    }

    const { name, description, color, isPrivate, leadId } = parsed.data;

    // If changing leadId, ensure target user is a workspace member
    if (leadId) {
      const targetMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: access.project.workspaceId,
            userId: leadId,
          },
        },
      });
      if (!targetMember) {
        return apiError("Project lead must be a member of the workspace", 400);
      }
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(isPrivate !== undefined && { isPrivate }),
        ...(leadId !== undefined && { leadId }),
      },
      include: {
        lead: {
          select: { id: true, name: true, image: true, email: true },
        },
        columns: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            issues: true,
            members: true,
            columns: true,
          },
        },
      },
    });

    return apiSuccess({
      project: {
        ...updated,
        role: access.effectiveRole,
      },
    });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * DELETE /api/v1/projects/[projectId]
 * Deletes project.
 * Requires project OWNER role (or workspace OWNER/ADMIN).
 */
export async function DELETE(req: Request | NextRequest, context: RouteContext) {
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

    if (access.effectiveRole !== "OWNER") {
      return apiForbidden("Only project owners or workspace admins can delete this project");
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return apiSuccess({ message: "Project deleted successfully" });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}
