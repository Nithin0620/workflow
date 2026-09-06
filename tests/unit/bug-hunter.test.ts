import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runProjectBugHunt } from "@/lib/ai/bug-hunter";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    projectRepository: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    boardColumn: {
      findFirst: vi.fn(),
    },
    issue: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    comment: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/github/client", () => ({
  fetchRepositoryTree: vi.fn().mockResolvedValue({
    success: true,
    tree: [
      { path: "src/index.ts", type: "blob" },
      { path: "src/utils.ts", type: "blob" },
    ],
  }),
  fetchRepositoryFileContent: vi.fn().mockResolvedValue({
    success: true,
    content: "export function divide(a: number, b: number) { return a / b; }",
  }),
}));

vi.mock("@/lib/realtime/events", () => ({
  broadcastProjectEvent: vi.fn(),
}));

describe("Unit Tests: Phase 3 Bug Hunter Engine", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns error when project or active repository is not configured", async () => {
    (prisma.project.findUnique as any).mockResolvedValue(null);

    const result = await runProjectBugHunt("proj-1", "MANUAL");
    expect(result.success).toBe(false);
    expect(result.summary).toContain("Project not found");
  });

  it("returns error when repository is not active or AI scanning is disabled", async () => {
    (prisma.project.findUnique as any).mockResolvedValue({
      id: "proj-1",
      key: "PROJ",
      name: "Project One",
      repository: {
        id: "repo-1",
        status: "DISCONNECTED",
        aiScanEnabled: false,
      },
    });

    const result = await runProjectBugHunt("proj-1", "MANUAL");
    expect(result.success).toBe(false);
    expect(result.summary).toContain("No active repository with AI scan enabled");
  });

  it("executes bug scan, calls Groq AI, and creates issues with sequential keys on the board", async () => {
    (prisma.project.findUnique as any).mockResolvedValue({
      id: "proj-1",
      key: "PROJ",
      name: "Project One",
      issueSequence: 10,
      columns: [{ id: "col-todo-1", key: "TODO", name: "To Do", order: 0 }],
      workspace: { id: "ws-1", organization: { ownerId: "user-owner-1" } },
      lead: { id: "user-lead-1" },
      leadId: "user-lead-1",
      repository: {
        id: "repo-1",
        status: "ACTIVE",
        aiScanEnabled: true,
        repoOwner: "test-org",
        repoName: "test-repo",
        defaultBranch: "main",
        accessToken: "ghp_mocktoken",
      },
    });

    (prisma.issue.findFirst as any).mockResolvedValue(null);
    (prisma.issue.findMany as any).mockResolvedValue([]);

    (prisma.project.update as any).mockResolvedValue({
      id: "proj-1",
      issueSequence: 11,
    });

    (prisma.issue.create as any).mockResolvedValue({
      id: "issue-new-1",
      key: "PROJ-11",
      title: "[AI Bug Report] Unhandled zero division in divide",
      projectId: "proj-1",
    });

    (prisma.comment.create as any).mockResolvedValue({
      id: "comment-1",
    });

    (prisma.projectRepository.update as any).mockResolvedValue({
      id: "repo-1",
      lastScannedAt: new Date(),
    });

    const mockGroqResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify([
              {
                title: "Unhandled zero division in divide",
                severity: "HIGH",
                filePath: "src/index.ts",
                rootCause: "Division function does not check if b is 0.",
                proposedPatch: "if (b === 0) throw new Error('Cannot divide by zero');",
                reproduction: "Call divide(10, 0)",
              },
            ]),
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockGroqResponse,
    }) as any;

    const result = await runProjectBugHunt("proj-1", "MANUAL", "gsk_test_api_key");

    expect(result.success).toBe(true);
    expect(result.issuesCreated).toBe(1);
    expect(result.findings.length).toBe(1);
    expect(result.findings[0].filePath).toBe("src/index.ts");
    expect(prisma.issue.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: "proj-1",
          projectKey: "PROJ",
          priority: "HIGH",
        }),
      })
    );
    expect(prisma.comment.create).toHaveBeenCalledTimes(1);
  });
});
