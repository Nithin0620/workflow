import { describe, it, expect } from "vitest";
import { extractIssueKeys, generateSuggestedBranchName } from "@/lib/github/client";

describe("GitHub Integration & Issue Key Matcher", () => {
  it("extracts issue keys from branch names correctly", () => {
    const keys = extractIssueKeys("feat/PROJ-12-oauth-fix");
    expect(keys).toEqual([
      { projectKey: "PROJ", issueNumber: 12, fullKey: "PROJ-12" },
    ]);
  });

  it("extracts issue keys from commit messages with brackets and tags", () => {
    const keys = extractIssueKeys("fix(auth): fix token renewal [PROJ-42] closes WORK-101");
    expect(keys).toEqual([
      { projectKey: "PROJ", issueNumber: 42, fullKey: "PROJ-42" },
      { projectKey: "WORK", issueNumber: 101, fullKey: "WORK-101" },
    ]);
  });

  it("filters by specific projectKey when provided", () => {
    const keys = extractIssueKeys("feat: work on PROJ-10 and OTHER-99", "PROJ");
    expect(keys).toEqual([
      { projectKey: "PROJ", issueNumber: 10, fullKey: "PROJ-10" },
    ]);
  });

  it("deduplicates multiple mentions of the same key in PR body", () => {
    const body = "Fixes PROJ-5. Related to PROJ-5 and branch feat/PROJ-5.";
    const keys = extractIssueKeys(body);
    expect(keys).toHaveLength(1);
    expect(keys[0].fullKey).toBe("PROJ-5");
  });

  it("generates sanitized git branch names accurately", () => {
    const branch = generateSuggestedBranchName(
      "PROJ",
      12,
      "Fix User Session & Token Verification!!"
    );
    expect(branch).toBe("feat/PROJ-12-fix-user-session-token-verification");
  });
});
