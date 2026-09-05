import { describe, it, expect } from "vitest";
import {
  createWorkspaceSchema,
  createProjectSchema,
  createIssueSchema,
  updateIssueSchema,
  createCommentSchema,
  inviteMemberSchema,
} from "@/lib/validators";

describe("Unit Tests: Zod Validation Schemas", () => {
  describe("createWorkspaceSchema", () => {
    it("validates valid workspace payload", () => {
      const valid = {
        name: "Engineering",
        slug: "engineering",
        description: "Core engineering team",
      };
      const result = createWorkspaceSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects invalid slugs with uppercase or special characters", () => {
      const invalid = {
        name: "Engineering",
        slug: "Eng_Team!",
      };
      const result = createWorkspaceSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects names that are too short", () => {
      const invalid = { name: "E", slug: "engineering" };
      const result = createWorkspaceSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("createProjectSchema", () => {
    it("validates valid project payload", () => {
      const valid = {
        name: "TripTally",
        key: "TRIP",
        description: "Expense tracker application",
        color: "#3b82f6",
      };
      const result = createProjectSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects project keys that are lowercase or contain special chars", () => {
      const invalid = {
        name: "TripTally",
        key: "trip-1",
      };
      const result = createProjectSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("createIssueSchema", () => {
    it("validates valid issue creation payload with defaults", () => {
      const valid = {
        title: "Implement Razorpay Gateway",
        description: "Add checkout webhook support",
        status: "IN_PROGRESS",
        priority: "HIGH",
        estimate: 5,
      };
      const result = createIssueSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects issue with empty title", () => {
      const invalid = {
        title: "",
      };
      const result = createIssueSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects invalid status or priority enum values", () => {
      const invalid = {
        title: "Test issue",
        status: "INVALID_STATUS",
        priority: "SUPER_URGENT",
      };
      const result = createIssueSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("createCommentSchema", () => {
    it("validates non-empty comment", () => {
      const valid = {
        issueId: "issue-123",
        content: "Fixed in PR #42",
      };
      const result = createCommentSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects empty comment content", () => {
      const invalid = {
        issueId: "issue-123",
        content: "",
      };
      const result = createCommentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("inviteMemberSchema", () => {
    it("validates email and role", () => {
      const valid = {
        email: "alex@company.com",
        role: "ADMIN",
      };
      const result = inviteMemberSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects invalid email addresses", () => {
      const invalid = {
        email: "not-an-email",
        role: "MEMBER",
      };
      const result = inviteMemberSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
