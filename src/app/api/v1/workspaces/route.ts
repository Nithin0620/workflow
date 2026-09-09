import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getApiUser, apiSuccess, apiError, apiUnauthorized } from "@/lib/api/auth";
import { createWorkspaceSchema } from "@/lib/validators";
import { defaultBannerUrls } from "@/lib/banners";

const createWorkspaceBodySchema = createWorkspaceSchema.extend({
  organizationId: z.string().optional(),
  orgSlug: z.string().optional(),
});

/**
 * GET /api/v1/workspaces
 * Returns list of user's workspaces with membership details, role, and organization.
 */
export async function GET(req: Request | NextRequest) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

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
                discussionChannels: true,
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

    const workspaces = memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return apiSuccess({ workspaces });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * POST /api/v1/workspaces
 * Creates a new workspace and assigns the caller as OWNER.
 */
export async function POST(req: Request | NextRequest) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const body = await req.json();
    const parsed = createWorkspaceBodySchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid workspace payload", 400);
    }

    const { name, slug, description, organizationId, orgSlug } = parsed.data;

    const org = await prisma.organization.findFirst({
      where: {
        ...(organizationId ? { id: organizationId } : orgSlug ? { slug: orgSlug } : {}),
        ownerId: user.id,
      },
    });

    if (!org) {
      return apiError(
        "Organization not found or you do not have permission to create workspaces under it",
        404
      );
    }

    const existing = await prisma.workspace.findUnique({
      where: {
        organizationId_slug: {
          organizationId: org.id,
          slug,
        },
      },
    });

    if (existing) {
      return apiError("A workspace with this slug already exists in this organization", 400);
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
        include: {
          organization: true,
          banners: {
            select: { id: true, imageUrl: true },
          },
          _count: {
            select: {
              projects: true,
              members: true,
              discussionChannels: true,
            },
          },
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

    return apiSuccess({ workspace: { ...workspace, role: "OWNER" } }, 201);
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}
