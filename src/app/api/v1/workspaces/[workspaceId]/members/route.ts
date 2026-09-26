import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  getApiUser,
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
} from "@/lib/api/auth";
import { inviteMemberSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ workspaceId: string }> | { workspaceId: string };
};

async function getWorkspaceId(context: RouteContext): Promise<string> {
  const resolved = await context.params;
  return resolved.workspaceId;
}

/**
 * GET /api/v1/workspaces/[workspaceId]/members
 * Returns list of members of a workspace with user profile details.
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

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    return apiSuccess({ members });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * POST /api/v1/workspaces/[workspaceId]/members
 * Invites or adds a user to the workspace. Caller must be OWNER or ADMIN.
 */
export async function POST(req: Request | NextRequest, context: RouteContext) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const workspaceId = await getWorkspaceId(context);

    const callerMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (!callerMembership || !["OWNER", "ADMIN"].includes(callerMembership.role)) {
      return apiForbidden("Only owners and admins can invite members");
    }

    const body = await req.json();
    const parsed = inviteMemberSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid payload", 400);
    }

    const { email, role } = parsed.data;
    const targetEmail = email.toLowerCase().trim();

    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!targetUser) {
      return apiNotFound("User with this email does not exist yet. Ask them to register first.");
    }

    const existing = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUser.id,
        },
      },
    });

    if (existing) {
      return apiError("User is already a member of this workspace", 400);
    }

    const newMember = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: targetUser.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return apiSuccess({ member: newMember }, 201);
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * DELETE /api/v1/workspaces/[workspaceId]/members
 * Removes a member from the workspace by memberId or userId.
 */
export async function DELETE(req: Request | NextRequest, context: RouteContext) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const workspaceId = await getWorkspaceId(context);

    const callerMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (!callerMembership) {
      return apiNotFound("Workspace not found or access denied");
    }

    const url = new URL(req.url);
    let memberId = url.searchParams.get("memberId");
    let targetUserId = url.searchParams.get("userId");

    if (!memberId && !targetUserId) {
      try {
        const body = await req.json();
        if (body?.memberId) memberId = body.memberId;
        if (body?.userId) targetUserId = body.userId;
      } catch {
        // no json body
      }
    }

    if (!memberId && !targetUserId) {
      return apiError("memberId or userId parameter is required", 400);
    }

    const targetMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        OR: [
          ...(memberId ? [{ id: memberId }] : []),
          ...(targetUserId ? [{ userId: targetUserId }] : []),
        ],
      },
      include: {
        user: true,
      },
    });

    if (!targetMember) {
      return apiNotFound("Member not found in this workspace");
    }

    const isSelf = targetMember.userId === user.id;

    // RBAC: If not self, caller must be OWNER or ADMIN
    if (!isSelf && !["OWNER", "ADMIN"].includes(callerMembership.role)) {
      return apiForbidden("You do not have permission to remove this member");
    }

    // Owner protection: cannot remove the only OWNER
    if (targetMember.role === "OWNER") {
      const ownerCount = await prisma.workspaceMember.count({
        where: { workspaceId, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        return apiError("Cannot remove the only workspace owner", 400);
      }
      if (callerMembership.role !== "OWNER" && !isSelf) {
        return apiForbidden("Only owners can remove an owner from the workspace");
      }
    }

    // Admin cannot remove other Admins or Owners
    if (
      callerMembership.role === "ADMIN" &&
      !isSelf &&
      (targetMember.role === "ADMIN" || targetMember.role === "OWNER")
    ) {
      return apiForbidden("Admins cannot remove other Admins or Owners");
    }

    await prisma.workspaceMember.delete({
      where: { id: targetMember.id },
    });

    return apiSuccess({ message: "Member removed successfully" });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}
