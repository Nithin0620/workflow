import { describe, it, expect } from "vitest";
import { ISSUE_STATUSES, ISSUE_PRIORITIES, USER_ROLES, APP_NAME } from "@/lib/constants";

describe("Unit Tests: Constants & Enumerations", () => {
  it("exports correct APP_NAME", () => {
    expect(APP_NAME).toBe("Workflow");
  });

  it("contains all 6 core Kanban statuses", () => {
    const statusIds = ISSUE_STATUSES.map((s) => s.id);
    expect(statusIds).toEqual([
      "BACKLOG",
      "TODO",
      "IN_PROGRESS",
      "IN_REVIEW",
      "DONE",
      "CANCELED",
    ]);
  });

  it("contains all 5 priority levels", () => {
    const priorityIds = ISSUE_PRIORITIES.map((p) => p.id);
    expect(priorityIds).toEqual([
      "NO_PRIORITY",
      "LOW",
      "MEDIUM",
      "HIGH",
      "URGENT",
    ]);
  });

  it("contains all 4 RBAC roles with descriptions", () => {
    const roleIds = USER_ROLES.map((r) => r.id);
    expect(roleIds).toEqual(["OWNER", "ADMIN", "MEMBER", "VIEWER"]);
    USER_ROLES.forEach((r) => {
      expect(r.description).toBeTruthy();
    });
  });
});
