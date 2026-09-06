"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireWorkspaceMember } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createInviteToken, INVITE_TTL_DAYS, inviteStatus } from "@/lib/invites";
import { sendInviteEmail } from "@/lib/email";

const inviteMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

function findInviteByToken(token: string) {
  return prisma.workspaceInvite.findUnique({
    where: { token },
    include: {
      workspace: { include: { organization: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });
}

/**
 * Invites a user to a workspace by email. Creates a pending WorkspaceInvite
 * (token + expiry), emails the accept link, and never pre-creates user rows —
 * the invitee signs in/registers with the invited email and accepts.
 */
export async function inviteOrAddMember(
  workspaceId: string,
  input: { email: string; role: UserRole }
) {
  const { user, workspace } = await requireWorkspaceMember(workspaceId, ["OWNER", "ADMIN"]);

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

  // Check if target user is already a member
  const existingMember = await prisma.user.findUnique({ where: { email: targetEmail } });
  if (existingMember) {
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: existingMember.id },
      },
    });
    if (membership) {
      return { error: `${targetEmail} is already a member of this workspace.` };
    }
  }

  const token = createInviteToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  // Re-inviting the same email replaces any previous pending invite (resend)
  const invite = await prisma.$transaction(async (tx) => {
    await tx.workspaceInvite.deleteMany({ where: { workspaceId, email: targetEmail } });
    const created = await tx.workspaceInvite.create({
      data: {
        workspaceId,
        email: targetEmail,
        role: targetRole,
        token,
        invitedById: user.id,
        expiresAt,
      },
    });
    await tx.activityLog.create({
      data: {
        workspaceId,
        actorId: user.id,
        action: "INVITE_SENT",
        details: { invitedEmail: targetEmail, role: targetRole },
      },
    });
    return created;
  });

  let emailDelivered = false;
  try {
    emailDelivered = await sendInviteEmail({ workspace, inviter: user, invite });
  } catch {
    emailDelivered = false;
  }

  revalidatePath(`/[orgSlug]/[workspaceSlug]/settings`, "page");
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000"}/invite?token=${token}`;
  return { success: true, inviteLink, emailDelivered };
}

/**
 * Accepts a pending invite for the authenticated user. Requires the logged-in
 * account to match the invited email exactly.
 */
export async function acceptInvite(token: string) {
  const user = await requireAuth();

  const invite = await findInviteByToken(token);
  if (!invite) return { error: "This invitation is invalid or no longer exists." };
  if (inviteStatus(invite) === "expired") return { error: "This invitation has expired." };
  if (inviteStatus(invite) === "accepted") {
    return { error: "This invitation has already been used." };
  }
  if (user.email?.toLowerCase() !== invite.email) {
    return { error: `This invitation was sent to ${invite.email}. Please sign in with that email to accept it.` };
  }

  const { workspace } = invite;
  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
  });

  if (!existing) {
    await prisma.$transaction(async (tx) => {
      await tx.workspaceMember.create({
        data: { workspaceId: workspace.id, userId: user.id, role: invite.role },
      });
      await tx.activityLog.create({
        data: {
          workspaceId: workspace.id,
          actorId: user.id,
          action: "MEMBER_ADDED",
          details: { invitedEmail: invite.email, role: invite.role, viaInvite: true },
        },
      });
    });
  }

  await prisma.workspaceInvite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  });

  const redirectUrl = `/${workspace.organization.slug}/${workspace.slug}`;
  revalidatePath(redirectUrl, "page");
  return { success: true, redirectUrl };
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
  await requireWorkspaceMember(workspaceId, ["OWNER", "ADMIN"]);

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
  const { membership } = await requireWorkspaceMember(workspaceId, ["OWNER"]);

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
