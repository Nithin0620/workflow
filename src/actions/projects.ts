"use server";

import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceMember, requireProjectAccess } from "@/lib/auth/session";
import { createProjectSchema } from "@/lib/validators";
import { ProjectRole } from "@prisma/client";
import { defaultBannerUrls } from "@/lib/banners";
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
  const duplicateKey = await prisma.project.findUnique({
    where: {
      workspaceId_key: {
        workspaceId,
        key: key.toUpperCase(),
      },
    },
  });

  if (duplicateKey) {
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
      banners: { create: defaultBannerUrls() },
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
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
 * Retrieves all projects in a workspace accessible to the current user
 */
export async function getWorkspaceProjects(workspaceId: string) {
  const { user, membership } = await requireWorkspaceMember(workspaceId);

  const projects = await prisma.project.findMany({
    where: {
      workspaceId,
      // If workspace member is viewer or regular member, check if private projects are restricted
      ...(membership.role !== "OWNER" && membership.role !== "ADMIN"
        ? {
            OR: [
              { isPrivate: false },
              { members: { some: { userId: user.id } } },
            ],
          }
        : {}),
    },
    include: {
      lead: {
        select: { id: true, name: true, image: true, email: true },
      },
      members: {
        include: {
          user: { select: { id: true, name: true, image: true, email: true } },
        },
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

/**
 * Retrieves full team permissions and settings for a project
 */
export async function getProjectTeamAndSettings(projectId: string) {
  const { project, projectRole, user } = await requireProjectAccess(projectId);

  const fullProject = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      workspace: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
        },
      },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });

  return {
    project: fullProject,
    currentUserRole: projectRole,
    currentUserId: user.id,
  };
}

/**
 * Assigns or updates a member's granular role for a project
 */
export async function addOrUpdateProjectMember(
  projectId: string,
  targetUserId: string,
  role: ProjectRole
) {
  const { user } = await requireProjectAccess(projectId, "OWNER");

  const member = await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId,
        userId: targetUserId,
      },
    },
    update: { role },
    create: {
      projectId,
      userId: targetUserId,
      role,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  revalidatePath(`/[orgSlug]/[workspaceSlug]/projects/[projectKey]/board`, "page");
  return { success: true, member };
}

/**
 * Removes a member's explicit access from a project
 */
export async function removeProjectMember(projectId: string, memberId: string) {
  await requireProjectAccess(projectId, "OWNER");

  await prisma.projectMember.delete({
    where: { id: memberId },
  });

  revalidatePath(`/[orgSlug]/[workspaceSlug]/projects/[projectKey]/board`, "page");
  return { success: true };
}

/**
 * Toggles project privacy mode (Public within workspace vs Private to assigned members)
 */
export async function toggleProjectPrivacy(projectId: string, isPrivate: boolean) {
  await requireProjectAccess(projectId, "OWNER");

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { isPrivate },
  });

  revalidatePath(`/[orgSlug]/[workspaceSlug]/projects/[projectKey]/board`, "page");
  return { success: true, project: updated };
}

/**
 * Deletes a project (Only project owner or workspace owner/admin)
 */
export async function deleteProject(projectId: string) {
  const { project, user } = await requireProjectAccess(projectId, "OWNER");

  await prisma.project.delete({
    where: { id: projectId },
  });

  revalidatePath(`/[orgSlug]/[workspaceSlug]/projects`, "page");
  return { success: true };
}

