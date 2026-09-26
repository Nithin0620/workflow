import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProjectCodebaseGraph } from "@/actions/code-graph";
import { prisma } from "@/lib/db/prisma";
import * as sessionModule from "@/lib/auth/session";
import * as githubClient from "@/lib/github/client";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    projectRepository: {
      findUnique: vi.fn(),
    },
    issue: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/session", () => ({
  requireProjectAccess: vi.fn(),
}));

vi.mock("@/lib/github/client", () => ({
  fetchRepositoryTree: vi.fn(),
  fetchRepositoryFileContent: vi.fn(),
}));

describe("Unit Tests: Code Graph Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error if project access is denied", async () => {
    vi.mocked(sessionModule.requireProjectAccess).mockRejectedValueOnce(
      new Error("Forbidden: Access denied to project.")
    );

    const result = await getProjectCodebaseGraph("proj_123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Forbidden");
  });

  it("returns null repository if no repository connected", async () => {
    vi.mocked(sessionModule.requireProjectAccess).mockResolvedValueOnce({
      userId: "u1",
      workspaceId: "w1",
      role: "MEMBER",
      projectRole: "EDITOR",
    } as any);

    vi.mocked(prisma.projectRepository.findUnique).mockResolvedValueOnce(null);

    const result = await getProjectCodebaseGraph("proj_123");
    expect(result.success).toBe(true);
    expect(result.repository).toBeNull();
    expect(result.error).toContain("No GitHub repository connected");
  });

  it("successfully fetches tree and builds graph", async () => {
    vi.mocked(sessionModule.requireProjectAccess).mockResolvedValueOnce({
      userId: "u1",
      workspaceId: "w1",
      role: "MEMBER",
      projectRole: "EDITOR",
    } as any);

    vi.mocked(prisma.projectRepository.findUnique).mockResolvedValueOnce({
      id: "repo_1",
      projectId: "proj_123",
      repoOwner: "testowner",
      repoName: "testrepo",
      repoUrl: "https://github.com/testowner/testrepo",
      defaultBranch: "main",
      accessToken: "ghp_mocktoken",
    } as any);

    vi.mocked(githubClient.fetchRepositoryTree).mockResolvedValueOnce({
      success: true,
      tree: [
        { path: "src", mode: "040000", type: "tree", sha: "1" },
        { path: "src/index.ts", mode: "100644", type: "blob", size: 100, sha: "2" },
      ],
    });

    vi.mocked(githubClient.fetchRepositoryFileContent).mockResolvedValueOnce({
      success: true,
      content: 'import "./helper";',
    });

    vi.mocked(prisma.issue.findMany).mockResolvedValueOnce([
      {
        id: "issue_1",
        key: "TEST-1",
        title: "Fix bug in index",
        status: "IN_PROGRESS",
        priority: "HIGH",
      } as any,
    ]);

    const result = await getProjectCodebaseGraph("proj_123");
    expect(result.success).toBe(true);
    expect(result.graph).toBeDefined();
    expect(result.graph?.nodes.length).toBe(2);
    expect(result.repository?.name).toBe("testrepo");
  });
});
