import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  getApiUser,
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
} from "@/lib/api/auth";
import { createColumnSchema, reorderColumnsSchema } from "@/lib/validators";
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
 * GET /api/v1/projects/[projectId]/columns
 * Returns list of columns for the project ordered by position (order).
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

    const columns = await prisma.boardColumn.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    });

    return apiSuccess({ columns });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * POST /api/v1/projects/[projectId]/columns
 * Handles either:
 * 1) Column creation (when name provided): Validates createColumnSchema, generates key, appends order, returns 201.
 * 2) Column reordering (when orderedColumnIds provided): Updates order of all columns in transaction, returns 200.
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
      return apiForbidden("You do not have permission to modify project columns");
    }

    const body = await req.json();

    // Check if reordering payload
    if (body?.orderedColumnIds && Array.isArray(body.orderedColumnIds)) {
      const reorderParsed = reorderColumnsSchema.safeParse(body);
      if (!reorderParsed.success) {
        return apiError(reorderParsed.error.issues[0]?.message || "Invalid reorder payload", 400);
      }

      const { orderedColumnIds } = reorderParsed.data;

      // Verify all columns belong to this project
      const existingColumns = await prisma.boardColumn.findMany({
        where: {
          id: { in: orderedColumnIds },
          projectId,
        },
        select: { id: true },
      });

      if (existingColumns.length !== orderedColumnIds.length) {
        return apiError("Some columns not found in this project", 400);
      }

      await prisma.$transaction(
        orderedColumnIds.map((id, index) =>
          prisma.boardColumn.update({
            where: { id },
            data: { order: index * 1000 },
          })
        )
      );

      try {
        broadcastProjectEvent({
          type: "COLUMN_UPDATED",
          projectId,
          timestamp: Date.now(),
          actor: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          },
          data: {
            reorderedIds: orderedColumnIds,
          },
        });
      } catch {
        // broadcast error shouldn't fail API
      }

      const updatedColumns = await prisma.boardColumn.findMany({
        where: { projectId },
        orderBy: { order: "asc" },
      });

      return apiSuccess({ columns: updatedColumns });
    }

    // Column Creation payload
    const createParsed = createColumnSchema.safeParse(body);
    if (!createParsed.success) {
      return apiError(createParsed.error.issues[0]?.message || "Invalid column payload", 400);
    }

    const { name, color } = createParsed.data;

    // Generate unique key within project
    const baseKey = name.toUpperCase().trim().replace(/[^A-Z0-9]/g, "_").slice(0, 20);
    const key = `${baseKey}_${Date.now().toString().slice(-4)}`;

    const lastCol = await prisma.boardColumn.findFirst({
      where: { projectId },
      orderBy: { order: "desc" },
    });

    const order = lastCol ? lastCol.order + 1000 : 1000;

    const column = await prisma.boardColumn.create({
      data: {
        projectId,
        name,
        key,
        color: color || "#737373",
        order,
      },
    });

    await prisma.activityLog.create({
      data: {
        workspaceId: access.project.workspaceId,
        actorId: user.id,
        action: "COLUMN_CREATED",
        details: {
          columnId: column.id,
          name: column.name,
          key: column.key,
        },
      },
    });

    try {
      broadcastProjectEvent({
        type: "COLUMN_CREATED",
        projectId,
        timestamp: Date.now(),
        actor: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        data: {
          column,
        },
      });
    } catch {
      // ignore broadcast failure
    }

    return apiSuccess({ column }, 201);
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}
