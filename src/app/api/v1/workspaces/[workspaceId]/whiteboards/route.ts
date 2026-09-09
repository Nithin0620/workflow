import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  getApiUser,
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
} from "@/lib/api/auth";

type RouteContext = {
  params: Promise<{ workspaceId: string }> | { workspaceId: string };
};

async function getWorkspaceId(context: RouteContext): Promise<string> {
  const resolved = await context.params;
  return resolved.workspaceId;
}

/**
 * GET /api/v1/workspaces/[workspaceId]/whiteboards
 * Returns all whiteboards in a workspace (metadata only, not canvas data), newest first.
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

    const whiteboards = await prisma.whiteboard.findMany({
      where: { workspaceId },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        createdAt: true,
        updatedAt: true,
        projects: {
          include: {
            project: {
              select: { id: true, name: true, key: true, color: true },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, image: true, email: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return apiSuccess({ whiteboards });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}