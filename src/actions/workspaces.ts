"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireWorkspaceMember } from "@/lib/auth/session";
import { createWorkspaceSchema, inviteMemberSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { defaultBannerUrls } from "@/lib/banners";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

/**
 * Creates a new workspace under an organization
 */
export async function createWorkspace(orgIdOrSlug: string, input: CreateWorkspaceInput) {
  const user = await requireAuth();

  const parsed = createWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, slug, description } = parsed.data;

  // Check if organization exists by ID or slug and verify user ownership/membership
  const org = await prisma.organization.findFirst({
    where: {
      OR: [{ id: orgIdOrSlug }, { slug: orgIdOrSlug }],
      ownerId: user.id,
    },
  });

  if (!org) {
    return { error: "Organization not found or you do not have permission to create workspaces under it." };
  }

  // Check if slug is unique within org
  const existing = await prisma.workspace.findUnique({
    where: {
      organizationId_slug: {
        organizationId: org.id,
        slug,
      },
    },
  });

  if (existing) {
    return { error: "A workspace with this slug already exists in this organization." };
  }

  const workspace = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: {
        name,
        slug,
        description,
        organizationId: org.id,
        banners: { create: defaultBannerUrls() },
      },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: ws.id,
        userId: user.id,
        role: "OWNER",
      },
    });

    return ws;
  });

  revalidatePath(`/${org.slug}`);
  return { success: true, workspace, orgSlug: org.slug };
}

/**
 * Retrieves all workspaces the current user is a member of
 */
export async function getUserWorkspaces() {
  const user = await requireAuth();

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: {
      workspace: {
        include: {
          organization: true,
          _count: {
            select: {
              projects: true,
              members: true,
            },
          },
          banners: {
            select: { id: true, imageUrl: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
    orderBy: {
      joinedAt: "asc",
    },
  });

  return memberships.map((m) => ({
    ...m.workspace,
    role: m.role,
  }));
}

/**
 * Invites a new member to the workspace
 */
export async function inviteWorkspaceMember(workspaceId: string, input: z.infer<typeof inviteMemberSchema>) {
  await requireWorkspaceMember(workspaceId, ["OWNER", "ADMIN"]);

  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { email, role } = parsed.data;

  const targetUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!targetUser) {
    return { error: "User with this email does not exist yet. Ask them to register first." };
  }

  const existingMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: targetUser.id,
      },
    },
  });

  if (existingMember) {
    return { error: "User is already a member of this workspace." };
  }

  await prisma.workspaceMember.create({
    data: {
      workspaceId,
      userId: targetUser.id,
      role,
    },
  });

  return { success: true };
}
