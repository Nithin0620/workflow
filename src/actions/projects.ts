"use server";

import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceMember } from "@/lib/auth/session";
import { createProjectSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/**
 * Creates a new project inside a workspace
 */
export async function createProject(workspaceId: string, input: CreateProjectInput) {
  const { user, workspace } = await requireWorkspaceMember(workspaceId, ["OWNER", "ADMIN", "MEMBER"]);

  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, key, description, color } = parsed.data;

  // Check if project key already exists in workspace
  const existingKey = await prisma.project.findUnique({
    where: {
      workspaceId_key: {
        workspaceId,
        key: key.toUpperCase(),
      },
    },
  });

  if (existingKey) {
    return { error: `A project with key '${key.toUpperCase()}' already exists in this workspace.` };
  }

  const project = await prisma.project.create({
    data: {
      name,
      key: key.toUpperCase(),
      description,
      color: color || "#3b82f6",
      workspaceId,
      leadId: user.id,
      issueSequence: 100, // Starts at #100
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      workspaceId,
      actorId: user.id,
      action: "PROJECT_CREATED",
      details: { projectId: project.id, projectName: project.name, projectKey: project.key },
    },
  });

  return { success: true, project };
}

/**
 * Retrieves all projects in a workspace
 */
export async function getWorkspaceProjects(workspaceId: string) {
  await requireWorkspaceMember(workspaceId);

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    include: {
      lead: {
        select: { id: true, name: true, image: true, email: true },
      },
      _count: {
        select: {
          issues: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return projects;
}
