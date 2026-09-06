import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseGithubRepoUrl,
  validateGithubConnection,
  fetchRepositoryBranches,
  fetchRepositoryTree,
  fetchRepositoryFileContent,
} from "@/lib/github/client";
import { connectRepositorySchema, updateRepositorySchema } from "@/lib/validators";

describe("Unit Tests: GitHub Repository Integration & Validation", () => {
  describe("parseGithubRepoUrl", () => {
    it("correctly parses standard GitHub HTTPS URLs", () => {
      const result = parseGithubRepoUrl("https://github.com/facebook/react");
      expect(result).toEqual({ owner: "facebook", name: "react" });
    });

    it("handles trailing slashes and .git extensions", () => {
      const result1 = parseGithubRepoUrl("https://github.com/vercel/next.js.git");
      expect(result1).toEqual({ owner: "vercel", name: "next.js" });

      const result2 = parseGithubRepoUrl("https://github.com/torvalds/linux/");
      expect(result2).toEqual({ owner: "torvalds", name: "linux" });
    });

    it("correctly parses owner/repo shorthand", () => {
      const result = parseGithubRepoUrl("tailwindlabs/tailwindcss");
      expect(result).toEqual({ owner: "tailwindlabs", name: "tailwindcss" });
    });

    it("returns null for invalid strings or non-GitHub URLs", () => {
      expect(parseGithubRepoUrl("")).toBeNull();
      expect(parseGithubRepoUrl("invalid-format-without-slash")).toBeNull();
      expect(parseGithubRepoUrl("https://gitlab.com/owner/repo")).toBeNull();
    });
  });

  describe("Validation Schemas", () => {
    it("validates connectRepositorySchema with valid data", () => {
      const parsed = connectRepositorySchema.safeParse({
        projectId: "proj_123",
        repoUrl: "https://github.com/owner/repo",
        defaultBranch: "develop",
        accessToken: "ghp_1234567890abcdef",
        aiScanEnabled: true,
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.cronSchedule).toBe("0 12 * * *");
        expect(parsed.data.defaultBranch).toBe("develop");
      }
    });

    it("applies default values for connectRepositorySchema", () => {
      const parsed = connectRepositorySchema.safeParse({
        projectId: "proj_123",
        repoUrl: "owner/repo",
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.defaultBranch).toBe("main");
        expect(parsed.data.aiScanEnabled).toBe(true);
        expect(parsed.data.cronSchedule).toBe("0 12 * * *");
      }
    });

    it("rejects connectRepositorySchema when projectId is missing", () => {
      const parsed = connectRepositorySchema.safeParse({
        repoUrl: "owner/repo",
      });
      expect(parsed.success).toBe(false);
    });

    it("validates updateRepositorySchema partial updates", () => {
      const parsed = updateRepositorySchema.safeParse({
        projectId: "proj_123",
        aiScanEnabled: false,
        defaultBranch: "release/v1",
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe("GitHub API Client Mock Workflows", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("validates existing public GitHub repository successfully", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 123456,
          name: "workflow",
          full_name: "test-org/workflow",
          owner: { login: "test-org" },
          private: false,
          default_branch: "main",
          description: "Workflow Manager",
          html_url: "https://github.com/test-org/workflow",
        }),
      });

      const res = await validateGithubConnection("test-org", "workflow");
      expect(res.success).toBe(true);
      expect(res.data?.fullName).toBe("test-org/workflow");
      expect(res.data?.defaultBranch).toBe("main");
      expect(res.data?.isPrivate).toBe(false);
    });

    it("handles 404 repository not found", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: "Not Found" }),
      });

      const res = await validateGithubConnection("unknown", "repo");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Repository not found");
    });

    it("fetches repository branches correctly", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          { name: "main" },
          { name: "feature/ai-agent" },
          { name: "staging" },
        ],
      });

      const res = await fetchRepositoryBranches("test-org", "workflow", null, "main");
      expect(res.success).toBe(true);
      expect(res.branches.length).toBe(3);
      expect(res.branches.find((b) => b.name === "main")?.isDefault).toBe(true);
      expect(res.branches.find((b) => b.name === "staging")?.isDefault).toBe(false);
    });

    it("fetches decoded file content from base64 GitHub API response", async () => {
      const testContent = "console.log('Hello Workflow AI');";
      const base64Content = Buffer.from(testContent).toString("base64");

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          content: base64Content,
          encoding: "base64",
        }),
      });

      const res = await fetchRepositoryFileContent("test-org", "workflow", "src/index.ts");
      expect(res.success).toBe(true);
      expect(res.content).toBe(testContent);
    });
  });
});
