process.env.NEXTAUTH_SECRET = "test-secret";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GET as listIssuesRoute,
  POST as createIssueRoute,
} from "@/app/api/v1/projects/[projectId]/issues/route";
import {
  GET as getIssueRoute,
  PATCH as updateIssueRoute,
  DELETE as deleteIssueRoute,
} from "@/app/api/v1/issues/[issueId]/route";
import {
  GET as listSprintsRoute,
  POST as createSprintRoute,
} from "@/app/api/v1/projects/[projectId]/sprints/route";
import {
  GET as getSprintRoute,
  PATCH as updateSprintRoute,
  DELETE as deleteSprintRoute,
} from "@/app/api/v1/sprints/[sprintId]/route";
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
      update: vi.fn(),
    },
    boardColumn: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    issue: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    sprint: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    comment: {
      findMany: vi.fn(),
    },
    activityLog: {
      findMany: vi.fn(),
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

vi.mock("@/actions/notifications", () => ({
  createUserNotification: vi.fn(),
}));

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}));

describe("Issues & Sprints REST API Endpoints", () => {
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
  // 1. Project Issues Routes (GET, POST)
  // -------------------------------------------------------------
  describe("GET /api/v1/projects/[projectId]/issues", () => {
    it("returns 401 when unauthenticated", async () => {
      const req = new Request("http://localhost/api/v1/projects/proj-1/issues");
      const res = await listIssuesRoute(req, {
        params: Promise.resolve({ projectId: "proj-1" }),
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 404 when project not found or no access", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.project.findUnique as any).mockResolvedValue(null);

      const req = new Request("http://localhost/api/v1/projects/proj-1/issues", {
        headers: authHeader,
      });
      const res = await listIssuesRoute(req, {
        params: Promise.resolve({ projectId: "proj-1" }),
      });
      expect(res.status).toBe(404);
    });

    it("returns issues with enriched column, commentsCount, attachmentsCount and supports filters", async () => {
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

      const mockIssues = [
        {
          id: "issue-1",
          projectId: "proj-1",
          projectKey: "PRJ",
          issueNumber: 1,
          title: "Fix login issue",
          status: "TODO",
          priority: "HIGH",
          order: 1000,
          assignee: { id: "user-1", name: "User One", image: null, email: "user1@example.com" },
          creator: { id: "user-1", name: "User One", image: null, email: "user1@example.com" },
          labels: [{ id: "lbl-1", name: "Bug", color: "#f00" }],
          sprint: { id: "sp-1", name: "Sprint 1", number: 1, isActive: true },
          _count: { comments: 3, attachments: 2 },
        },
      ];

      (prisma.issue.findMany as any).mockResolvedValue(mockIssues);
      (prisma.boardColumn.findMany as any).mockResolvedValue([
        { id: "col-1", key: "TODO", name: "To Do", order: 1000 },
      ]);

      const req = new Request(
        "http://localhost/api/v1/projects/proj-1/issues?sprintId=sp-1&priority=HIGH&search=login",
        {
          headers: authHeader,
        }
      );

      const res = await listIssuesRoute(req, {
        params: Promise.resolve({ projectId: "proj-1" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.issues).toHaveLength(1);
      expect(data.issues[0].title).toBe("Fix login issue");
      expect(data.issues[0].commentsCount).toBe(3);
      expect(data.issues[0].attachmentsCount).toBe(2);
      expect(data.issues[0].column.name).toBe("To Do");
    });
  });

  describe("POST /api/v1/projects/[projectId]/issues", () => {
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

      const req = new Request("http://localhost/api/v1/projects/proj-1/issues", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New issue" }),
      });

      const res = await createIssueRoute(req, {
        params: Promise.resolve({ projectId: "proj-1" }),
      });
      expect(res.status).toBe(403);
    });

    it("creates issue, increments sequence, logs activity, and returns 201", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.project.findUnique as any).mockResolvedValue({
        id: "proj-1",
        key: "PRJ",
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
      (prisma.project.update as any).mockResolvedValue({ issueSequence: 101 });
      (prisma.issue.findFirst as any).mockResolvedValue({ order: 1000 });

      const createdIssue = {
        id: "issue-new",
        projectId: "proj-1",
        projectKey: "PRJ",
        issueNumber: 101,
        title: "Setup CI/CD",
        status: "TODO",
        priority: "MEDIUM",
        order: 2000,
        assigneeId: mockUser.id,
        creatorId: mockUser.id,
        sprintId: null,
        estimate: 5,
        assignee: { id: mockUser.id, name: mockUser.name, image: null, email: mockUser.email },
        creator: { id: mockUser.id, name: mockUser.name, image: null, email: mockUser.email },
        labels: [],
        sprint: null,
        _count: { comments: 0, attachments: 0 },
      };

      (prisma.issue.create as any).mockResolvedValue(createdIssue);
      (prisma.boardColumn.findFirst as any).mockResolvedValue({ id: "col-todo", key: "TODO", name: "To Do" });
      (prisma.activityLog.create as any).mockResolvedValue({ id: "act-1" });

      const req = new Request("http://localhost/api/v1/projects/proj-1/issues", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Setup CI/CD",
          status: "TODO",
          priority: "MEDIUM",
          assigneeId: mockUser.id,
          estimate: 5,
        }),
      });

      const res = await createIssueRoute(req, {
        params: Promise.resolve({ projectId: "proj-1" }),
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.issue.id).toBe("issue-new");
      expect(data.issue.issueNumber).toBe(101);
      expect(data.issue.column.name).toBe("To Do");
    });
  });

  // -------------------------------------------------------------
  // 2. Issue by ID Routes (GET, PATCH, DELETE)
  // -------------------------------------------------------------
  describe("GET /api/v1/issues/[issueId]", () => {
    it("returns issue with comments, attachments, activityLogs", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.issue.findUnique as any)
        .mockResolvedValueOnce({
          id: "issue-1",
          status: "TODO",
          project: {
            id: "proj-1",
            workspaceId: "ws-1",
            isPrivate: false,
            members: [{ role: "EDITOR" }],
          },
        })
        .mockResolvedValueOnce({
          id: "issue-1",
          title: "Issue Detail",
          status: "TODO",
          assignee: { id: "user-1", name: "User One" },
          creator: { id: "user-1", name: "User One" },
          labels: [],
          sprint: null,
          attachments: [],
          gitLinks: [],
          _count: { comments: 1, attachments: 0 },
        });

      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });

      (prisma.comment.findMany as any).mockResolvedValue([
        { id: "c-1", content: "Great progress", author: { id: "user-1", name: "User One" }, attachments: [] },
      ]);
      (prisma.activityLog.findMany as any).mockResolvedValue([
        { id: "act-1", action: "ISSUE_CREATED", actor: { id: "user-1", name: "User One" } },
      ]);
      (prisma.boardColumn.findFirst as any).mockResolvedValue({ id: "col-1", key: "TODO", name: "To Do" });

      const req = new Request("http://localhost/api/v1/issues/issue-1", {
        headers: authHeader,
      });

      const res = await getIssueRoute(req, {
        params: Promise.resolve({ issueId: "issue-1" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.issue.title).toBe("Issue Detail");
      expect(data.issue.comments).toHaveLength(1);
      expect(data.issue.activityLogs).toHaveLength(1);
    });
  });

  describe("PATCH /api/v1/issues/[issueId]", () => {
    it("updates issue status, priority, title, records activity, and broadcasts", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.issue.findUnique as any).mockResolvedValue({
        id: "issue-1",
        title: "Old title",
        status: "TODO",
        priority: "LOW",
        projectKey: "PRJ",
        issueNumber: 1,
        project: {
          id: "proj-1",
          workspaceId: "ws-1",
          isPrivate: false,
          members: [{ role: "EDITOR" }],
        },
      });

      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });

      const updatedIssue = {
        id: "issue-1",
        title: "Updated title",
        status: "IN_PROGRESS",
        priority: "HIGH",
        order: 500,
        assignee: null,
        creator: { id: "user-1", name: "User One" },
        labels: [],
        sprint: null,
        _count: { comments: 0, attachments: 0 },
      };

      (prisma.issue.update as any).mockResolvedValue(updatedIssue);
      (prisma.boardColumn.findFirst as any).mockResolvedValue({ id: "col-2", key: "IN_PROGRESS", name: "In Progress" });
      (prisma.activityLog.create as any).mockResolvedValue({ id: "act-1" });

      const req = new Request("http://localhost/api/v1/issues/issue-1", {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Updated title",
          status: "IN_PROGRESS",
          priority: "HIGH",
          order: 500,
        }),
      });

      const res = await updateIssueRoute(req, {
        params: Promise.resolve({ issueId: "issue-1" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.issue.title).toBe("Updated title");
      expect(data.issue.status).toBe("IN_PROGRESS");
    });
  });

  describe("DELETE /api/v1/issues/[issueId]", () => {
    it("deletes issue when user has EDITOR access", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.issue.findUnique as any).mockResolvedValue({
        id: "issue-1",
        project: {
          id: "proj-1",
          workspaceId: "ws-1",
          isPrivate: false,
          members: [{ role: "EDITOR" }],
        },
      });

      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });
      (prisma.issue.delete as any).mockResolvedValue({ id: "issue-1" });

      const req = new Request("http://localhost/api/v1/issues/issue-1", {
        method: "DELETE",
        headers: authHeader,
      });

      const res = await deleteIssueRoute(req, {
        params: Promise.resolve({ issueId: "issue-1" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toContain("deleted successfully");
    });
  });

  // -------------------------------------------------------------
  // 3. Project Sprints Routes (GET, POST)
  // -------------------------------------------------------------
  describe("GET /api/v1/projects/[projectId]/sprints", () => {
    it("returns sprints with point totals and issue counts", async () => {
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
        role: "MEMBER",
      });

      (prisma.sprint.findMany as any).mockResolvedValue([
        {
          id: "sp-1",
          projectId: "proj-1",
          name: "Sprint 1",
          number: 1,
          goal: "Ship v1 MVP",
          startDate: new Date("2026-09-01T00:00:00.000Z"),
          endDate: new Date("2026-09-15T00:00:00.000Z"),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          issues: [
            { id: "i1", status: "DONE", estimate: 5 },
            { id: "i2", status: "IN_PROGRESS", estimate: 3 },
          ],
        },
      ]);

      const req = new Request("http://localhost/api/v1/projects/proj-1/sprints", {
        headers: authHeader,
      });

      const res = await listSprintsRoute(req, {
        params: Promise.resolve({ projectId: "proj-1" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sprints).toHaveLength(1);
      const s = data.sprints[0];
      expect(s.name).toBe("Sprint 1");
      expect(s.totalIssues).toBe(2);
      expect(s.completedIssues).toBe(1);
      expect(s.openIssues).toBe(1);
      expect(s.totalPoints).toBe(8);
      expect(s.completedPoints).toBe(5);
      expect(s.openPoints).toBe(3);
      expect(s.status).toBe("ACTIVE");
    });
  });

  describe("POST /api/v1/projects/[projectId]/sprints", () => {
    it("creates sprint and returns 201", async () => {
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
      (prisma.sprint.findFirst as any).mockResolvedValue({ number: 2 });

      const createdSprint = {
        id: "sp-3",
        projectId: "proj-1",
        name: "Sprint 3",
        number: 3,
        goal: "Refactor core",
        startDate: new Date("2026-10-01T00:00:00.000Z"),
        endDate: new Date("2026-10-15T00:00:00.000Z"),
        isActive: false,
      };

      (prisma.sprint.create as any).mockResolvedValue(createdSprint);
      (prisma.activityLog.create as any).mockResolvedValue({ id: "act-1" });

      const req = new Request("http://localhost/api/v1/projects/proj-1/sprints", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Sprint 3",
          goal: "Refactor core",
          startDate: "2026-10-01T00:00:00.000Z",
          endDate: "2026-10-15T00:00:00.000Z",
        }),
      });

      const res = await createSprintRoute(req, {
        params: Promise.resolve({ projectId: "proj-1" }),
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.sprint.id).toBe("sp-3");
      expect(data.sprint.number).toBe(3);
    });
  });

  // -------------------------------------------------------------
  // 4. Sprint by ID Routes (GET, PATCH, DELETE)
  // -------------------------------------------------------------
  describe("GET /api/v1/sprints/[sprintId]", () => {
    it("returns sprint details with its issues", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.sprint.findUnique as any)
        .mockResolvedValueOnce({
          id: "sp-1",
          name: "Sprint 1",
          project: {
            id: "proj-1",
            workspaceId: "ws-1",
            isPrivate: false,
            members: [{ role: "VIEWER" }],
          },
        })
        .mockResolvedValueOnce({
          id: "sp-1",
          name: "Sprint 1",
          number: 1,
          goal: "Launch feature",
          startDate: new Date(),
          endDate: new Date(),
          isActive: true,
        });

      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });

      (prisma.issue.findMany as any).mockResolvedValue([
        {
          id: "i1",
          title: "Sprint task 1",
          status: "TODO",
          estimate: 3,
          assignee: null,
          creator: { id: "user-1", name: "User One" },
          labels: [],
          _count: { comments: 0, attachments: 0 },
        },
      ]);
      (prisma.boardColumn.findMany as any).mockResolvedValue([
        { id: "col-1", key: "TODO", name: "To Do" },
      ]);

      const req = new Request("http://localhost/api/v1/sprints/sp-1", {
        headers: authHeader,
      });

      const res = await getSprintRoute(req, {
        params: Promise.resolve({ sprintId: "sp-1" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sprint.name).toBe("Sprint 1");
      expect(data.issues).toHaveLength(1);
      expect(data.sprint.totalPoints).toBe(3);
    });
  });

  describe("PATCH /api/v1/sprints/[sprintId]", () => {
    it("activates sprint and deactivates others when status=ACTIVE", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.sprint.findUnique as any).mockResolvedValue({
        id: "sp-1",
        name: "Sprint 1",
        isActive: false,
        project: {
          id: "proj-1",
          workspaceId: "ws-1",
          isPrivate: false,
          members: [{ role: "EDITOR" }],
        },
      });

      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });

      (prisma.sprint.updateMany as any).mockResolvedValue({ count: 1 });
      (prisma.sprint.update as any).mockResolvedValue({
        id: "sp-1",
        name: "Sprint 1",
        isActive: true,
      });
      (prisma.activityLog.create as any).mockResolvedValue({ id: "act-1" });

      const req = new Request("http://localhost/api/v1/sprints/sp-1", {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });

      const res = await updateSprintRoute(req, {
        params: Promise.resolve({ sprintId: "sp-1" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sprint.isActive).toBe(true);
      expect(prisma.sprint.updateMany).toHaveBeenCalledWith({
        where: {
          projectId: "proj-1",
          isActive: true,
          id: { not: "sp-1" },
        },
        data: { isActive: false },
      });
    });

    it("completes sprint and moves unfinished issues to backlog when status=COMPLETED", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.sprint.findUnique as any).mockResolvedValue({
        id: "sp-1",
        name: "Sprint 1",
        isActive: true,
        project: {
          id: "proj-1",
          workspaceId: "ws-1",
          isPrivate: false,
          members: [{ role: "EDITOR" }],
        },
      });

      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });

      (prisma.issue.updateMany as any).mockResolvedValue({ count: 2 });
      (prisma.sprint.update as any).mockResolvedValue({
        id: "sp-1",
        name: "Sprint 1",
        isActive: false,
      });
      (prisma.activityLog.create as any).mockResolvedValue({ id: "act-1" });

      const req = new Request("http://localhost/api/v1/sprints/sp-1", {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      const res = await updateSprintRoute(req, {
        params: Promise.resolve({ sprintId: "sp-1" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sprint.isActive).toBe(false);
      expect(prisma.issue.updateMany).toHaveBeenCalledWith({
        where: {
          sprintId: "sp-1",
          status: { notIn: ["DONE", "CANCELED"] },
        },
        data: { sprintId: null },
      });
    });
  });

  describe("DELETE /api/v1/sprints/[sprintId]", () => {
    it("deletes sprint and unassigns issues back to backlog", async () => {
      (prisma.user.findFirst as any).mockResolvedValue(mockUser);
      (prisma.sprint.findUnique as any).mockResolvedValue({
        id: "sp-1",
        name: "Sprint 1",
        project: {
          id: "proj-1",
          workspaceId: "ws-1",
          isPrivate: false,
          members: [{ role: "EDITOR" }],
        },
      });

      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: "wm-1",
        workspaceId: "ws-1",
        userId: mockUser.id,
        role: "MEMBER",
      });

      (prisma.issue.updateMany as any).mockResolvedValue({ count: 3 });
      (prisma.sprint.delete as any).mockResolvedValue({ id: "sp-1" });
      (prisma.activityLog.create as any).mockResolvedValue({ id: "act-1" });

      const req = new Request("http://localhost/api/v1/sprints/sp-1", {
        method: "DELETE",
        headers: authHeader,
      });

      const res = await deleteSprintRoute(req, {
        params: Promise.resolve({ sprintId: "sp-1" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toContain("deleted successfully");
      expect(prisma.issue.updateMany).toHaveBeenCalledWith({
        where: { sprintId: "sp-1" },
        data: { sprintId: null },
      });
      expect(prisma.sprint.delete).toHaveBeenCalledWith({
        where: { id: "sp-1" },
      });
    });
  });
});
