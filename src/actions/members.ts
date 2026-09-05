"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireWorkspaceMember } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const inviteMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

/**
 * Invites or directly adds a user to a workspace by email
 */
export async function inviteOrAddMember(
  workspaceId: string,
  input: { email: string; role: UserRole }
) {
  const { user, membership, workspace } = await requireWorkspaceMember(workspaceId, [
    "OWNER",
    "ADMIN",
  ]);

  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const targetEmail = parsed.data.email.toLowerCase().trim();
  const targetRole = parsed.data.role as UserRole;

  // Prevent adding self
  if (user.email?.toLowerCase() === targetEmail) {
    return { error: "You are already a member of this workspace." };
  }

  // Find or create the user record
  let targetUser = await prisma.user.findUnique({
    where: { email: targetEmail },
  });

  if (!targetUser) {
    // Pre-create placeholder user account so when they sign up, they immediately have access
    const namePrefix = targetEmail.split("@")[0];
    const formattedName = namePrefix.charAt(0).toUpperCase() + namePrefix.slice(1);
    targetUser = await prisma.user.create({
      data: {
        email: targetEmail,
        name: formattedName,
      },
    });
  }

  // Check if target user is already a member
  const existingMembership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: targetUser.id,
      },
    },
  });

  if (existingMembership) {
    return { error: `User (${targetEmail}) is already a member of this workspace.` };
  }

  const newMember = await prisma.$transaction(async (tx) => {
    const createdMember = await tx.workspaceMember.create({
      data: {
        workspaceId,
        userId: targetUser!.id,
        role: targetRole,
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    await tx.activityLog.create({
      data: {
        workspaceId,
        actorId: user.id,
        action: "MEMBER_ADDED",
        details: {
          invitedEmail: targetEmail,
          role: targetRole,
        },
      },
    });

    return createdMember;
  });

  revalidatePath(`/[orgSlug]/[workspaceSlug]/settings`, "page");
  return { success: true, member: newMember };
}

/**
 * Updates a team member's role (Enforces RBAC safeguards)
 */
export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  newRole: UserRole
) {
  const { user, membership } = await requireWorkspaceMember(workspaceId, ["OWNER", "ADMIN"]);

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
    include: { user: true },
  });

  if (!targetMember || targetMember.workspaceId !== workspaceId) {
    return { error: "Member not found in this workspace." };
  }

  // Only OWNER can modify another OWNER's role or promote to OWNER
  if ((targetMember.role === "OWNER" || newRole === "OWNER") && membership.role !== "OWNER") {
    return { error: "Only workspace owners can assign or modify owner roles." };
  }

  // Prevent demoting the only OWNER
  if (targetMember.role === "OWNER" && newRole !== "OWNER") {
    const ownerCount = await prisma.workspaceMember.count({
      where: { workspaceId, role: "OWNER" },
    });
    if (ownerCount <= 1) {
      return { error: "Cannot demote the last remaining workspace owner." };
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.workspaceMember.update({
      where: { id: memberId },
      data: { role: newRole },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    await tx.activityLog.create({
      data: {
        workspaceId,
        actorId: user.id,
        action: "ROLE_UPDATED",
        details: {
          targetUserId: targetMember.userId,
          targetEmail: targetMember.user.email,
          previousRole: targetMember.role,
          newRole,
        },
      },
    });

    return result;
  });

  revalidatePath(`/[orgSlug]/[workspaceSlug]/settings`, "page");
  return { success: true, member: updated };
}

/**
 * Removes a member from the workspace
 */
export async function removeMember(workspaceId: string, memberId: string) {
  const { user, membership } = await requireWorkspaceMember(workspaceId, ["OWNER", "ADMIN"]);

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
    include: { user: true },
  });

  if (!targetMember || targetMember.workspaceId !== workspaceId) {
    return { error: "Member not found in this workspace." };
  }

  // Cannot remove the only OWNER
  if (targetMember.role === "OWNER") {
    const ownerCount = await prisma.workspaceMember.count({
      where: { workspaceId, role: "OWNER" },
    });
    if (ownerCount <= 1) {
      return { error: "Cannot remove the only workspace owner." };
    }
    if (membership.role !== "OWNER") {
      return { error: "Only owners can remove an owner from the workspace." };
    }
  }

  // Admin cannot remove other Admins or Owners
  if (membership.role === "ADMIN" && (targetMember.role === "ADMIN" || targetMember.role === "OWNER")) {
    if (targetMember.userId !== user.id) {
      return { error: "Admins cannot remove other Admins or Owners." };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.workspaceMember.delete({
      where: { id: memberId },
    });

    await tx.activityLog.create({
      data: {
        workspaceId,
        actorId: user.id,
        action: "MEMBER_REMOVED",
        details: {
          removedUserId: targetMember.userId,
          removedEmail: targetMember.user.email,
        },
      },
    });
  });

  revalidatePath(`/[orgSlug]/[workspaceSlug]/settings`, "page");
  return { success: true };
}

/**
 * Renames a workspace (OWNER / ADMIN only)
 */
export async function updateWorkspaceDetails(
  workspaceId: string,
  name: string
) {
  const { user } = await requireWorkspaceMember(workspaceId, ["OWNER", "ADMIN"]);

  if (!name || name.trim().length < 2) {
    return { error: "Workspace name must be at least 2 characters." };
  }

  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { name: name.trim() },
  });

  return { success: true, workspace: updated };
}

/**
 * Deletes a workspace and cascades its contents (OWNER only)
 */
export async function deleteWorkspace(workspaceId: string) {
  const { user, membership } = await requireWorkspaceMember(workspaceId, ["OWNER"]);

  if (membership.role !== "OWNER") {
    return { error: "Only the workspace owner can delete this workspace." };
  }

  await prisma.workspace.delete({
    where: { id: workspaceId },
  });

  return { success: true };
}

/**
 * Leaves a workspace (Non-owners only, or owners if multiple owners exist)
 */
export async function leaveWorkspace(workspaceId: string) {
  const user = await requireAuth();
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    return { error: "You are not a member of this workspace." };
  }

  if (membership.role === "OWNER") {
    const ownerCount = await prisma.workspaceMember.count({
      where: { workspaceId, role: "OWNER" },
    });
    if (ownerCount <= 1) {
      return { error: "You are the sole owner of this workspace. Transfer ownership before leaving or delete the workspace." };
    }
  }

  await prisma.workspaceMember.delete({
    where: { id: membership.id },
  });

  return { success: true };
}
