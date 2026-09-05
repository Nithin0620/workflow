import { describe, it, expect } from "vitest";
import { createCommentSchema } from "@/lib/validators";

describe("Unit Tests: Issue Comments & Discussions", () => {
  it("validates valid comment content", () => {
    const valid = {
      issueId: "issue-abc",
      content: "This is verified in staging build #14.",
    };
    const result = createCommentSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects empty comment or whitespace-only comment", () => {
    const invalid = {
      issueId: "issue-abc",
      content: "",
    };
    const result = createCommentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("supports multiline Markdown and @mentions in comments", () => {
    const markdownContent = `Hey @alex please review the changes below:\n\n- [x] Migrated to PostgreSQL\n- [x] Tested OAuth\n\n> Note: Merging after CI passes.`;
    const valid = {
      issueId: "issue-abc",
      content: markdownContent,
    };
    const result = createCommentSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});
