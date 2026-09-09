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
import { addProjectMemberSchema } from "@/lib/validators";

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
 * GET /api/v1/projects/[projectId]/members
 * Returns project members with user info.
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

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return apiSuccess({ members });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * POST /api/v1/projects/[projectId]/members
 * Add or update project member role.
 * Requires project OWNER role (or workspace OWNER/ADMIN).
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

    if (access.effectiveRole !== "OWNER") {
      return apiForbidden("Only project owners can add or update project members");
    }

    const body = await req.json();
    const parsed = addProjectMemberSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid member payload", 400);
    }

    const { userId: targetUserId, role } = parsed.data;

    // Check if target user is in the workspace
    const targetWsMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: access.project.workspaceId,
          userId: targetUserId,
        },
      },
    });

    if (!targetWsMember) {
      return apiNotFound("Target user is not a member of this workspace");
    }

    const member = await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
      update: {
        role,
      },
      create: {
        projectId,
        userId: targetUserId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return apiSuccess({ member }, 200);
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * DELETE /api/v1/projects/[projectId]/members
 * Removes project member (by memberId or userId query/body param).
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
      return apiForbidden("Only project owners can remove project members");
    }

    const url = new URL(req.url);
    let memberId = url.searchParams.get("memberId");
    let targetUserId = url.searchParams.get("userId");

    if (!memberId && !targetUserId) {
      try {
        const body = await req.json();
        if (body?.memberId) memberId = body.memberId;
        if (body?.userId) targetUserId = body.userId;
      } catch {
        // no json body
      }
    }

    if (!memberId && !targetUserId) {
      return apiError("memberId or userId parameter is required", 400);
    }

    const targetMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        OR: [
          ...(memberId ? [{ id: memberId }] : []),
          ...(targetUserId ? [{ userId: targetUserId }] : []),
        ],
      },
    });

    if (!targetMember) {
      return apiNotFound("Member not found in this project");
    }

    await prisma.projectMember.delete({
      where: { id: targetMember.id },
    });

    return apiSuccess({ message: "Project member removed successfully" });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}
