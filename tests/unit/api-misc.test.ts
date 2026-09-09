import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GET as getChannelsRoute,
  POST as createChannelRoute,
} from "@/app/api/v1/workspaces/[workspaceId]/channels/route";
import {
  GET as getMessagesRoute,
  POST as createMessageRoute,
} from "@/app/api/v1/channels/[channelId]/messages/route";
import {
  GET as getNotificationsRoute,
  PATCH as updateNotificationsRoute,
} from "@/app/api/v1/notifications/route";
import {
  GET as getProfileRoute,
  PATCH as updateProfileRoute,
} from "@/app/api/v1/profile/route";
import { prisma } from "@/lib/db/prisma";
import { signApiToken } from "@/lib/api/auth";
import { hashPassword } from "@/lib/auth/password";
import * as realtimeEvents from "@/lib/realtime/events";
import * as notificationActions from "@/actions/notifications";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    discussionChannel: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    discussionMessage: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userChannelRead: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
    notification: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    issue: {
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}));

describe("Discussions, Notifications & Profile REST API Endpoints", () => {
  const mockUser = {
    id: "user-1",
    email: "user1@example.com",
    name: "User One",
    image: "https://example.com/user1.png",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-02"),
    workspaceMembers: [
      {
        id: "wm-1",
        role: "MEMBER",
        workspaceId: "ws-1",
        workspace: {
          id: "ws-1",
          name: "Engineering",
          slug: "engineering",
          organization: { id: "org-1", name: "Acme", slug: "acme" },
        },
      },
    ],
  };

  const authHeader = {
    Authorization: `Bearer ${signApiToken({
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
    })}`,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. Workspace Channels API
  // =========================================================================
  describe("GET /api/v1/workspaces/[workspaceId]/channels", () => {
    it("returns 401 when unauthenticated", async () => {
      const req = new Request("http://localhost/api/v1/workspaces/ws-1/channels");
      const res = await getChannelsRoute(req, {
        params: Promise.resolve({ workspaceId: "ws-1" }),
      });
      expect(res.status).toBe(401);
    });

    it("returns 404 when user is not a workspace member", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.workspaceMember.findUnique as any).mockResolvedValue(null);

      const req = new Request("http://localhost/api/v1/workspaces/ws-1/channels", {
        headers: authHeader,
      });
      const res = await getChannelsRoute(req, {
        params: Promise.resolve({ workspaceId: "ws-1" }),
      });
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain("access denied");
    });

    it("returns list of channels with message count and unread status", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });

      const mockChannels = [
        {
          id: "ch-1",
          workspaceId: "ws-1",
          projectId: null,
          name: "general",
          topic: "General discussions",
          type: "TEXT",
          isPrivate: false,
          position: 0,
          createdAt: new Date("2026-01-01"),
          updatedAt: new Date("2026-01-01"),
          project: null,
          reads: [{ lastReadAt: new Date("2026-01-02") }],
          _count: { messages: 15 },
        },
      ];

      (prisma.discussionChannel.findMany as any).mockResolvedValue(mockChannels);
      (prisma.$queryRaw as any).mockResolvedValue([
        { channelId: "ch-1", count: 3 },
      ]);

      const req = new Request("http://localhost/api/v1/workspaces/ws-1/channels", {
        headers: authHeader,
      });
      const res = await getChannelsRoute(req, {
        params: Promise.resolve({ workspaceId: "ws-1" }),
      });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.channels).toHaveLength(1);
      expect(data.channels[0].id).toBe("ch-1");
      expect(data.channels[0].name).toBe("general");
      expect(data.channels[0].messageCount).toBe(15);
      expect(data.channels[0].unreadCount).toBe(3);
      expect(data.channels[0].isUnread).toBe(true);
    });
  });

  describe("POST /api/v1/workspaces/[workspaceId]/channels", () => {
    it("returns 401 when unauthenticated", async () => {
      const req = new Request("http://localhost/api/v1/workspaces/ws-1/channels", {
        method: "POST",
        body: JSON.stringify({ name: "frontend" }),
      });
      const res = await createChannelRoute(req, {
        params: Promise.resolve({ workspaceId: "ws-1" }),
      });
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid body payload", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
      });

      const req = new Request("http://localhost/api/v1/workspaces/ws-1/channels", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Invalid Name With Spaces!" }),
      });
      const res = await createChannelRoute(req, {
        params: Promise.resolve({ workspaceId: "ws-1" }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("returns 400 when project does not exist in workspace", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
      });
      (prisma.project.findFirst as any).mockResolvedValue(null);

      const req = new Request("http://localhost/api/v1/workspaces/ws-1/channels", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "features", projectId: "proj-invalid" }),
      });
      const res = await createChannelRoute(req, {
        params: Promise.resolve({ workspaceId: "ws-1" }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Project not found");
    });

    it("returns 400 when channel already exists in workspace/project scope", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
      });
      (prisma.discussionChannel.findUnique as any).mockResolvedValue({
        id: "ch-existing",
        name: "general",
      });

      const req = new Request("http://localhost/api/v1/workspaces/ws-1/channels", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "general" }),
      });
      const res = await createChannelRoute(req, {
        params: Promise.resolve({ workspaceId: "ws-1" }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("already exists");
    });

    it("creates discussion channel and returns 201", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
      });
      (prisma.discussionChannel.findUnique as any).mockResolvedValue(null);

      const createdChannel = {
        id: "ch-new",
        workspaceId: "ws-1",
        projectId: null,
        name: "frontend",
        topic: "Frontend discussion",
        type: "TEXT",
        isPrivate: false,
        position: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        project: null,
      };

      (prisma.discussionChannel.create as any).mockResolvedValue(createdChannel);
      (prisma.userChannelRead.create as any).mockResolvedValue({ id: "read-1" });

      const req = new Request("http://localhost/api/v1/workspaces/ws-1/channels", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "frontend",
          topic: "Frontend discussion",
        }),
      });

      const res = await createChannelRoute(req, {
        params: Promise.resolve({ workspaceId: "ws-1" }),
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.channel.id).toBe("ch-new");
      expect(data.channel.name).toBe("frontend");
    });
  });

  // =========================================================================
  // 2. Channel Messages API
  // =========================================================================
  describe("GET /api/v1/channels/[channelId]/messages", () => {
    it("returns 401 when unauthenticated", async () => {
      const req = new Request("http://localhost/api/v1/channels/ch-1/messages");
      const res = await getMessagesRoute(req, {
        params: Promise.resolve({ channelId: "ch-1" }),
      });
      expect(res.status).toBe(401);
    });

    it("returns 404 if channel not found or access denied", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.discussionChannel.findUnique as any).mockResolvedValue(null);

      const req = new Request("http://localhost/api/v1/channels/ch-1/messages", {
        headers: authHeader,
      });
      const res = await getMessagesRoute(req, {
        params: Promise.resolve({ channelId: "ch-1" }),
      });
      expect(res.status).toBe(404);
    });

    it("returns messages with author, reactions, attachments, and cursor support", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.discussionChannel.findUnique as any).mockResolvedValue({
        id: "ch-1",
        workspaceId: "ws-1",
      });
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
      });

      const mockMessages = [
        {
          id: "msg-1",
          channelId: "ch-1",
          authorId: "user-1",
          content: "Hello team!",
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: { id: "user-1", name: "User One", email: "user1@example.com", image: null },
          attachments: [
            {
              id: "att-1",
              fileName: "diagram.png",
              fileSize: 1024,
              fileType: "image/png",
              fileUrl: "https://example.com/diagram.png",
            },
          ],
          reactions: [
            {
              id: "react-1",
              emoji: "👍",
              user: { id: "user-2", name: "User Two" },
            },
          ],
          issueLinks: [],
        },
      ];

      (prisma.discussionMessage.findMany as any).mockResolvedValue(mockMessages);

      const req = new Request("http://localhost/api/v1/channels/ch-1/messages?limit=20&cursor=prev-msg", {
        headers: authHeader,
      });
      const res = await getMessagesRoute(req, {
        params: Promise.resolve({ channelId: "ch-1" }),
      });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.messages).toHaveLength(1);
      expect(data.messages[0].id).toBe("msg-1");
      expect(data.messages[0].author.name).toBe("User One");
      expect(data.messages[0].attachments).toHaveLength(1);
      expect(data.messages[0].reactions).toHaveLength(1);
    });
  });

  describe("POST /api/v1/channels/[channelId]/messages", () => {
    it("returns 401 when unauthenticated", async () => {
      const req = new Request("http://localhost/api/v1/channels/ch-1/messages", {
        method: "POST",
        body: JSON.stringify({ content: "Hello" }),
      });
      const res = await createMessageRoute(req, {
        params: Promise.resolve({ channelId: "ch-1" }),
      });
      expect(res.status).toBe(401);
    });

    it("returns 403 when posting to ANNOUNCEMENT channel as regular member", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.discussionChannel.findUnique as any).mockResolvedValue({
        id: "ch-announcements",
        workspaceId: "ws-1",
        type: "ANNOUNCEMENT",
      });
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });

      const req = new Request("http://localhost/api/v1/channels/ch-announcements/messages", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Unauthorized announcement" }),
      });

      const res = await createMessageRoute(req, {
        params: Promise.resolve({ channelId: "ch-announcements" }),
      });
      expect(res.status).toBe(403);
    });

    it("returns 400 when message payload is empty or invalid", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.discussionChannel.findUnique as any).mockResolvedValue({
        id: "ch-1",
        workspaceId: "ws-1",
        type: "TEXT",
      });
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });

      const req = new Request("http://localhost/api/v1/channels/ch-1/messages", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ content: "" }),
      });

      const res = await createMessageRoute(req, {
        params: Promise.resolve({ channelId: "ch-1" }),
      });
      expect(res.status).toBe(400);
    });

    it("creates message, auto-links issue mentions, and returns 201", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.discussionChannel.findUnique as any).mockResolvedValue({
        id: "ch-1",
        workspaceId: "ws-1",
        name: "general",
        type: "TEXT",
      });
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });

      (prisma.issue.findMany as any).mockResolvedValue([
        {
          id: "issue-1",
          projectKey: "DEV",
          issueNumber: 12,
          title: "Fix bug",
          status: "TODO",
          priority: "HIGH",
          assignee: null,
        },
      ]);

      const createdMsg = {
        id: "msg-created-1",
        channelId: "ch-1",
        authorId: mockUser.id,
        content: "Working on DEV-12 now",
        parentId: null,
        author: { id: mockUser.id, name: mockUser.name, email: mockUser.email, image: mockUser.image },
        attachments: [],
        reactions: [],
        issueLinks: [{ issue: { id: "issue-1", projectKey: "DEV", issueNumber: 12, title: "Fix bug" } }],
      };

      (prisma.discussionMessage.create as any).mockResolvedValue(createdMsg);
      (prisma.userChannelRead.upsert as any).mockResolvedValue({});

      const req = new Request("http://localhost/api/v1/channels/ch-1/messages", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Working on DEV-12 now" }),
      });

      const res = await createMessageRoute(req, {
        params: Promise.resolve({ channelId: "ch-1" }),
      });
      expect(res.status).toBe(201);

      const data = await res.json();
      expect(data.message.id).toBe("msg-created-1");
      expect(data.message.content).toBe("Working on DEV-12 now");
      expect(data.message.issueLinks).toHaveLength(1);
    });
  });

  // =========================================================================
  // 3. Notifications API
  // =========================================================================
  describe("GET /api/v1/notifications", () => {
    it("returns 401 when unauthenticated", async () => {
      const req = new Request("http://localhost/api/v1/notifications");
      const res = await getNotificationsRoute(req);
      expect(res.status).toBe(401);
    });

    it("returns notifications and unread count for authenticated user", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.notification.findMany as any).mockResolvedValue([
        {
          id: "notif-1",
          userId: mockUser.id,
          title: "Issue Assigned",
          message: "You have been assigned to DEV-1",
          link: "/workspaces/ws-1/issues/DEV-1",
          isRead: false,
          createdAt: new Date(),
        },
      ]);
      (prisma.notification.count as any).mockResolvedValue(1);

      const req = new Request("http://localhost/api/v1/notifications", {
        headers: authHeader,
      });

      const res = await getNotificationsRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.notifications).toHaveLength(1);
      expect(data.unreadCount).toBe(1);
      expect(data.notifications[0].title).toBe("Issue Assigned");
    });
  });

  describe("PATCH /api/v1/notifications", () => {
    it("returns 401 when unauthenticated", async () => {
      const req = new Request("http://localhost/api/v1/notifications", {
        method: "PATCH",
        body: JSON.stringify({ all: true }),
      });
      const res = await updateNotificationsRoute(req);
      expect(res.status).toBe(401);
    });

    it("marks all notifications as read when all: true", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.notification.updateMany as any).mockResolvedValue({ count: 5 });

      const req = new Request("http://localhost/api/v1/notifications", {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      const res = await updateNotificationsRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, isRead: false },
        data: { isRead: true },
      });
    });

    it("marks a specific notification as read by id", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.notification.findUnique as any).mockResolvedValue({
        id: "notif-1",
        userId: mockUser.id,
        isRead: false,
      });
      (prisma.notification.update as any).mockResolvedValue({
        id: "notif-1",
        isRead: true,
      });

      const req = new Request("http://localhost/api/v1/notifications", {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ id: "notif-1" }),
      });

      const res = await updateNotificationsRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: "notif-1" },
        data: { isRead: true },
      });
    });

    it("returns 404 if notification not found or belongs to another user", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.notification.findUnique as any).mockResolvedValue({
        id: "notif-other",
        userId: "other-user-999",
      });

      const req = new Request("http://localhost/api/v1/notifications", {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ id: "notif-other" }),
      });

      const res = await updateNotificationsRoute(req);
      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // 4. User Profile API
  // =========================================================================
  describe("GET /api/v1/profile", () => {
    it("returns 401 when unauthenticated", async () => {
      const req = new Request("http://localhost/api/v1/profile");
      const res = await getProfileRoute(req);
      expect(res.status).toBe(401);
    });

    it("returns user profile with workspace memberships", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const req = new Request("http://localhost/api/v1/profile", {
        headers: authHeader,
      });

      const res = await getProfileRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.profile.id).toBe(mockUser.id);
      expect(data.profile.email).toBe(mockUser.email);
      expect(data.profile.workspaceMemberships).toHaveLength(1);
    });
  });

  describe("PATCH /api/v1/profile", () => {
    it("returns 401 when unauthenticated", async () => {
      const req = new Request("http://localhost/api/v1/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated Name" }),
      });
      const res = await updateProfileRoute(req);
      expect(res.status).toBe(401);
    });

    it("updates profile name and image", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.user.update as any).mockResolvedValue({
        id: mockUser.id,
        name: "New Profile Name",
        email: mockUser.email,
        image: "https://example.com/new-avatar.png",
        createdAt: mockUser.createdAt,
        updatedAt: new Date(),
      });

      const req = new Request("http://localhost/api/v1/profile", {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Profile Name",
          image: "https://example.com/new-avatar.png",
        }),
      });

      const res = await updateProfileRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.user.name).toBe("New Profile Name");
      expect(data.user.image).toBe("https://example.com/new-avatar.png");
    });

    it("returns 400 when changing password without current password", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);

      const req = new Request("http://localhost/api/v1/profile", {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: "NewSecretPassword123!",
        }),
      });

      const res = await updateProfileRoute(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Current password is required");
    });

    it("returns 400 when current password is wrong", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      const passwordHash = await hashPassword("ActualPassword123!");
      (prisma.user.findUnique as any).mockResolvedValue({
        id: mockUser.id,
        passwordHash,
      });

      const req = new Request("http://localhost/api/v1/profile", {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: "WrongPassword999!",
          newPassword: "NewSecretPassword123!",
        }),
      });

      const res = await updateProfileRoute(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Incorrect current password");
    });

    it("successfully changes password when current password is verified", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      const passwordHash = await hashPassword("CorrectOldPassword123!");
      (prisma.user.findUnique as any).mockResolvedValue({
        id: mockUser.id,
        passwordHash,
      });
      (prisma.user.update as any).mockResolvedValue({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        image: mockUser.image,
        createdAt: mockUser.createdAt,
        updatedAt: new Date(),
      });

      const req = new Request("http://localhost/api/v1/profile", {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: "CorrectOldPassword123!",
          newPassword: "BrandNewPassword789!",
        }),
      });

      const res = await updateProfileRoute(req);
      expect(res.status).toBe(200);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            passwordHash: expect.any(String),
          }),
        })
      );
    });
  });
});
