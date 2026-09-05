import { getServerSession } from "next-auth/next";
import { authOptions } from "./options";
import { prisma } from "@/lib/db/prisma";
import { UserRole, ProjectRole } from "@prisma/client";
import { provisionDefaultUserWorkspace } from "./provisioning";

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

  let user = await prisma.user.findUnique({
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

  // If user signed up via OAuth (Google/GitHub) and doesn't have a workspace yet, auto-provision
  if (user && user.workspaceMembers.length === 0) {
    await prisma.$transaction(async (tx) => {
      await provisionDefaultUserWorkspace(tx, user!);
    });

    user = await prisma.user.findUnique({
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
  }

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

/**
 * Verifies and returns project-level access and role for current user
 */
export async function requireProjectAccess(
  projectId: string,
  minRole?: "OWNER" | "EDITOR" | "VIEWER"
) {
  const user = await requireAuth();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      workspace: true,
      members: {
        where: { userId: user.id },
      },
    },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  const { membership } = await requireWorkspaceMember(project.workspaceId);

  let projectRole: ProjectRole;

  if (membership.role === "OWNER" || membership.role === "ADMIN") {
    projectRole = "OWNER";
  } else if (project.members.length > 0) {
    projectRole = project.members[0].role;
  } else if (project.isPrivate) {
    throw new Error("Forbidden: This project is restricted to assigned members.");
  } else {
    // Workspace fallback
    projectRole = membership.role === "VIEWER" ? "VIEWER" : "EDITOR";
  }

  if (minRole === "OWNER" && projectRole !== "OWNER") {
    throw new Error("Forbidden: Project Owner access is required for this action.");
  }

  if (minRole === "EDITOR" && projectRole === "VIEWER") {
    throw new Error("Forbidden: You have read-only access to this project.");
  }

  return { user, project, projectRole, workspaceMembership: membership };
}

