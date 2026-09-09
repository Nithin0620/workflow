import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  getApiUser,
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
} from "@/lib/api/auth";
import { createChannelSchema } from "@/lib/validators";
import { broadcastDiscussionEvent } from "@/lib/realtime/events";

type RouteContext = {
  params: Promise<{ workspaceId: string }> | { workspaceId: string };
};

async function getWorkspaceId(context: RouteContext): Promise<string> {
  const resolved = await context.params;
  return resolved.workspaceId;
}

/**
 * GET /api/v1/workspaces/[workspaceId]/channels
 * Returns list of channels with message counts and unread status.
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

    const channels = await prisma.discussionChannel.findMany({
      where: { workspaceId },
      include: {
        project: {
          select: {
            id: true,
            key: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        reads: {
          where: { userId: user.id },
          select: { lastReadAt: true },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });

    const channelIds = channels.map((c) => c.id);
    const unreadMap = new Map<string, number>();

    if (channelIds.length > 0) {
      try {
        const unreadCounts = await prisma.$queryRaw<Array<{ channelId: string; count: number }>>`
          SELECT dm."channelId", COUNT(*)::int as count
          FROM "DiscussionMessage" dm
          LEFT JOIN "UserChannelRead" ucr ON ucr."channelId" = dm."channelId" AND ucr."userId" = ${user.id}
          WHERE dm."channelId" = ANY(${channelIds})
            AND dm."authorId" != ${user.id}
            AND (ucr."lastReadAt" IS NULL OR dm."createdAt" > ucr."lastReadAt")
          GROUP BY dm."channelId";
        `;
        if (Array.isArray(unreadCounts)) {
          for (const row of unreadCounts) {
            unreadMap.set(row.channelId, Number(row.count) || 0);
          }
        }
      } catch {
        // Raw query fallback
      }
    }

    const formattedChannels = channels.map((channel) => {
      const unreadCount = unreadMap.get(channel.id) || 0;
      const lastRead = channel.reads && channel.reads.length > 0 ? channel.reads[0].lastReadAt : null;
      return {
        id: channel.id,
        workspaceId: channel.workspaceId,
        projectId: channel.projectId,
        name: channel.name,
        topic: channel.topic,
        type: channel.type,
        isPrivate: channel.isPrivate,
        position: channel.position,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt,
        project: channel.project,
        messageCount: channel._count?.messages ?? 0,
        unreadCount,
        isUnread: unreadCount > 0,
        lastReadAt: lastRead,
      };
    });

    return apiSuccess({ channels: formattedChannels });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * POST /api/v1/workspaces/[workspaceId]/channels
 * Creates a discussion channel in the workspace.
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

    const body = await req.json();
    const parsed = createChannelSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid channel payload", 400);
    }

    const { name, topic, type, isPrivate, projectId } = parsed.data;
    const normalizedName = name.toLowerCase().trim();

    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, workspaceId },
      });
      if (!project) {
        return apiError("Project not found in this workspace", 400);
      }
    }

    const existing = await prisma.discussionChannel.findUnique({
      where: {
        workspaceId_projectId_name: {
          workspaceId,
          projectId: projectId || (null as any),
          name: normalizedName,
        },
      },
    });

    if (existing) {
      return apiError(`Channel #${normalizedName} already exists in this scope`, 400);
    }

    const channel = await prisma.discussionChannel.create({
      data: {
        workspaceId,
        projectId: projectId || null,
        name: normalizedName,
        topic: topic || null,
        type: type || "TEXT",
        isPrivate: isPrivate || false,
      },
      include: {
        project: true,
      },
    });

    try {
      await prisma.userChannelRead.create({
        data: {
          userId: user.id,
          channelId: channel.id,
          lastReadAt: new Date(),
        },
      });
    } catch {
      // ignore
    }

    try {
      broadcastDiscussionEvent({
        type: "CHANNEL_CREATED",
        workspaceId,
        projectId: projectId || undefined,
        channelId: channel.id,
        timestamp: Date.now(),
        actor: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        data: { discussionChannel: channel },
      });
    } catch {
      // ignore broadcast error
    }

    return apiSuccess({ channel }, 201);
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}
