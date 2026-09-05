import { getServerSession } from "next-auth/next";
import { authOptions } from "./options";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";

/**
 * Retrieves the current session from the server context
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Retrieves the current authenticated user record from the database
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      workspaceMembers: {
        include: {
          workspace: {
            include: {
              organization: true,
            },
          },
        },
      },
    },
  });

  return user;
}

/**
 * Enforces that a user is authenticated or throws an error
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: You must be logged in to perform this action.");
  }
  return user;
}

/**
 * Verifies that the current user has access to a specific workspace and returns their role
 */
export async function requireWorkspaceMember(workspaceId: string, allowedRoles?: UserRole[]) {
  const user = await requireAuth();

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: user.id,
      },
    },
    include: {
      workspace: true,
    },
  });

  if (!membership) {
    throw new Error("Forbidden: You are not a member of this workspace.");
  }

  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    throw new Error("Forbidden: You do not have sufficient permissions for this action.");
  }

  return { user, membership, workspace: membership.workspace };
}
