process.env.NEXTAUTH_SECRET = "test-secret";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as listProjectsRoute, POST as createProjectRoute } from "@/app/api/v1/workspaces/[workspaceId]/projects/route";
import {
  GET as getProjectRoute,
  PATCH as updateProjectRoute,
  DELETE as deleteProjectRoute,
} from "@/app/api/v1/projects/[projectId]/route";
import {
  GET as getColumnsRoute,
  POST as createOrReorderColumnsRoute,
} from "@/app/api/v1/projects/[projectId]/columns/route";
import {
  GET as getMembersRoute,
  POST as addOrUpdateMemberRoute,
  DELETE as removeMemberRoute,
} from "@/app/api/v1/projects/[projectId]/members/route";
import { prisma } from "@/lib/db/prisma";
import { signApiToken } from "@/lib/api/auth";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    boardColumn: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    projectMember: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => {
      if (typeof callback === "function") {
        return callback(prisma);
      }
      return Promise.all(callback);
    }),
  },
}));

vi.mock("@/lib/realtime/events", () => ({
  broadcastProjectEvent: vi.fn(),
}));

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}));

describe("Projects & Columns REST API Endpoints", () => {
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

  // -------------------------------------------------------------
  // 1. Workspace Projects Routes
  // -------------------------------------------------------------
  describe("GET /api/v1/workspaces/[workspaceId]/projects", () => {
    it("returns 401 when unauthenticated", async () => {
      const req = new Request("http://localhost/api/v1/workspaces/ws-1/projects");
      const res = await listProjectsRoute(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 404 when user is not a member of workspace", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.workspaceMember.findUnique as any).mockResolvedValue(null);

      const req = new Request("http://localhost/api/v1/workspaces/ws-1/projects", {
        headers: authHeader,
      });
      const res = await listProjectsRoute(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(404);
    });

    it("returns projects filtered for workspace member", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });
      (prisma.project.findMany as any).mockResolvedValue([
        {
          id: "proj-1",
          name: "Project One",
          key: "P1",
          isPrivate: false,
          lead: { id: "user-1", name: "User One" },
          members: [],
          _count: { issues: 10, members: 2, columns: 5 },
        },
      ]);

      const req = new Request("http://localhost/api/v1/workspaces/ws-1/projects", {
        headers: authHeader,
      });
      const res = await listProjectsRoute(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.projects).toHaveLength(1);
      expect(data.projects[0].key).toBe("P1");
      expect(data.projects[0]._count.issues).toBe(10);
    });
  });

  describe("POST /api/v1/workspaces/[workspaceId]/projects", () => {
    it("returns 403 when workspace role is VIEWER", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "VIEWER",
      });

      const req = new Request("http://localhost/api/v1/workspaces/ws-1/projects", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Project X", key: "PX" }),
      });

      const res = await createProjectRoute(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(403);
    });

    it("returns 400 when key already exists in workspace", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });
      (prisma.project.findUnique as any).mockResolvedValue({ id: "proj-old", key: "PX" });

      const req = new Request("http://localhost/api/v1/workspaces/ws-1/projects", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Project X", key: "PX" }),
      });

      const res = await createProjectRoute(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("already exists");
    });

    it("creates project with default columns and assigns user as OWNER member", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });
      (prisma.project.findUnique as any).mockResolvedValue(null);

      const createdProj = {
        id: "proj-new",
        name: "Project Alpha",
        key: "ALPHA",
        workspaceId: "ws-1",
        columns: [
          { name: "Backlog", key: "BACKLOG", order: 0 },
          { name: "To Do", key: "TODO", order: 1000 },
          { name: "In Progress", key: "IN_PROGRESS", order: 2000 },
          { name: "In Review", key: "IN_REVIEW", order: 3000 },
          { name: "Done", key: "DONE", order: 4000 },
        ],
        members: [{ userId: mockUser.id, role: "OWNER" }],
        _count: { issues: 0, members: 1, columns: 5 },
      };

      (prisma.project.create as any).mockResolvedValue(createdProj);
      (prisma.activityLog.create as any).mockResolvedValue({ id: "act-1" });

      const req = new Request("http://localhost/api/v1/workspaces/ws-1/projects", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Project Alpha", key: "ALPHA", description: "Alpha project" }),
      });

      const res = await createProjectRoute(req, { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.project.id).toBe("proj-new");
      expect(data.project.columns).toHaveLength(5);
    });
  });

  // -------------------------------------------------------------
  // 2. Project by ID Routes
  // -------------------------------------------------------------
  describe("GET /api/v1/projects/[projectId]", () => {
    it("returns project details with columns, members, active sprint", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.project.findUnique as any)
        .mockResolvedValueOnce({
          id: "proj-1",
          workspaceId: "ws-1",
          isPrivate: false,
          members: [{ role: "OWNER" }],
        })
        .mockResolvedValueOnce({
          id: "proj-1",
          name: "Project One",
          key: "P1",
          columns: [{ id: "col-1", name: "To Do", order: 0 }],
          members: [{ user: { id: mockUser.id, name: "User One" }, role: "OWNER" }],
          lead: { id: mockUser.id, name: "User One" },
          sprints: [{ id: "sp-1", name: "Sprint 1", isActive: true }],
          repository: null,
          _count: { issues: 5, members: 1, columns: 1 },
        });

      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });

      const req = new Request("http://localhost/api/v1/projects/proj-1", {
        headers: authHeader,
      });

      const res = await getProjectRoute(req, { params: Promise.resolve({ projectId: "proj-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.project.id).toBe("proj-1");
      expect(data.project.activeSprint.id).toBe("sp-1");
      expect(data.project.role).toBe("OWNER");
    });
  });

  describe("PATCH /api/v1/projects/[projectId]", () => {
    it("returns 403 when user is VIEWER", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.project.findUnique as any).mockResolvedValue({
        id: "proj-1",
        workspaceId: "ws-1",
        isPrivate: false,
        members: [{ role: "VIEWER" }],
      });
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "VIEWER",
      });

      const req = new Request("http://localhost/api/v1/projects/proj-1", {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated Name" }),
      });

      const res = await updateProjectRoute(req, { params: Promise.resolve({ projectId: "proj-1" }) });
      expect(res.status).toBe(403);
    });

    it("updates project when user is EDITOR or OWNER", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.project.findUnique as any).mockResolvedValue({
        id: "proj-1",
        workspaceId: "ws-1",
        isPrivate: false,
        members: [{ role: "EDITOR" }],
      });
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });
      (prisma.project.update as any).mockResolvedValue({
        id: "proj-1",
        name: "Renamed Project",
        description: "New desc",
        columns: [],
        _count: { issues: 0, members: 1, columns: 0 },
      });

      const req = new Request("http://localhost/api/v1/projects/proj-1", {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Renamed Project", description: "New desc" }),
      });

      const res = await updateProjectRoute(req, { params: Promise.resolve({ projectId: "proj-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.project.name).toBe("Renamed Project");
    });
  });

  describe("DELETE /api/v1/projects/[projectId]", () => {
    it("returns 403 when user is EDITOR (only OWNER can delete)", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.project.findUnique as any).mockResolvedValue({
        id: "proj-1",
        workspaceId: "ws-1",
        isPrivate: false,
        members: [{ role: "EDITOR" }],
      });
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });

      const req = new Request("http://localhost/api/v1/projects/proj-1", {
        method: "DELETE",
        headers: authHeader,
      });

      const res = await deleteProjectRoute(req, { params: Promise.resolve({ projectId: "proj-1" }) });
      expect(res.status).toBe(403);
    });

    it("deletes project when user is OWNER", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.project.findUnique as any).mockResolvedValue({
        id: "proj-1",
        workspaceId: "ws-1",
        isPrivate: false,
        members: [{ role: "OWNER" }],
      });
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });
      (prisma.project.delete as any).mockResolvedValue({ id: "proj-1" });

      const req = new Request("http://localhost/api/v1/projects/proj-1", {
        method: "DELETE",
        headers: authHeader,
      });

      const res = await deleteProjectRoute(req, { params: Promise.resolve({ projectId: "proj-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toContain("deleted successfully");
    });
  });

  // -------------------------------------------------------------
  // 3. Project Columns Routes
  // -------------------------------------------------------------
  describe("GET /api/v1/projects/[projectId]/columns", () => {
    it("returns columns ordered by position", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.project.findUnique as any).mockResolvedValue({
        id: "proj-1",
        workspaceId: "ws-1",
        isPrivate: false,
        members: [{ role: "EDITOR" }],
      });
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });
      (prisma.boardColumn.findMany as any).mockResolvedValue([
        { id: "c1", name: "Backlog", order: 0 },
        { id: "c2", name: "To Do", order: 1000 },
      ]);

      const req = new Request("http://localhost/api/v1/projects/proj-1/columns", {
        headers: authHeader,
      });

      const res = await getColumnsRoute(req, { params: Promise.resolve({ projectId: "proj-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.columns).toHaveLength(2);
      expect(data.columns[0].name).toBe("Backlog");
    });
  });

  describe("POST /api/v1/projects/[projectId]/columns", () => {
    it("creates a new column and returns 201", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.project.findUnique as any).mockResolvedValue({
        id: "proj-1",
        workspaceId: "ws-1",
        isPrivate: false,
        members: [{ role: "EDITOR" }],
      });
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });
      (prisma.boardColumn.findFirst as any).mockResolvedValue({ order: 4000 });
      (prisma.boardColumn.create as any).mockResolvedValue({
        id: "col-qa",
        name: "QA Testing",
        key: "QA_TESTING_1234",
        color: "#8b5cf6",
        order: 5000,
      });

      const req = new Request("http://localhost/api/v1/projects/proj-1/columns", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "QA Testing", color: "#8b5cf6" }),
      });

      const res = await createOrReorderColumnsRoute(req, { params: Promise.resolve({ projectId: "proj-1" }) });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.column.name).toBe("QA Testing");
      expect(data.column.order).toBe(5000);
    });

    it("reorders columns when orderedColumnIds provided", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.project.findUnique as any).mockResolvedValue({
        id: "proj-1",
        workspaceId: "ws-1",
        isPrivate: false,
        members: [{ role: "EDITOR" }],
      });
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });
      (prisma.boardColumn.findMany as any)
        .mockResolvedValueOnce([{ id: "c2" }, { id: "c1" }])
        .mockResolvedValueOnce([
          { id: "c2", name: "To Do", order: 0 },
          { id: "c1", name: "Backlog", order: 1000 },
        ]);
      (prisma.boardColumn.update as any).mockResolvedValue({});

      const req = new Request("http://localhost/api/v1/projects/proj-1/columns", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ orderedColumnIds: ["c2", "c1"] }),
      });

      const res = await createOrReorderColumnsRoute(req, { params: Promise.resolve({ projectId: "proj-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.columns).toHaveLength(2);
      expect(data.columns[0].id).toBe("c2");
    });
  });

  // -------------------------------------------------------------
  // 4. Project Members Routes
  // -------------------------------------------------------------
  describe("GET /api/v1/projects/[projectId]/members", () => {
    it("returns list of project members", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.project.findUnique as any).mockResolvedValue({
        id: "proj-1",
        workspaceId: "ws-1",
        isPrivate: false,
        members: [{ role: "EDITOR" }],
      });
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });
      (prisma.projectMember.findMany as any).mockResolvedValue([
        {
          id: "pm-1",
          userId: "user-1",
          role: "OWNER",
          user: { id: "user-1", name: "Alice", email: "alice@example.com" },
        },
      ]);

      const req = new Request("http://localhost/api/v1/projects/proj-1/members", {
        headers: authHeader,
      });

      const res = await getMembersRoute(req, { params: Promise.resolve({ projectId: "proj-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.members).toHaveLength(1);
      expect(data.members[0].user.name).toBe("Alice");
    });
  });

  describe("POST /api/v1/projects/[projectId]/members", () => {
    it("returns 403 if caller is not OWNER", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.project.findUnique as any).mockResolvedValue({
        id: "proj-1",
        workspaceId: "ws-1",
        isPrivate: false,
        members: [{ role: "EDITOR" }],
      });
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });

      const req = new Request("http://localhost/api/v1/projects/proj-1/members", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-2", role: "EDITOR" }),
      });

      const res = await addOrUpdateMemberRoute(req, { params: Promise.resolve({ projectId: "proj-1" }) });
      expect(res.status).toBe(403);
    });

    it("upserts project member role when caller is OWNER", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.project.findUnique as any).mockResolvedValue({
        id: "proj-1",
        workspaceId: "ws-1",
        isPrivate: false,
        members: [{ role: "OWNER" }],
      });
      (prisma.workspaceMember.findUnique as any)
        .mockResolvedValueOnce({
          id: "wm-caller",
          workspaceId: "ws-1",
          userId: mockUser.id,
          role: "MEMBER",
        })
        .mockResolvedValueOnce({
          id: "wm-target",
          workspaceId: "ws-1",
          userId: "user-2",
          role: "MEMBER",
        });

      (prisma.projectMember.upsert as any).mockResolvedValue({
        id: "pm-2",
        projectId: "proj-1",
        userId: "user-2",
        role: "EDITOR",
        user: { id: "user-2", name: "Bob", email: "bob@example.com" },
      });

      const req = new Request("http://localhost/api/v1/projects/proj-1/members", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-2", role: "EDITOR" }),
      });

      const res = await addOrUpdateMemberRoute(req, { params: Promise.resolve({ projectId: "proj-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.member.userId).toBe("user-2");
      expect(data.member.role).toBe("EDITOR");
    });
  });

  describe("DELETE /api/v1/projects/[projectId]/members", () => {
    it("removes project member when caller is OWNER", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.project.findUnique as any).mockResolvedValue({
        id: "proj-1",
        workspaceId: "ws-1",
        isPrivate: false,
        members: [{ role: "OWNER" }],
      });
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });
      (prisma.projectMember.findFirst as any).mockResolvedValue({
        id: "pm-2",
        projectId: "proj-1",
        userId: "user-2",
      });
      (prisma.projectMember.delete as any).mockResolvedValue({ id: "pm-2" });

      const req = new Request("http://localhost/api/v1/projects/proj-1/members?memberId=pm-2", {
        method: "DELETE",
        headers: authHeader,
      });

      const res = await removeMemberRoute(req, { params: Promise.resolve({ projectId: "proj-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toContain("removed successfully");
    });
  });
});
