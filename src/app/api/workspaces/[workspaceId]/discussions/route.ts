import { NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createDiscussionChannelSchema } from "@/lib/validators";

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const { user, workspace } = await requireWorkspaceMember(workspaceId);

    const channels = await prisma.discussionChannel.findMany({
      where: {
        workspaceId,
        OR: [
          { isPrivate: false },
          // A more complex query would be needed if private channels had specific members,
          // but for now we'll just return non-private channels since we don't have a getChannels action
        ],
      },
      include: {
        _count: {
          select: { messages: true }
        }
      },
      orderBy: [
        { type: 'asc' },
        { position: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ data: channels });
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

export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const body = await req.json();

    const { user, membership } = await requireWorkspaceMember(workspaceId, ["OWNER", "ADMIN"]);

    const parsed = createDiscussionChannelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    // Check if channel name exists
    const existing = await prisma.discussionChannel.findFirst({
      where: {
        workspaceId,
        projectId: parsed.data.projectId || null,
        name: parsed.data.name,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "A channel with this name already exists here." } },
        { status: 409 }
      );
    }

    const channel = await prisma.discussionChannel.create({
      data: {
        workspaceId,
        projectId: parsed.data.projectId || null,
        name: parsed.data.name,
        topic: parsed.data.topic || null,
        type: parsed.data.type,
        isPrivate: parsed.data.isPrivate,
      },
    });

    return NextResponse.json({ data: channel }, { status: 201 });
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
