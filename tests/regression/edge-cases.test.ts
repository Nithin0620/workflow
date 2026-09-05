import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  createIssueSchema,
  createWorkspaceSchema,
} from "@/lib/validators";
import { slugify } from "@/lib/utils";

describe("Regression Tests: Edge Cases & Boundary Constraints", () => {
  describe("Slugification Regression", () => {
    it("handles multiple sequential spaces and hyphens properly", () => {
      expect(slugify("Project --- Name --- 123")).toBe("project-name-123");
      expect(slugify("   ___Special&&&Characters###   ")).toBe("special-characters");
    });

    it("handles non-english characters safely", () => {
      expect(slugify("Café & Restaurant")).toBe("caf-restaurant");
    });
  });

  describe("Workspace Constraints", () => {
    it("rejects workspace slugs containing capital letters", () => {
      const result = createWorkspaceSchema.safeParse({
        name: "Acme Workspace",
        slug: "Acme-Workspace",
      });
      expect(result.success).toBe(false);
    });

    it("rejects workspace descriptions exceeding 200 chars", () => {
      const longDesc = "a".repeat(201);
      const result = createWorkspaceSchema.safeParse({
        name: "Acme Workspace",
        slug: "acme-workspace",
        description: longDesc,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Issue Constraints", () => {
    it("rejects negative story points estimate", () => {
      const result = createIssueSchema.safeParse({
        title: "Negative Estimate Bug",
        estimate: -5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects story points estimate above 100", () => {
      const result = createIssueSchema.safeParse({
        title: "Over Estimate Bug",
        estimate: 105,
      });
      expect(result.success).toBe(false);
    });

    it("allows markdown and multiline text in issue description", () => {
      const markdownDesc = `### Acceptance Criteria\n- [x] Tested on Chrome\n- [ ] Code review\n\`\`\`ts\nconst x = 1;\n\`\`\``;
      const result = createIssueSchema.safeParse({
        title: "Markdown Description Issue",
        description: markdownDesc,
      });
      expect(result.success).toBe(true);
    });
  });
});
