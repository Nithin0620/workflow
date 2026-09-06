import { describe, it, expect } from "vitest";
import {
  createDiscussionChannelSchema,
  sendDiscussionMessageSchema,
  toggleDiscussionReactionSchema,
  linkDiscussionToIssueSchema,
} from "@/lib/validators";

describe("Discussions Validation Schemas", () => {
  describe("createDiscussionChannelSchema", () => {
    it("validates valid workspace and project channel names", () => {
      const valid1 = createDiscussionChannelSchema.safeParse({
        name: "backend",
        topic: "API discussion",
        type: "TEXT",
      });
      expect(valid1.success).toBe(true);

      const valid2 = createDiscussionChannelSchema.safeParse({
        name: "frontend-ui",
        projectId: "proj_123",
      });
      expect(valid2.success).toBe(true);
    });

    it("rejects invalid channel names with spaces or uppercase", () => {
      const invalid = createDiscussionChannelSchema.safeParse({
        name: "Invalid Channel Name!",
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("sendDiscussionMessageSchema", () => {
    it("validates valid message content and optional attachments", () => {
      const valid = sendDiscussionMessageSchema.safeParse({
        content: "The authentication endpoint is returning 401.",
        parentId: "msg_123",
        attachments: [
          {
            fileName: "screenshot.png",
            fileSize: 1024,
            fileType: "image/png",
            fileUrl: "https://example.com/screenshot.png",
          },
        ],
      });
      expect(valid.success).toBe(true);
    });

    it("rejects empty messages", () => {
      const invalid = sendDiscussionMessageSchema.safeParse({
        content: "",
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("toggleDiscussionReactionSchema", () => {
    it("validates emoji and messageId", () => {
      const valid = toggleDiscussionReactionSchema.safeParse({
        messageId: "msg_123",
        emoji: "🚀",
      });
      expect(valid.success).toBe(true);
    });
  });

  describe("linkDiscussionToIssueSchema", () => {
    it("validates messageId and issueId pairs", () => {
      const valid = linkDiscussionToIssueSchema.safeParse({
        messageId: "msg_123",
        issueId: "issue_456",
      });
      expect(valid.success).toBe(true);
    });
  });
});
