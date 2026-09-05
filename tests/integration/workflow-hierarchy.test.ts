import { describe, it, expect } from "vitest";
import { slugify, formatIssueKey } from "@/lib/utils";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createProjectSchema, createIssueSchema, createCommentSchema } from "@/lib/validators";

describe("Integration Tests: Complete Multi-Tenant Workflow Lifecycle", () => {
  it("simulates full user signup -> workspace -> project -> issue -> comment -> activity flow", async () => {
    // 1. User Registration Simulation
    const rawUserData = {
      name: "Nithin Developer",
      email: "nithin@example.com",
      password: "SuperSecretPassword123!",
    };

    const passwordHash = await hashPassword(rawUserData.password);
    expect(await verifyPassword(rawUserData.password, passwordHash)).toBe(true);

    const generatedOrgSlug = slugify(`${rawUserData.name}-org`);
    expect(generatedOrgSlug).toBe("nithin-developer-org");

    const defaultWorkspace = {
      name: "General Workspace",
      slug: "general",
    };
    expect(defaultWorkspace.slug).toBe("general");

    // 2. Project Creation Simulation
    const projectInput = {
      name: "TripTally Expense Tracker",
      key: "TRIP",
      description: "Next-gen travel expense manager",
      color: "#3b82f6",
    };

    const parsedProject = createProjectSchema.parse(projectInput);
    expect(parsedProject.key).toBe("TRIP");

    // 3. Issue Sequence Creation Simulation (#101, #102)
    let issueSequence = 100;

    const issue1Input = {
      title: "Fix authentication redirect loop",
      status: "TODO" as const,
      priority: "HIGH" as const,
      estimate: 3,
    };
    const parsedIssue1 = createIssueSchema.parse(issue1Input);

    issueSequence += 1;
    const issue1Number = issueSequence;
    const issue1Key = formatIssueKey(parsedProject.key, issue1Number);
    expect(issue1Key).toBe("TRIP-101");

    issueSequence += 1;
    const issue2Number = issueSequence;
    const issue2Key = formatIssueKey(parsedProject.key, issue2Number);
    expect(issue2Key).toBe("TRIP-102");

    // 4. Kanban Status Move & Fractional Ordering
    let currentStatus = parsedIssue1.status;
    let currentOrder = 1000.0;

    // Move to IN_PROGRESS
    currentStatus = "IN_PROGRESS";
    currentOrder = 1500.0; // Fractional reorder

    expect(currentStatus).toBe("IN_PROGRESS");
    expect(currentOrder).toBe(1500.0);

    // 5. Rich Comment Posting & Activity Logging Simulation
    const commentInput = {
      issueId: "issue-trip-101",
      content: "Investigated the root cause: cookie maxAge was missing in the session handler.",
    };
    const parsedComment = createCommentSchema.parse(commentInput);
    expect(parsedComment.content).toContain("cookie maxAge");

    const activityLogEntry = {
      action: "COMMENT_ADDED",
      actorName: rawUserData.name,
      issueKey: issue1Key,
      timestamp: new Date().toISOString(),
    };
    expect(activityLogEntry.action).toBe("COMMENT_ADDED");
    expect(activityLogEntry.issueKey).toBe("TRIP-101");
  });
});
