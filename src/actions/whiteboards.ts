"use server";

import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceMember, requireWhiteboardAccess } from "@/lib/auth/session";
import {
  createWhiteboardSchema,
  updateWhiteboardSchema,
  linkWhiteboardProjectSchema,
} from "@/lib/validators";
import { z } from "zod";

export type CreateWhiteboardInput = z.infer<typeof createWhiteboardSchema>;
export type UpdateWhiteboardInput = z.infer<typeof updateWhiteboardSchema>;

/**
 * Creates a new Whiteboard in a workspace, optionally linking to one or more projects
 */
export async function createWhiteboard(workspaceId: string, input: CreateWhiteboardInput) {
  const { user } = await requireWorkspaceMember(workspaceId, ["OWNER", "ADMIN", "MEMBER"]);

  const parsed = createWhiteboardSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, description, initialData, projectIds } = parsed.data;

  const whiteboard = await prisma.whiteboard.create({
    data: {
      title,
      description: description || null,
      data: initialData ?? [],
      workspaceId,
      createdById: user.id,
      projects: projectIds && projectIds.length > 0
        ? {
            create: projectIds.map((projectId) => ({
              projectId,
            })),
          }
        : undefined,
    },
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

  // Log activity
  await prisma.activityLog.create({
    data: {
      workspaceId,
      actorId: user.id,
      action: "WHITEBOARD_CREATED",
      details: {
        whiteboardId: whiteboard.id,
        title: whiteboard.title,
        linkedProjectsCount: whiteboard.projects.length,
      },
    },
  });

  return { data: whiteboard };
}

/**
 * Updates a whiteboard's title, description, data elements, app state, or thumbnail
 */
export async function updateWhiteboard(whiteboardId: string, input: UpdateWhiteboardInput) {
  const { user, whiteboard } = await requireWhiteboardAccess(whiteboardId, "EDITOR");

  const parsed = updateWhiteboardSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, description, data, appState, thumbnail, projectIds } = parsed.data;

  // Handle project re-linking if projectIds is explicitly provided
  let projectUpdate = undefined;
  if (projectIds !== undefined) {
    projectUpdate = {
      deleteMany: {},
      create: projectIds.map((projectId) => ({ projectId })),
    };
  }

  const updated = await prisma.whiteboard.update({
    where: { id: whiteboardId },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(data !== undefined ? { data } : {}),
      ...(appState !== undefined ? { appState } : {}),
      ...(thumbnail !== undefined ? { thumbnail } : {}),
      ...(projectUpdate ? { projects: projectUpdate } : {}),
    },
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

  return { data: updated };
}

/**
 * Deletes a whiteboard
 */
export async function deleteWhiteboard(whiteboardId: string) {
  const { user, whiteboard } = await requireWhiteboardAccess(whiteboardId, "EDITOR");

  await prisma.whiteboard.delete({
    where: { id: whiteboardId },
  });

  await prisma.activityLog.create({
    data: {
      workspaceId: whiteboard.workspaceId,
      actorId: user.id,
      action: "WHITEBOARD_DELETED",
      details: {
        whiteboardId,
        title: whiteboard.title,
      },
    },
  });

  return { success: true };
}

/**
 * Links a whiteboard to an additional project
 */
export async function linkWhiteboardToProject(whiteboardId: string, projectId: string) {
  const parsed = linkWhiteboardProjectSchema.safeParse({ whiteboardId, projectId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { whiteboard } = await requireWhiteboardAccess(whiteboardId, "EDITOR");

  // Verify project belongs to same workspace
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project || project.workspaceId !== whiteboard.workspaceId) {
    return { error: "Target project does not exist in the same workspace." };
  }

  const link = await prisma.projectWhiteboard.upsert({
    where: {
      projectId_whiteboardId: {
        projectId,
        whiteboardId,
      },
    },
    create: {
      projectId,
      whiteboardId,
    },
    update: {},
  });

  return { data: link };
}

/**
 * Unlinks a whiteboard from a specific project
 */
export async function unlinkWhiteboardFromProject(whiteboardId: string, projectId: string) {
  const parsed = linkWhiteboardProjectSchema.safeParse({ whiteboardId, projectId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await requireWhiteboardAccess(whiteboardId, "EDITOR");

  await prisma.projectWhiteboard.deleteMany({
    where: {
      projectId,
      whiteboardId,
    },
  });

  return { success: true };
}

/**
 * Fetches all whiteboards in a workspace (with project links)
 */
export async function getWorkspaceWhiteboards(workspaceId: string) {
  await requireWorkspaceMember(workspaceId);

  const whiteboards = await prisma.whiteboard.findMany({
    where: { workspaceId },
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
    orderBy: { updatedAt: "desc" },
  });

  return { data: whiteboards };
}

/**
 * Fetches all whiteboards linked to a specific project
 */
export async function getProjectWhiteboards(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { workspaceId: true },
  });

  if (!project) {
    return { error: "Project not found" };
  }

  await requireWorkspaceMember(project.workspaceId);

  const links = await prisma.projectWhiteboard.findMany({
    where: { projectId },
    include: {
      whiteboard: {
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
      },
    },
    orderBy: { linkedAt: "desc" },
  });

  return { data: links.map((l) => l.whiteboard) };
}

/**
 * Retrieves a single whiteboard by ID with access verification
 */
export async function getWhiteboardById(whiteboardId: string) {
  const { user, whiteboard, canEdit, role } = await requireWhiteboardAccess(whiteboardId, "VIEWER");

  return {
    data: whiteboard,
    currentUserId: user.id,
    canEdit,
    role,
  };
}
