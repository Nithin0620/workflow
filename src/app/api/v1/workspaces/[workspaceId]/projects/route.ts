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
import { createProjectSchema } from "@/lib/validators";
import { defaultBannerUrls } from "@/lib/banners";

type RouteContext = {
  params: Promise<{ workspaceId: string }> | { workspaceId: string };
};

async function getWorkspaceId(context: RouteContext): Promise<string> {
  const resolved = await context.params;
  return resolved.workspaceId;
}

const DEFAULT_COLUMNS = [
  { name: "Backlog", key: "BACKLOG", color: "#71717a", order: 0 },
  { name: "To Do", key: "TODO", color: "#64748b", order: 1000 },
  { name: "In Progress", key: "IN_PROGRESS", color: "#3b82f6", order: 2000 },
  { name: "In Review", key: "IN_REVIEW", color: "#f59e0b", order: 3000 },
  { name: "Done", key: "DONE", color: "#10b981", order: 4000 },
];

/**
 * GET /api/v1/workspaces/[workspaceId]/projects
 * Returns list of projects in workspace (filtering out private projects
 * unless user is workspace OWNER/ADMIN or project member).
 * Includes member counts, issue counts, lead info, etc.
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

    const isPrivileged = membership.role === "OWNER" || membership.role === "ADMIN";

    const projects = await prisma.project.findMany({
      where: {
        workspaceId,
        ...(!isPrivileged
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
            members: true,
            columns: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return apiSuccess({ projects });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * POST /api/v1/workspaces/[workspaceId]/projects
 * Creates a new project in the workspace.
 * Requires workspace member (non-VIEWER).
 * Validates input, checks key uniqueness in workspace,
 * creates default columns (Backlog, To Do, In Progress, In Review, Done),
 * and assigns creator as project OWNER.
 */
export async function POST(req: Request | NextRequest, context: RouteContext) {
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

    if (membership.role === "VIEWER") {
      return apiForbidden("Workspace viewers cannot create projects");
    }

    const body = await req.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid project payload", 400);
    }

    const { name, key, description, color, isPrivate } = parsed.data;
    const formattedKey = key.toUpperCase();

    const existingProject = await prisma.project.findUnique({
      where: {
        workspaceId_key: {
          workspaceId,
          key: formattedKey,
        },
      },
    });

    if (existingProject) {
      return apiError(`A project with key '${formattedKey}' already exists in this workspace`, 400);
    }

    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          name,
          key: formattedKey,
          description,
          color: color || "#3b82f6",
          isPrivate: isPrivate ?? false,
          workspaceId,
          leadId: user.id,
          issueSequence: 100,
          banners: { create: defaultBannerUrls() },
          members: {
            create: {
              userId: user.id,
              role: "OWNER",
            },
          },
          columns: {
            create: DEFAULT_COLUMNS.map((col) => ({
              name: col.name,
              key: col.key,
              color: col.color,
              order: col.order,
            })),
          },
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
          columns: {
            orderBy: { order: "asc" },
          },
          _count: {
            select: {
              issues: true,
              members: true,
              columns: true,
            },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          workspaceId,
          actorId: user.id,
          action: "PROJECT_CREATED",
          details: {
            projectId: created.id,
            projectName: created.name,
            projectKey: created.key,
          },
        },
      });

      return created;
    });

    return apiSuccess({ project }, 201);
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}
