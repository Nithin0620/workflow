import { describe, it, expect, vi } from "vitest";
import { linkDiscussionToIssueSchema, createIssueSchema } from "@/lib/validators";

describe("Bi-Directional Discussion <-> Issue Bridge", () => {
  it("validates issue creation schema payload generated from discussion thread", () => {
    const messageContent = "The authentication endpoint is randomly returning 401.";
    const authorName = "Nithin";

    const payload = {
      title: "Authentication 401 bug in API",
      description: `*Created from discussion in #backend by @${authorName}*:\n\n> ${messageContent}`,
      priority: "HIGH" as const,
      status: "TODO" as const,
    };

    const parsed = createIssueSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe("Authentication 401 bug in API");
      expect(parsed.data.priority).toBe("HIGH");
      expect(parsed.data.description).toContain("#backend");
    }
  });

  it("validates linking existing issue to discussion thread", () => {
    const linkPayload = {
      messageId: "msg_cm123abc",
      issueId: "issue_cm456def",
    };

    const parsed = linkDiscussionToIssueSchema.safeParse(linkPayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.messageId).toBe("msg_cm123abc");
      expect(parsed.data.issueId).toBe("issue_cm456def");
    }
  });
});
