"use server";

import { prisma } from "@/lib/db/prisma";
import { requireProjectAccess } from "@/lib/auth/session";
import { createBoardColumnSchema, updateBoardColumnSchema } from "@/lib/validators";
import { broadcastProjectEvent } from "@/lib/realtime/events";
import { ISSUE_STATUSES } from "@/lib/constants";
import { z } from "zod";

export interface BoardColumnData {
  id: string;
  projectId: string;
  name: string;
  key: string;
  color: string;
  order: number;
}

/**
 * Initializes default columns for a project if none exist yet.
 */
export async function initializeDefaultColumns(projectId: string) {
  const existingCount = await prisma.boardColumn.count({
    where: { projectId },
  });

  if (existingCount === 0) {
    const defaultCols = ISSUE_STATUSES.map((status, index) => ({
      projectId,
      name: status.label,
      key: status.id,
      color: "#737373",
      order: index * 1000,
    }));

    await prisma.boardColumn.createMany({
      data: defaultCols,
      skipDuplicates: true,
    });
  }

  return prisma.boardColumn.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
  });
}

/**
 * Retrieves all columns for a project (creates defaults if none exist).
 */
export async function getProjectColumns(projectId: string): Promise<BoardColumnData[]> {
  await requireProjectAccess(projectId, "VIEWER");

  let columns = await prisma.boardColumn.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
  });

  if (columns.length === 0) {
    columns = await initializeDefaultColumns(projectId);
  }

  return columns;
}

/**
 * Creates a new custom column / list in a project board (Project OWNER / Co-Owner only)
 */
export async function createBoardColumn(
  projectId: string,
  input: z.infer<typeof createBoardColumnSchema>
) {
  const { user, project } = await requireProjectAccess(projectId, "OWNER");

  const parsed = createBoardColumnSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, color } = parsed.data;

  // Generate safe unique key within the project
  const baseKey = name.toUpperCase().trim().replace(/[^A-Z0-9]/g, "_").slice(0, 20);
  const key = `${baseKey}_${Date.now().toString().slice(-4)}`;

  // Find max order
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

  // Log activity
  await prisma.activityLog.create({
    data: {
      workspaceId: project.workspaceId,
      actorId: user.id,
      action: "COLUMN_CREATED",
      details: {
        columnId: column.id,
        name: column.name,
        key: column.key,
      },
    },
  });

  // Broadcast real-time event to all board viewers
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

  return { success: true, column };
}

/**
 * Updates an existing board column (Rename, Change Color, or Reorder) (Project OWNER / Co-Owner only)
 */
export async function updateBoardColumn(
  columnId: string,
  input: z.infer<typeof updateBoardColumnSchema>
) {
  const column = await prisma.boardColumn.findUnique({
    where: { id: columnId },
    include: { project: true },
  });

  if (!column) {
    return { error: "Column not found" };
  }

  const { user, project } = await requireProjectAccess(column.projectId, "OWNER");

  const parsed = updateBoardColumnSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const updatedColumn = await prisma.boardColumn.update({
    where: { id: columnId },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.color !== undefined && { color: parsed.data.color }),
      ...(parsed.data.order !== undefined && { order: parsed.data.order }),
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      workspaceId: project.workspaceId,
      actorId: user.id,
      action: "COLUMN_UPDATED",
      details: {
        columnId: column.id,
        changes: parsed.data,
      },
    },
  });

  // Broadcast real-time update
  broadcastProjectEvent({
    type: "COLUMN_UPDATED",
    projectId: column.projectId,
    timestamp: Date.now(),
    actor: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    },
    data: {
      column: updatedColumn,
    },
  });

  return { success: true, column: updatedColumn };
}

/**
 * Reorders columns on a board (Project OWNER / Co-Owner only)
 */
export async function reorderBoardColumns(
  projectId: string,
  orderedColumnIds: string[]
) {
  const { user, project } = await requireProjectAccess(projectId, "OWNER");

  await prisma.$transaction(
    orderedColumnIds.map((id, index) =>
      prisma.boardColumn.update({
        where: { id },
        data: { order: index * 1000 },
      })
    )
  );

  // Broadcast real-time reorder
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

  return { success: true };
}

/**
 * Deletes a custom board column. Moves any issues in that column to fallback column.
 * (Project OWNER / Co-Owner only)
 */
export async function deleteBoardColumn(columnId: string) {
  const column = await prisma.boardColumn.findUnique({
    where: { id: columnId },
    include: { project: true },
  });

  if (!column) {
    return { error: "Column not found" };
  }

  const { user, project } = await requireProjectAccess(column.projectId, "OWNER");

  // Prevent deleting if it's the only column left
  const totalColumns = await prisma.boardColumn.count({
    where: { projectId: column.projectId },
  });

  if (totalColumns <= 1) {
    return { error: "Cannot delete the only remaining column on the board." };
  }

  // Delete column and reassign any issues in this column to TODO (or first remaining column)
  await prisma.$transaction(async (tx) => {
    const otherColumn = await tx.boardColumn.findFirst({
      where: { projectId: column.projectId, id: { not: columnId } },
      orderBy: { order: "asc" },
    });

    const fallbackStatus = (otherColumn?.key as any) || "TODO";

    await tx.issue.updateMany({
      where: {
        projectId: column.projectId,
        status: column.key as any,
      },
      data: {
        status: fallbackStatus,
      },
    });

    await tx.boardColumn.delete({
      where: { id: columnId },
    });

    await tx.activityLog.create({
      data: {
        workspaceId: project.workspaceId,
        actorId: user.id,
        action: "COLUMN_DELETED",
        details: {
          columnId,
          name: column.name,
          fallbackStatus,
        },
      },
    });
  });

  // Broadcast real-time deletion
  broadcastProjectEvent({
    type: "COLUMN_DELETED",
    projectId: column.projectId,
    timestamp: Date.now(),
    actor: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    },
    data: {
      columnId,
      columnKey: column.key,
    },
  });

  return { success: true };
}
