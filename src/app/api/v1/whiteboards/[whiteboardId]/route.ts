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
  params: Promise<{ whiteboardId: string }> | { whiteboardId: string };
};

async function getWhiteboardId(context: RouteContext): Promise<string> {
  const resolved = await context.params;
  return resolved.whiteboardId;
}

/**
 * GET /api/v1/whiteboards/[whiteboardId]
 * Returns a single whiteboard with full canvas data.
 */
export async function GET(req: Request | NextRequest, context: RouteContext) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const whiteboardId = await getWhiteboardId(context);

    const whiteboard = await prisma.whiteboard.findUnique({
      where: { id: whiteboardId },
      include: {
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
    });

    if (!whiteboard) {
      return apiNotFound("Whiteboard not found");
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: whiteboard.workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return apiNotFound("Whiteboard not found or access denied");
    }

    return apiSuccess({ whiteboard });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}