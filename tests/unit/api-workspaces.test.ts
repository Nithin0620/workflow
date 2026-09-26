process.env.NEXTAUTH_SECRET = "test-secret";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as listWorkspacesRoute, POST as createWorkspaceRoute } from "@/app/api/v1/workspaces/route";
import {
  GET as getWorkspaceRoute,
  PATCH as updateWorkspaceRoute,
  DELETE as deleteWorkspaceRoute,
} from "@/app/api/v1/workspaces/[workspaceId]/route";
import {
  GET as listMembersRoute,
  POST as inviteMemberRoute,
  DELETE as removeMemberRoute,
} from "@/app/api/v1/workspaces/[workspaceId]/members/route";
import { prisma } from "@/lib/db/prisma";
import { signApiToken } from "@/lib/api/auth";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    organization: {
      findFirst: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}));

describe("Workspaces REST API Endpoints", () => {
  const mockUser = {
    id: "user-1",
    email: "user1@example.com",
    name: "User One",
    image: null,
    workspaceMembers: [],
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

  describe("GET /api/v1/workspaces", () => {
    it("returns 401 when unauthenticated", async () => {
      const req = new Request("http://localhost/api/v1/workspaces");
      const res = await listWorkspacesRoute(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("returns user workspaces with role and details", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.workspaceMember.findMany as any).mockResolvedValue([
        {
          id: "wm-1",
          role: "OWNER",
          joinedAt: new Date("2026-01-01"),
          workspace: {
            id: "ws-1",
            name: "Engineering",
            slug: "engineering",
            organization: { id: "org-1", name: "Acme", slug: "acme" },
            _count: { projects: 3, members: 5, discussionChannels: 2 },
            banners: [{ id: "b-1", imageUrl: "https://example.com/banner.png" }],
          },
        },
      ]);

      const req = new Request("http://localhost/api/v1/workspaces", {
        headers: authHeader,
      });
      const res = await listWorkspacesRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.workspaces).toHaveLength(1);
      expect(data.workspaces[0].id).toBe("ws-1");
      expect(data.workspaces[0].role).toBe("OWNER");
      expect(data.workspaces[0].organization.name).toBe("Acme");
      expect(data.workspaces[0]._count.projects).toBe(3);
    });
  });

  describe("POST /api/v1/workspaces", () => {
    it("returns 401 when unauthenticated", async () => {
      const req = new Request("http://localhost/api/v1/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: "Dev Team", slug: "dev-team" }),
      });
      const res = await createWorkspaceRoute(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 when payload is invalid", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);

      const req = new Request("http://localhost/api/v1/workspaces", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "D", slug: "Invalid_Slug!" }),
      });

      const res = await createWorkspaceRoute(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("returns 404 when organization is not found", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.organization.findFirst as any).mockResolvedValue(null);

      const req = new Request("http://localhost/api/v1/workspaces", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Dev Team", slug: "dev-team", orgSlug: "nonexistent" }),
      });

      const res = await createWorkspaceRoute(req);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain("Organization not found");
    });

    it("returns 400 when workspace slug already exists in organization", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.organization.findFirst as any).mockResolvedValue({ id: "org-1", slug: "acme" });
      (prisma.workspace.findUnique as any).mockResolvedValue({ id: "ws-existing", slug: "dev-team" });

      const req = new Request("http://localhost/api/v1/workspaces", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Dev Team", slug: "dev-team" }),
      });

      const res = await createWorkspaceRoute(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("already exists");
    });

    it("creates workspace and sets user as OWNER member, returning 201", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.organization.findFirst as any).mockResolvedValue({ id: "org-1", slug: "acme" });
      (prisma.workspace.findUnique as any).mockResolvedValue(null);

      const createdWs = {
        id: "ws-new",
        name: "Dev Team",
        slug: "dev-team",
        organizationId: "org-1",
        organization: { id: "org-1", slug: "acme" },
        banners: [],
        _count: { projects: 0, members: 1, discussionChannels: 0 },
      };

      (prisma.workspace.create as any).mockResolvedValue(createdWs);
      (prisma.workspaceMember.create as any).mockResolvedValue({
        id: "wm-new",
        workspaceId: "ws-new",
        userId: mockUser.id,
        role: "OWNER",
      });

      const req = new Request("http://localhost/api/v1/workspaces", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Dev Team", slug: "dev-team" }),
      });

      const res = await createWorkspaceRoute(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.workspace.id).toBe("ws-new");
      expect(data.workspace.role).toBe("OWNER");
      expect(prisma.workspaceMember.create).toHaveBeenCalledWith({
        data: {
          workspaceId: "ws-new",
          userId: mockUser.id,
          role: "OWNER",
        },
      });
    });
  });

  describe("GET /api/v1/workspaces/[workspaceId]", () => {
    it("returns 404 when caller is not a member", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.workspaceMember.findUnique as any).mockResolvedValue(null);

      const req = new Request("http://localhost/api/v1/workspaces/ws-1", {
        headers: authHeader,
      });
      const res = await getWorkspaceRoute(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(404);
    });

    it("returns workspace details when caller is member", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: "ws-1",
        name: "Engineering",
        slug: "engineering",
        organization: { id: "org-1", name: "Acme" },
        _count: { members: 4, projects: 2, discussionChannels: 1 },
        banners: [],
      });

      const req = new Request("http://localhost/api/v1/workspaces/ws-1", {
        headers: authHeader,
      });
      const res = await getWorkspaceRoute(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.workspace.id).toBe("ws-1");
      expect(data.workspace.role).toBe("MEMBER");
      expect(data.workspace._count.members).toBe(4);
    });
  });

  describe("PATCH /api/v1/workspaces/[workspaceId]", () => {
    it("returns 403 if caller is regular MEMBER or VIEWER", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
        workspace: { id: "ws-1", organizationId: "org-1" },
      });

      const req = new Request("http://localhost/api/v1/workspaces/ws-1", {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated Name" }),
      });

      const res = await updateWorkspaceRoute(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Only owners and admins");
    });

    it("updates workspace details when caller is OWNER or ADMIN", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "ADMIN",
        workspace: { id: "ws-1", slug: "old-slug", organizationId: "org-1" },
      });
      (prisma.workspace.update as any).mockResolvedValue({
        id: "ws-1",
        name: "Renamed Team",
        slug: "old-slug",
        description: "New description",
        organization: { id: "org-1" },
        banners: [],
        _count: { members: 3, projects: 1, discussionChannels: 1 },
      });

      const req = new Request("http://localhost/api/v1/workspaces/ws-1", {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Renamed Team", description: "New description" }),
      });

      const res = await updateWorkspaceRoute(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.workspace.name).toBe("Renamed Team");
      expect(data.workspace.role).toBe("ADMIN");
    });
  });

  describe("DELETE /api/v1/workspaces/[workspaceId]", () => {
    it("returns 403 if caller is ADMIN or MEMBER (only OWNER can delete)", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "ADMIN",
      });

      const req = new Request("http://localhost/api/v1/workspaces/ws-1", {
        method: "DELETE",
        headers: authHeader,
      });

      const res = await deleteWorkspaceRoute(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(403);
    });

    it("deletes workspace when caller is OWNER", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "OWNER",
      });
      (prisma.workspace.delete as any).mockResolvedValue({ id: "ws-1" });

      const req = new Request("http://localhost/api/v1/workspaces/ws-1", {
        method: "DELETE",
        headers: authHeader,
      });

      const res = await deleteWorkspaceRoute(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toContain("deleted successfully");
      expect(prisma.workspace.delete).toHaveBeenCalledWith({ where: { id: "ws-1" } });
    });
  });

  describe("Workspace Members Routes", () => {
    describe("GET /api/v1/workspaces/[workspaceId]/members", () => {
      it("returns member list with profile details", async () => {
        (prisma.user.findFirst as any).mockResolvedValue(mockUser);
        (prisma.workspaceMember.findUnique as any).mockResolvedValue({
          id: "wm-1",
          workspaceId: "ws-1",
          userId: mockUser.id,
          role: "MEMBER",
        });
        (prisma.workspaceMember.findMany as any).mockResolvedValue([
          {
            id: "wm-1",
            role: "OWNER",
            joinedAt: new Date("2026-01-01"),
            user: {
              id: "user-1",
              name: "Alice",
              email: "alice@example.com",
              image: null,
            },
          },
          {
            id: "wm-2",
            role: "MEMBER",
            joinedAt: new Date("2026-01-02"),
            user: {
              id: "user-2",
              name: "Bob",
              email: "bob@example.com",
              image: "https://example.com/bob.png",
            },
          },
        ]);

        const req = new Request("http://localhost/api/v1/workspaces/ws-1/members", {
          headers: authHeader,
        });

        const res = await listMembersRoute(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.members).toHaveLength(2);
        expect(data.members[0].user.name).toBe("Alice");
      });
    });

    describe("POST /api/v1/workspaces/[workspaceId]/members", () => {
      it("returns 403 if caller is regular MEMBER", async () => {
        (prisma.user.findFirst as any).mockResolvedValue(mockUser);
        (prisma.workspaceMember.findUnique as any).mockResolvedValue({
          id: "wm-1",
          workspaceId: "ws-1",
          userId: mockUser.id,
          role: "MEMBER",
        });

        const req = new Request("http://localhost/api/v1/workspaces/ws-1/members", {
          method: "POST",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({ email: "newmember@example.com", role: "MEMBER" }),
        });

        const res = await inviteMemberRoute(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
        expect(res.status).toBe(403);
      });

      it("returns 404 if target user does not exist", async () => {
        (prisma.user.findFirst as any).mockResolvedValue(mockUser);
        (prisma.workspaceMember.findUnique as any).mockResolvedValue({
          id: "wm-1",
          workspaceId: "ws-1",
          userId: mockUser.id,
          role: "ADMIN",
        });
        (prisma.user.findUnique as any).mockResolvedValue(null);

        const req = new Request("http://localhost/api/v1/workspaces/ws-1/members", {
          method: "POST",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({ email: "unknown@example.com", role: "MEMBER" }),
        });

        const res = await inviteMemberRoute(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data.error).toContain("does not exist");
      });

      it("adds existing user to workspace as member", async () => {
        (prisma.user.findFirst as any).mockResolvedValue(mockUser);
        (prisma.workspaceMember.findUnique as any)
          .mockResolvedValueOnce({
            id: "wm-caller",
            workspaceId: "ws-1",
            userId: mockUser.id,
            role: "OWNER",
          })
          .mockResolvedValueOnce(null); // not already a member

        (prisma.user.findUnique as any).mockResolvedValue({
          id: "user-2",
          email: "target@example.com",
        });

        (prisma.workspaceMember.create as any).mockResolvedValue({
          id: "wm-created",
          workspaceId: "ws-1",
          userId: "user-2",
          role: "ADMIN",
          user: {
            id: "user-2",
            name: "Target User",
            email: "target@example.com",
            image: null,
          },
        });

        const req = new Request("http://localhost/api/v1/workspaces/ws-1/members", {
          method: "POST",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({ email: "target@example.com", role: "ADMIN" }),
        });

        const res = await inviteMemberRoute(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.member.id).toBe("wm-created");
        expect(data.member.role).toBe("ADMIN");
      });
    });

    describe("DELETE /api/v1/workspaces/[workspaceId]/members", () => {
      it("prevents removing the only OWNER", async () => {
        (prisma.user.findFirst as any).mockResolvedValue(mockUser);
        (prisma.workspaceMember.findUnique as any).mockResolvedValue({
          id: "wm-owner",
          workspaceId: "ws-1",
          userId: mockUser.id,
          role: "OWNER",
        });
        (prisma.workspaceMember.findFirst as any).mockResolvedValue({
          id: "wm-owner",
          workspaceId: "ws-1",
          userId: mockUser.id,
          role: "OWNER",
          user: mockUser,
        });
        (prisma.workspaceMember.count as any).mockResolvedValue(1);

        const req = new Request("http://localhost/api/v1/workspaces/ws-1/members?memberId=wm-owner", {
          method: "DELETE",
          headers: authHeader,
        });

        const res = await removeMemberRoute(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain("Cannot remove the only workspace owner");
      });

      it("prevents ADMIN from removing another ADMIN or OWNER", async () => {
        (prisma.user.findFirst as any).mockResolvedValue(mockUser);
        (prisma.workspaceMember.findUnique as any).mockResolvedValue({
          id: "wm-admin-1",
          workspaceId: "ws-1",
          userId: mockUser.id,
          role: "ADMIN",
        });
        (prisma.workspaceMember.findFirst as any).mockResolvedValue({
          id: "wm-admin-2",
          workspaceId: "ws-1",
          userId: "user-other",
          role: "ADMIN",
          user: { id: "user-other", email: "other@example.com" },
        });

        const req = new Request("http://localhost/api/v1/workspaces/ws-1/members?memberId=wm-admin-2", {
          method: "DELETE",
          headers: authHeader,
        });

        const res = await removeMemberRoute(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toContain("Admins cannot remove other Admins or Owners");
      });

      it("allows OWNER to remove a member", async () => {
        (prisma.user.findFirst as any).mockResolvedValue(mockUser);
        (prisma.workspaceMember.findUnique as any).mockResolvedValue({
          id: "wm-owner",
          workspaceId: "ws-1",
          userId: mockUser.id,
          role: "OWNER",
        });
        (prisma.workspaceMember.findFirst as any).mockResolvedValue({
          id: "wm-member-2",
          workspaceId: "ws-1",
          userId: "user-2",
          role: "MEMBER",
          user: { id: "user-2", email: "user2@example.com" },
        });
        (prisma.workspaceMember.delete as any).mockResolvedValue({ id: "wm-member-2" });

        const req = new Request("http://localhost/api/v1/workspaces/ws-1/members?memberId=wm-member-2", {
          method: "DELETE",
          headers: authHeader,
        });

        const res = await removeMemberRoute(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.message).toContain("removed successfully");
        expect(prisma.workspaceMember.delete).toHaveBeenCalledWith({ where: { id: "wm-member-2" } });
      });
    });
  });
});
