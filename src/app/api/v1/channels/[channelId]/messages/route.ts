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
import { createMessageSchema } from "@/lib/validators";
import { broadcastDiscussionEvent } from "@/lib/realtime/events";
import { createUserNotification } from "@/actions/notifications";

type RouteContext = {
  params: Promise<{ channelId: string }> | { channelId: string };
};

async function getChannelId(context: RouteContext): Promise<string> {
  const resolved = await context.params;
  return resolved.channelId;
}

/**
 * GET /api/v1/channels/[channelId]/messages
 * Returns top-level messages in a channel with author info, reactions, attachments, and linked issues.
 */
export async function GET(req: Request | NextRequest, context: RouteContext) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const channelId = await getChannelId(context);

    const channel = await prisma.discussionChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return apiNotFound("Channel not found");
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: channel.workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return apiNotFound("Channel not found or access denied");
    }

    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor");
    const limitParam = parseInt(url.searchParams.get("limit") || "50", 10);
    const limit = isNaN(limitParam) || limitParam <= 0 ? 50 : Math.min(limitParam, 100);

    const messages = await prisma.discussionMessage.findMany({
      where: {
        channelId,
        parentId: null, // Top-level messages
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        attachments: true,
        reactions: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        issueLinks: {
          include: {
            issue: {
              select: {
                id: true,
                projectKey: true,
                issueNumber: true,
                title: true,
                status: true,
                priority: true,
                assignee: {
                  select: { id: true, name: true, image: true },
                },
              },
            },
          },
        },
      },
    });

    return apiSuccess({ messages });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * POST /api/v1/channels/[channelId]/messages
 * Creates a new message or reply in the channel.
 * Triggers issue linking, notifications, and realtime broadcast.
 */
export async function POST(req: Request | NextRequest, context: RouteContext) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const channelId = await getChannelId(context);

    const channel = await prisma.discussionChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return apiNotFound("Channel not found");
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: channel.workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return apiNotFound("Channel not found or access denied");
    }

    if (channel.type === "ANNOUNCEMENT" && !["OWNER", "ADMIN"].includes(membership.role)) {
      return apiForbidden("Only owners and admins can post in announcement channels");
    }

    const body = await req.json();
    const parsed = createMessageSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid message payload", 400);
    }

    const { content, parentId, attachments } = parsed.data;

    if (parentId) {
      const parentMessage = await prisma.discussionMessage.findFirst({
        where: { id: parentId, channelId },
      });
      if (!parentMessage) {
        return apiError("Parent thread message not found in this channel", 400);
      }
    }

    // Extract potential issue mentions (e.g. #DEMO-2, DEMO-2)
    const issueKeyMatches = Array.from(
      new Set(
        Array.from(content.matchAll(/(?:#|\b)([A-Za-z0-9]+)-(\d+)\b/g)).map((m) => ({
          key: m[1].toUpperCase(),
          num: parseInt(m[2], 10),
        }))
      )
    );

    let mentionedIssues: any[] = [];
    if (issueKeyMatches.length > 0) {
      try {
        mentionedIssues = await prisma.issue.findMany({
          where: {
            project: {
              workspaceId: channel.workspaceId,
            },
            OR: issueKeyMatches.map((m) => ({
              projectKey: m.key,
              issueNumber: m.num,
            })),
          },
          select: {
            id: true,
            projectKey: true,
            issueNumber: true,
            title: true,
            status: true,
            priority: true,
            assignee: {
              select: { id: true, name: true, image: true },
            },
          },
        });
      } catch {
        // ignore issue mention query failure
      }
    }

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.discussionMessage.create({
        data: {
          channelId,
          authorId: user.id,
          content,
          parentId: parentId || null,
          attachments:
            attachments && attachments.length > 0
              ? {
                  create: attachments.map((att) => ({
                    fileName: att.fileName,
                    fileSize: att.fileSize,
                    fileType: att.fileType,
                    fileUrl: att.fileUrl,
                  })),
                }
              : undefined,
          issueLinks:
            mentionedIssues.length > 0
              ? {
                  create: mentionedIssues.map((issue) => ({
                    issueId: issue.id,
                    createdById: user.id,
                  })),
                }
              : undefined,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, image: true },
          },
          attachments: true,
          reactions: true,
          issueLinks: {
            include: {
              issue: {
                select: {
                  id: true,
                  projectKey: true,
                  issueNumber: true,
                  title: true,
                  status: true,
                  priority: true,
                  assignee: {
                    select: { id: true, name: true, image: true },
                  },
                },
              },
            },
          },
        },
      });

      if (parentId) {
        await tx.discussionMessage.update({
          where: { id: parentId },
          data: {
            replyCount: { increment: 1 },
            lastReplyAt: new Date(),
          },
        });
      }

      await tx.userChannelRead.upsert({
        where: {
          userId_channelId: {
            userId: user.id,
            channelId,
          },
        },
        create: {
          userId: user.id,
          channelId,
          lastReadAt: new Date(),
        },
        update: {
          lastReadAt: new Date(),
        },
      });

      return created;
    });

    // Notify parent thread author if replying
    if (parentId) {
      try {
        const parentMsg = await prisma.discussionMessage.findUnique({
          where: { id: parentId },
          select: { authorId: true },
        });
        if (parentMsg && parentMsg.authorId !== user.id) {
          await createUserNotification({
            userId: parentMsg.authorId,
            title: "New reply in discussion",
            message: `${user.name || "A team member"} replied to your thread in #${channel.name}`,
          });
        }
      } catch {
        // ignore notification error
      }
    }

    try {
      broadcastDiscussionEvent({
        type: "MESSAGE_SENT",
        workspaceId: channel.workspaceId,
        channelId: channel.id,
        timestamp: Date.now(),
        actor: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        data: { message },
      });
    } catch {
      // ignore broadcast error
    }

    return apiSuccess({ message }, 201);
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}
