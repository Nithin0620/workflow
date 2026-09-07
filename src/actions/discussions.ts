"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireWorkspaceMember, requireProjectAccess } from "@/lib/auth/session";
import {
  createDiscussionChannelSchema,
  updateDiscussionChannelSchema,
  sendDiscussionMessageSchema,
  toggleDiscussionReactionSchema,
  linkDiscussionToIssueSchema,
  createIssueSchema,
} from "@/lib/validators";
import {
  broadcastDiscussionEvent,
  broadcastProjectEvent,
} from "@/lib/realtime/events";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type CreateDiscussionChannelInput = z.infer<typeof createDiscussionChannelSchema>;
export type UpdateDiscussionChannelInput = z.infer<typeof updateDiscussionChannelSchema>;
export type SendDiscussionMessageInput = z.infer<typeof sendDiscussionMessageSchema>;

/**
 * Returns all discussion channels within a workspace, grouped into:
 * 1. Workspace-wide general channels (projectId: null)
 * 2. Project-scoped channels (grouped by project key / name)
 * Includes unread message counts for the current user.
 */
export async function getWorkspaceChannels(workspaceId: string) {
  const { user } = await requireWorkspaceMember(workspaceId);

  let channels = await prisma.discussionChannel.findMany({
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
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  // If workspace has no discussion channels yet, automatically provision defaults
  if (channels.length === 0) {
    const generalChannel = await prisma.discussionChannel.create({
      data: {
        workspaceId,
        name: "general",
        topic: "Workspace-wide discussions and team conversations",
        type: "TEXT",
        position: 1,
      },
    });

    await prisma.discussionChannel.create({
      data: {
        workspaceId,
        name: "announcements",
        topic: "Company and workspace announcements",
        type: "ANNOUNCEMENT",
        position: 0,
      },
    });

    // Seed welcome message
    await prisma.discussionMessage.create({
      data: {
        channelId: generalChannel.id,
        authorId: user.id,
        content: "👋 Welcome to **Discussions**! Channels are organized by workspace and projects. You can chat, reply in threads, and turn any message into a tracked Issue with one click.",
      },
    });

    channels = await prisma.discussionChannel.findMany({
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
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });
  }

  // Calculate unread counts in a single batch query across all channels
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
      for (const row of unreadCounts) {
        unreadMap.set(row.channelId, row.count);
      }
    } catch {
      // Fallback if raw query is not supported
    }
  }

  const channelsWithUnread = channels.map((channel) => ({
    ...channel,
    unreadCount: unreadMap.get(channel.id) || 0,
  }));

  const workspaceChannels = channelsWithUnread.filter((c) => !c.projectId);
  const projectChannels = channelsWithUnread.filter((c) => Boolean(c.projectId));

  // Group by project
  const projectGroups: Record<
    string,
    {
      project: (typeof projectChannels)[0]["project"];
      channels: typeof projectChannels;
    }
  > = {};

  for (const channel of projectChannels) {
    if (!channel.project) continue;
    if (!projectGroups[channel.project.id]) {
      projectGroups[channel.project.id] = {
        project: channel.project,
        channels: [],
      };
    }
    projectGroups[channel.project.id].channels.push(channel);
  }

  return {
    workspaceChannels,
    projectGroups: Object.values(projectGroups),
  };
}

/**
 * Fetches single channel metadata and verifies access.
 */
export async function getChannelDetails(channelId: string) {
  const user = await requireAuth();

  const channel = await prisma.discussionChannel.findUnique({
    where: { id: channelId },
    include: {
      workspace: true,
      project: true,
    },
  });

  if (!channel) {
    return { error: "Channel not found." };
  }

  // Verify workspace membership
  await requireWorkspaceMember(channel.workspaceId);

  // If project channel, verify project access
  if (channel.projectId) {
    await requireProjectAccess(channel.projectId);
  }

  return { channel };
}

/**
 * Creates a new discussion channel (Workspace-level or Project-level)
 */
export async function createDiscussionChannel(
  workspaceId: string,
  input: CreateDiscussionChannelInput
) {
  const { user } = await requireWorkspaceMember(workspaceId, ["OWNER", "ADMIN", "MEMBER"]);

  const parsed = createDiscussionChannelSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, topic, type, isPrivate, projectId } = parsed.data;

  if (projectId) {
    await requireProjectAccess(projectId, "EDITOR");
  }

  const normalizedName = name.toLowerCase().trim();

  // Check for duplicate channel name in same scope
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
    return { error: `Channel #${normalizedName} already exists in this section.` };
  }

  const channel = await prisma.discussionChannel.create({
    data: {
      workspaceId,
      projectId: projectId || null,
      name: normalizedName,
      topic,
      type: type || "TEXT",
      isPrivate: isPrivate || false,
    },
    include: {
      project: true,
    },
  });

  // Mark channel as read for creator
  await prisma.userChannelRead.create({
    data: {
      userId: user.id,
      channelId: channel.id,
      lastReadAt: new Date(),
    },
  });

  // Broadcast realtime event
  broadcastDiscussionEvent({
    type: "CHANNEL_CREATED",
    workspaceId,
    projectId: projectId || undefined,
    channelId: channel.id,
    timestamp: Date.now(),
    actor: { id: user.id, name: user.name, email: user.email, image: user.image },
    data: { discussionChannel: channel },
  });

  return { channel };
}

/**
 * Updates channel name, topic, or order
 */
export async function updateDiscussionChannel(
  channelId: string,
  input: UpdateDiscussionChannelInput
) {
  const user = await requireAuth();

  const channel = await prisma.discussionChannel.findUnique({
    where: { id: channelId },
  });

  if (!channel) {
    return { error: "Channel not found." };
  }

  await requireWorkspaceMember(channel.workspaceId, ["OWNER", "ADMIN", "MEMBER"]);

  const parsed = updateDiscussionChannelSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const updated = await prisma.discussionChannel.update({
    where: { id: channelId },
    data: parsed.data,
    include: { project: true },
  });

  broadcastDiscussionEvent({
    type: "CHANNEL_UPDATED",
    workspaceId: channel.workspaceId,
    channelId: channel.id,
    timestamp: Date.now(),
    actor: { id: user.id, name: user.name, email: user.email, image: user.image },
    data: { discussionChannel: updated },
  });

  return { channel: updated };
}

/**
 * Deletes a channel
 */
export async function deleteDiscussionChannel(channelId: string) {
  const user = await requireAuth();

  const channel = await prisma.discussionChannel.findUnique({
    where: { id: channelId },
  });

  if (!channel) {
    return { error: "Channel not found." };
  }

  await requireWorkspaceMember(channel.workspaceId, ["OWNER", "ADMIN"]);

  await prisma.discussionChannel.delete({
    where: { id: channelId },
  });

  broadcastDiscussionEvent({
    type: "CHANNEL_DELETED",
    workspaceId: channel.workspaceId,
    channelId: channel.id,
    timestamp: Date.now(),
    actor: { id: user.id, name: user.name, email: user.email, image: user.image },
    data: { channelId },
  });

  return { success: true };
}

/**
 * Fetches top-level messages for a channel with reactions, attachments, and linked issues.
 */
export async function getChannelMessages(
  channelId: string,
  options?: { cursor?: string; limit?: number }
) {
  const user = await requireAuth();
  const limit = options?.limit || 50;

  const channel = await prisma.discussionChannel.findUnique({
    where: { id: channelId },
  });

  if (!channel) {
    return { error: "Channel not found." };
  }

  await requireWorkspaceMember(channel.workspaceId);

  const messages = await prisma.discussionMessage.findMany({
    where: {
      channelId,
      parentId: null, // Top-level messages only
    },
    take: limit,
    skip: options?.cursor ? 1 : 0,
    cursor: options?.cursor ? { id: options.cursor } : undefined,
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

  return { messages };
}

/**
 * Fetches a thread: the parent message and all its replies.
 */
export async function getThreadMessages(messageId: string) {
  const user = await requireAuth();

  const parentMessage = await prisma.discussionMessage.findUnique({
    where: { id: messageId },
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
      channel: true,
    },
  });

  if (!parentMessage) {
    return { error: "Thread not found." };
  }

  await requireWorkspaceMember(parentMessage.channel.workspaceId);

  const replies = await prisma.discussionMessage.findMany({
    where: {
      parentId: messageId,
    },
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

  return { parentMessage, replies };
}

/**
 * Sends a message in a channel or replies in a thread.
 */
export async function sendDiscussionMessage(
  channelId: string,
  input: SendDiscussionMessageInput
) {
  const user = await requireAuth();

  const parsed = sendDiscussionMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const channel = await prisma.discussionChannel.findUnique({
    where: { id: channelId },
  });

  if (!channel) {
    return { error: "Channel not found." };
  }

  await requireWorkspaceMember(channel.workspaceId);

  const { content, parentId, attachments } = parsed.data;

  // If announcement channel, require Admin/Owner
  if (channel.type === "ANNOUNCEMENT") {
    await requireWorkspaceMember(channel.workspaceId, ["OWNER", "ADMIN"]);
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
  }

  // Create message and handle thread parent updates in transaction
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.discussionMessage.create({
      data: {
        channelId,
        authorId: user.id,
        content,
        parentId: parentId || null,
        attachments: attachments && attachments.length > 0
          ? {
              create: attachments.map((att) => ({
                fileName: att.fileName,
                fileSize: att.fileSize,
                fileType: att.fileType,
                fileUrl: att.fileUrl,
              })),
            }
          : undefined,
        issueLinks: mentionedIssues.length > 0
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

    // Mark channel read for sender
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

  // Broadcast realtime event
  broadcastDiscussionEvent({
    type: "MESSAGE_SENT",
    workspaceId: channel.workspaceId,
    channelId: channel.id,
    timestamp: Date.now(),
    actor: { id: user.id, name: user.name, email: user.email, image: user.image },
    data: { message },
  });

  return { message };
}

/**
 * Toggles an emoji reaction on a message
 */
export async function toggleReaction(messageId: string, emoji: string) {
  const user = await requireAuth();

  const parsed = toggleDiscussionReactionSchema.safeParse({ messageId, emoji });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const message = await prisma.discussionMessage.findUnique({
    where: { id: messageId },
    include: { channel: true },
  });

  if (!message) {
    return { error: "Message not found." };
  }

  await requireWorkspaceMember(message.channel.workspaceId);

  const existing = await prisma.discussionReaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId: user.id,
        emoji,
      },
    },
  });

  let action: "ADDED" | "REMOVED";

  if (existing) {
    await prisma.discussionReaction.delete({
      where: { id: existing.id },
    });
    action = "REMOVED";
  } else {
    await prisma.discussionReaction.create({
      data: {
        messageId,
        userId: user.id,
        emoji,
      },
    });
    action = "ADDED";
  }

  broadcastDiscussionEvent({
    type: "REACTION_TOGGLED",
    workspaceId: message.channel.workspaceId,
    channelId: message.channelId,
    timestamp: Date.now(),
    actor: { id: user.id, name: user.name, email: user.email, image: user.image },
    data: {
      messageId,
      emoji,
      action,
      userId: user.id,
      userName: user.name,
    },
  });

  return { success: true, action };
}

/**
 * Marks channel as read for current user
 */
export async function markChannelAsRead(channelId: string) {
  const user = await requireAuth();

  await prisma.userChannelRead.upsert({
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

  return { success: true };
}

/**
 * Links an existing Issue to a Discussion Message/Thread
 */
export async function linkDiscussionToIssue(messageId: string, issueId: string) {
  const user = await requireAuth();

  const parsed = linkDiscussionToIssueSchema.safeParse({ messageId, issueId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const message = await prisma.discussionMessage.findUnique({
    where: { id: messageId },
    include: { channel: true },
  });

  if (!message) {
    return { error: "Message not found." };
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { project: true },
  });

  if (!issue) {
    return { error: "Issue not found." };
  }

  await requireWorkspaceMember(message.channel.workspaceId);

  const link = await prisma.discussionIssueLink.upsert({
    where: {
      messageId_issueId: {
        messageId,
        issueId,
      },
    },
    create: {
      messageId,
      issueId,
      createdById: user.id,
    },
    update: {},
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
  });

  // Log activity on the issue
  await prisma.activityLog.create({
    data: {
      workspaceId: message.channel.workspaceId,
      issueId: issue.id,
      actorId: user.id,
      action: "LINKED_DISCUSSION",
      details: {
        channelId: message.channelId,
        channelName: message.channel.name,
        messageId: message.id,
      },
    },
  });

  broadcastDiscussionEvent({
    type: "ISSUE_LINKED_TO_DISCUSSION",
    workspaceId: message.channel.workspaceId,
    channelId: message.channelId,
    timestamp: Date.now(),
    actor: { id: user.id, name: user.name, email: user.email, image: user.image },
    data: { messageId, link },
  });

  return { link };
}

/**
 * Creates an Issue directly from a Discussion Message and bi-directionally links them.
 */
export async function createIssueFromDiscussion(
  messageId: string,
  projectId: string,
  issueData: z.infer<typeof createIssueSchema>
) {
  const user = await requireAuth();

  const message = await prisma.discussionMessage.findUnique({
    where: { id: messageId },
    include: { channel: true, author: true },
  });

  if (!message) {
    return { error: "Message not found." };
  }

  await requireWorkspaceMember(message.channel.workspaceId);
  const { project } = await requireProjectAccess(projectId, "EDITOR");

  const parsed = createIssueSchema.safeParse(issueData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Atomically increment issue sequence and create issue + discussion link
  const result = await prisma.$transaction(async (tx) => {
    const updatedProject = await tx.project.update({
      where: { id: projectId },
      data: {
        issueSequence: { increment: 1 },
      },
      select: {
        issueSequence: true,
        key: true,
      },
    });

    const createdIssue = await tx.issue.create({
      data: {
        projectId,
        projectKey: updatedProject.key,
        issueNumber: updatedProject.issueSequence,
        title: parsed.data.title,
        description: parsed.data.description || `*Created from discussion in #${message.channel.name} by @${message.author.name || "user"}*:\n\n> ${message.content}`,
        status: parsed.data.status,
        priority: parsed.data.priority,
        assigneeId: parsed.data.assigneeId || null,
        sprintId: parsed.data.sprintId || null,
        estimate: parsed.data.estimate || null,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        creatorId: user.id,
        labels: parsed.data.labelIds && parsed.data.labelIds.length > 0
          ? {
              connect: parsed.data.labelIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        labels: true,
      },
    });

    // Create the Link
    const link = await tx.discussionIssueLink.create({
      data: {
        messageId,
        issueId: createdIssue.id,
        createdById: user.id,
      },
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
    });

    // Record Activity Log
    await tx.activityLog.create({
      data: {
        workspaceId: message.channel.workspaceId,
        issueId: createdIssue.id,
        actorId: user.id,
        action: "CREATED_FROM_DISCUSSION",
        details: {
          channelId: message.channelId,
          channelName: message.channel.name,
          messageId: message.id,
        },
      },
    });

    return { issue: createdIssue, link };
  });

  // Broadcast Realtime Events
  broadcastProjectEvent({
    type: "ISSUE_CREATED",
    projectId,
    timestamp: Date.now(),
    actor: { id: user.id, name: user.name, email: user.email, image: user.image },
    data: { issue: result.issue as any },
  });

  broadcastDiscussionEvent({
    type: "ISSUE_LINKED_TO_DISCUSSION",
    workspaceId: message.channel.workspaceId,
    channelId: message.channelId,
    timestamp: Date.now(),
    actor: { id: user.id, name: user.name, email: user.email, image: user.image },
    data: { messageId, link: result.link },
  });

  revalidatePath(`/[orgSlug]/[workspaceSlug]/projects/${project.key}/board`);

  return { issue: result.issue, link: result.link };
}

/**
 * Searches discussion messages across all channels in a workspace
 */
export async function searchDiscussions(workspaceId: string, query: string) {
  const user = await requireAuth();
  await requireWorkspaceMember(workspaceId);

  const cleanQuery = query.trim();
  if (!cleanQuery) return { messages: [] };

  const messages = await prisma.discussionMessage.findMany({
    where: {
      channel: { workspaceId },
      content: { contains: cleanQuery, mode: "insensitive" },
    },
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, image: true, email: true } },
      channel: {
        select: {
          id: true,
          name: true,
          project: { select: { name: true, key: true } },
        },
      },
    },
  });

  return { messages };
}

/**
 * Broadcasts a typing presence event
 */
export async function sendTypingIndicator(channelId: string) {
  const user = await requireAuth();

  const channel = await prisma.discussionChannel.findUnique({
    where: { id: channelId },
    select: { workspaceId: true },
  });

  if (!channel) return;

  broadcastDiscussionEvent({
    type: "TYPING_INDICATOR",
    workspaceId: channel.workspaceId,
    channelId,
    timestamp: Date.now(),
    actor: { id: user.id, name: user.name, email: user.email, image: user.image },
    data: { userId: user.id, userName: user.name || "Teammate" },
  });
}

/**
 * Fetches active discussion channels across all user workspaces for dashboard display
 */
export async function getActiveDiscussionsOverview() {
  const user = await requireAuth();

  const userWorkspaceIds = user.workspaceMembers.map((wm) => wm.workspace.id);

  if (userWorkspaceIds.length === 0) {
    return { channels: [] };
  }

  const channels = await prisma.discussionChannel.findMany({
    where: {
      workspaceId: { in: userWorkspaceIds },
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          organization: { select: { slug: true } },
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          key: true,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  return {
    channels: channels.map((c) => ({
      id: c.id,
      name: c.name,
      topic: c.topic,
      type: c.type,
      workspaceName: c.workspace.name,
      workspaceSlug: c.workspace.slug,
      orgSlug: c.workspace.organization.slug,
      projectName: c.project?.name || null,
      projectKey: c.project?.key || null,
      messageCount: c._count.messages,
      lastMessage: c.messages[0]
        ? {
            content: c.messages[0].content,
            authorName: c.messages[0].author.name,
            createdAt: c.messages[0].createdAt.toISOString(),
          }
        : null,
    })),
  };
}

/**
 * Searches issues in a workspace by key or query for autocomplete and hover cards
 */
export async function searchIssuesInWorkspace(workspaceId: string, query: string = "") {
  const user = await requireAuth();
  await requireWorkspaceMember(workspaceId);

  const cleanQuery = query.trim().replace(/^#/, "");

  let whereClause: any = {
    project: { workspaceId },
  };

  if (cleanQuery) {
    // Match by projectKey-number (e.g. "DEMO-2") or title substring
    const keyMatch = cleanQuery.match(/^([A-Za-z0-9]+)(?:-(\d+))?$/);

    if (keyMatch) {
      const key = keyMatch[1].toUpperCase();
      const num = keyMatch[2] ? parseInt(keyMatch[2], 10) : undefined;
      whereClause = {
        project: { workspaceId },
        OR: [
          num !== undefined
            ? { projectKey: key, issueNumber: num }
            : { projectKey: { contains: key, mode: "insensitive" } },
          { title: { contains: cleanQuery, mode: "insensitive" } },
        ],
      };
    } else {
      whereClause = {
        project: { workspaceId },
        title: { contains: cleanQuery, mode: "insensitive" },
      };
    }
  }

  const issues = await prisma.issue.findMany({
    where: whereClause,
    take: 8,
    orderBy: { updatedAt: "desc" },
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
      project: {
        select: { id: true, name: true, key: true },
      },
    },
  });

  return { issues };
}

