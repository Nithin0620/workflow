import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { sendDiscussionMessageSchema } from "@/lib/validators";
import { broadcastDiscussionEvent } from "@/lib/realtime/events";

export async function GET(req: Request, { params }: { params: Promise<{ discussionId: string }> }) {
  try {
    const { discussionId } = await params;

    // Get URL parameters for pagination
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const cursor = url.searchParams.get("cursor");

    // Verify channel exists and user has access to its workspace
    const channel = await prisma.discussionChannel.findUnique({
      where: { id: discussionId },
      select: { workspaceId: true, isPrivate: true }
    });

    if (!channel) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Channel not found" } },
        { status: 404 }
      );
    }

    const { user } = await requireWorkspaceMember(channel.workspaceId);

    // Basic GET messages implementation
    const messages = await prisma.discussionMessage.findMany({
      where: {
        channelId: discussionId,
        parentId: null, // Only top-level messages
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {})
      },
      take: Math.min(limit, 100),
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, image: true, email: true }
        },
        attachments: true,
        reactions: true,
        issueLinks: {
          include: {
            issue: {
              select: { id: true, projectKey: true, issueNumber: true, title: true, status: true, priority: true }
            }
          }
        },
        _count: {
          select: { replies: true }
        }
      }
    });

    return NextResponse.json({
      data: messages.reverse(),
      meta: {
        limit: Math.min(limit, 100),
        nextCursor: messages.length > 0 ? messages[0].createdAt.toISOString() : null
      }
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: error.message } },
        { status: 401 }
      );
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: error.message } },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ discussionId: string }> }) {
  try {
    const { discussionId } = await params;
    const body = await req.json();

    // Validate request
    const parsed = sendDiscussionMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    // Verify channel exists and user has access
    const channel = await prisma.discussionChannel.findUnique({
      where: { id: discussionId },
      select: { id: true, name: true, workspaceId: true, projectId: true }
    });

    if (!channel) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Channel not found" } },
        { status: 404 }
      );
    }

    const { user } = await requireWorkspaceMember(channel.workspaceId);

    // Create the message directly since sendDiscussionMessage in actions imports node-specific things we don't need
    const result = await prisma.$transaction(async (tx) => {
      // If it's a reply, verify parent exists and increment reply count
      if (parsed.data.parentId) {
        const parent = await tx.discussionMessage.findUnique({
          where: { id: parsed.data.parentId },
        });
        if (!parent || parent.channelId !== discussionId) {
          throw new Error("Parent message not found in this channel.");
        }
        await tx.discussionMessage.update({
          where: { id: parsed.data.parentId },
          data: {
            replyCount: { increment: 1 },
            lastReplyAt: new Date(),
          },
        });
      }

      // Insert message
      const message = await tx.discussionMessage.create({
        data: {
          channelId: discussionId,
          authorId: user.id,
          content: parsed.data.content,
          parentId: parsed.data.parentId || null,
          attachments: parsed.data.attachments?.length
            ? {
                createMany: {
                  data: parsed.data.attachments.map((a) => ({
                    fileName: a.fileName,
                    fileSize: a.fileSize,
                    fileType: a.fileType,
                    fileUrl: a.fileUrl,
                  })),
                },
              }
            : undefined,
        },
        include: {
          author: { select: { id: true, name: true, image: true, email: true } },
          attachments: true,
          reactions: true,
          issueLinks: true,
        },
      });

      return message;
    });

    broadcastDiscussionEvent({
      type: "MESSAGE_SENT",
      workspaceId: channel.workspaceId,
      channelId: channel.id,
      timestamp: Date.now(),
      actor: { id: user.id, name: user.name, email: user.email, image: user.image },
      data: { message: result },
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: error.message } },
        { status: 401 }
      );
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: error.message } },
        { status: 403 }
      );
    }
    if (error.message?.includes("not found")) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: error.message } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } },
      { status: 500 }
    );
  }
}
