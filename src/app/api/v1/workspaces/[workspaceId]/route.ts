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
import { updateWorkspaceSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ workspaceId: string }> | { workspaceId: string };
};

async function getWorkspaceId(context: RouteContext): Promise<string> {
  const resolved = await context.params;
  return resolved.workspaceId;
}

/**
 * GET /api/v1/workspaces/[workspaceId]
 * Returns workspace details, organization, banners, and counts for members and projects.
 * Caller must be a member of the workspace.
 */
export async function GET(req: Request | NextRequest, context: RouteContext) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const workspaceId = await getWorkspaceId(context);

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return apiNotFound("Workspace not found or access denied");
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        organization: true,
        banners: {
          select: { id: true, imageUrl: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
        _count: {
          select: {
            members: true,
            projects: true,
            discussionChannels: true,
          },
        },
      },
    });

    if (!workspace) {
      return apiNotFound("Workspace not found");
    }

    return apiSuccess({
      workspace: {
        ...workspace,
        role: membership.role,
      },
    });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * PATCH /api/v1/workspaces/[workspaceId]
 * Updates workspace details (name, slug, description).
 * Caller must be an OWNER or ADMIN.
 */
export async function PATCH(req: Request | NextRequest, context: RouteContext) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const workspaceId = await getWorkspaceId(context);

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
      include: {
        workspace: true,
      },
    });

    if (!membership) {
      return apiNotFound("Workspace not found or access denied");
    }

    if (!["OWNER", "ADMIN"].includes(membership.role)) {
      return apiForbidden("Only owners and admins can update this workspace");
    }

    const body = await req.json();
    const parsed = updateWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid update payload", 400);
    }

    const { name, slug, description } = parsed.data;

    if (slug && slug !== membership.workspace.slug) {
      const existingSlug = await prisma.workspace.findUnique({
        where: {
          organizationId_slug: {
            organizationId: membership.workspace.organizationId,
            slug,
          },
        },
      });

      if (existingSlug && existingSlug.id !== workspaceId) {
        return apiError("A workspace with this slug already exists in this organization", 400);
      }
    }

    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
      },
      include: {
        organization: true,
        banners: {
          select: { id: true, imageUrl: true },
        },
        _count: {
          select: {
            members: true,
            projects: true,
            discussionChannels: true,
          },
        },
      },
    });

    return apiSuccess({
      workspace: {
        ...updated,
        role: membership.role,
      },
    });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * DELETE /api/v1/workspaces/[workspaceId]
 * Deletes workspace and all nested resources.
 * Caller must be an OWNER.
 */
export async function DELETE(req: Request | NextRequest, context: RouteContext) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const workspaceId = await getWorkspaceId(context);

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return apiNotFound("Workspace not found or access denied");
    }

    if (membership.role !== "OWNER") {
      return apiForbidden("Only workspace owners can delete this workspace");
    }

    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return apiSuccess({ message: "Workspace deleted successfully" });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}
