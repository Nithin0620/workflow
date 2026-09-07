import { cache } from "react";
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
 * Retrieves the current authenticated user record from the database.
 * React cache() dedupes across all callers within a single render/request
 * (page, layouts, requireAuth chains) — one DB query instead of 3-4.
 */
export const getCurrentUser = cache(async () => {
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
});

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
 * Verifies that the current user has access to a specific workspace and returns their role.
 * Deduplicated in-memory using the authenticated user workspace memberships.
 */
export const requireWorkspaceMember = cache(
  async (workspaceId: string, allowedRoles?: UserRole[]) => {
    const user = await requireAuth();

    // Fast in-memory lookup from user's cached workspaceMembers
    let membership = user.workspaceMembers?.find(
      (wm) => wm.workspaceId === workspaceId
    );

    if (!membership) {
      // Fallback query only if not present in cached list
      const dbMembership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: user.id,
          },
        },
        include: {
          workspace: {
            include: {
              organization: true,
            },
          },
        },
      });

      if (!dbMembership) {
        throw new Error("Forbidden: You are not a member of this workspace.");
      }
      membership = dbMembership;
    }

    if (!membership) {
      throw new Error("Forbidden: You are not a member of this workspace.");
    }

    if (allowedRoles && !allowedRoles.includes(membership.role)) {
      throw new Error("Forbidden: You do not have sufficient permissions for this action.");
    }

    return { user, membership, workspace: membership.workspace };
  }
);

/**
 * Verifies and returns project-level access and role for current user
 */
export const requireProjectAccess = cache(
  async (
    projectId: string,
    minRole?: "OWNER" | "EDITOR" | "VIEWER"
  ) => {
    const user = await requireAuth();

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        workspaceId: true,
        isPrivate: true,
        name: true,
        key: true,
        members: {
          where: { userId: user.id },
          select: { role: true },
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
);

/**
 * Verifies that the current user has access to a specific whiteboard.
 * Access is granted if:
 * 1. User is Workspace OWNER or ADMIN.
 * 2. Or User is a MEMBER of the workspace and either:
 *    a) Whiteboard has no private linked projects (accessible to workspace members)
 *    b) User is a member/editor of at least one linked project.
 */
export const requireWhiteboardAccess = cache(
  async (
    whiteboardId: string,
    minRole: "EDITOR" | "VIEWER" = "VIEWER"
  ) => {
    const user = await requireAuth();

    const whiteboard = await prisma.whiteboard.findUnique({
      where: { id: whiteboardId },
      include: {
        projects: {
          include: {
            project: {
              include: {
                members: {
                  where: { userId: user.id },
                  select: { role: true },
                },
              },
            },
          },
        },
      },
    });

    if (!whiteboard) {
      throw new Error("Whiteboard not found.");
    }

    const { membership } = await requireWorkspaceMember(whiteboard.workspaceId);

    // Workspace Owner or Admin has full EDITOR/OWNER rights
    if (membership.role === "OWNER" || membership.role === "ADMIN") {
      return { user, whiteboard, canEdit: true, role: "OWNER" as const };
    }

    // Check project-specific memberships if linked to projects
    if (whiteboard.projects.length > 0) {
      let hasProjectViewAccess = false;
      let hasProjectEditAccess = false;

      for (const pw of whiteboard.projects) {
        const proj = pw.project;
        if (!proj.isPrivate) {
          // Public project within workspace
          hasProjectViewAccess = true;
          if (membership.role === "MEMBER") {
            hasProjectEditAccess = true;
          }
        }
        if (proj.members.length > 0) {
          const userProjectRole = proj.members[0].role;
          hasProjectViewAccess = true;
          if (userProjectRole === "OWNER" || userProjectRole === "EDITOR") {
            hasProjectEditAccess = true;
          }
        }
      }

      if (!hasProjectViewAccess && membership.role === "VIEWER") {
        throw new Error("Forbidden: You do not have access to this whiteboard.");
      }

      if (minRole === "EDITOR" && !hasProjectEditAccess) {
        throw new Error("Forbidden: You have read-only access to this whiteboard.");
      }

      return {
        user,
        whiteboard,
        canEdit: hasProjectEditAccess,
        role: hasProjectEditAccess ? ("EDITOR" as const) : ("VIEWER" as const),
      };
    }

    // Not linked to specific projects - workspace scope applies (OWNER/ADMIN already returned above)
    const canEdit = (membership.role as UserRole) !== "VIEWER";
    if (minRole === "EDITOR" && !canEdit) {
      throw new Error("Forbidden: You have read-only access to this whiteboard.");
    }

    return {
      user,
      whiteboard,
      canEdit,
      role: canEdit ? ("EDITOR" as const) : ("VIEWER" as const),
    };
  }
);


