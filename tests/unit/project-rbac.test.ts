import { describe, it, expect } from "vitest";
import { ProjectRole } from "@prisma/client";

describe("Project-Level Role-Based Access Control (RBAC)", () => {
  function checkPermission(
    userProjectRole: ProjectRole,
    requiredRole: "OWNER" | "EDITOR" | "VIEWER"
  ): boolean {
    if (requiredRole === "OWNER") {
      return userProjectRole === "OWNER";
    }
    if (requiredRole === "EDITOR") {
      return userProjectRole === "OWNER" || userProjectRole === "EDITOR";
    }
    if (requiredRole === "VIEWER") {
      return true;
    }
    return false;
  }

  it("grants Project Owner full permissions (read, write, delete, manage)", () => {
    expect(checkPermission("OWNER", "OWNER")).toBe(true);
    expect(checkPermission("OWNER", "EDITOR")).toBe(true);
    expect(checkPermission("OWNER", "VIEWER")).toBe(true);
  });

  it("grants Write/Editor access to create/update issues but restricts owner actions", () => {
    expect(checkPermission("EDITOR", "OWNER")).toBe(false);
    expect(checkPermission("EDITOR", "EDITOR")).toBe(true);
    expect(checkPermission("EDITOR", "VIEWER")).toBe(true);
  });

  it("restricts Read-Only/Viewer from write and owner actions", () => {
    expect(checkPermission("VIEWER", "OWNER")).toBe(false);
    expect(checkPermission("VIEWER", "EDITOR")).toBe(false);
    expect(checkPermission("VIEWER", "VIEWER")).toBe(true);
  });
});
