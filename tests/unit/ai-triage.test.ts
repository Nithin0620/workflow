import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { analyzeIssueWithGroq, IssueContext } from "@/lib/ai/groq";

describe("Unit Tests: Groq AI Issue Triage & Code Fix Analyzer", () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.GROQ_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.GROQ_API_KEY = originalEnv;
  });

  it("returns error when GROQ_API_KEY is not configured and no token passed", async () => {
    delete process.env.GROQ_API_KEY;
    const context: IssueContext = {
      issueTitle: "Fix login session timeout",
      projectKey: "AUTH",
      issueNumber: 12,
    };

    const res = await analyzeIssueWithGroq(context);
    expect(res.success).toBe(false);
    expect(res.error).toContain("GROQ_API_KEY is not configured");
  });

  it("generates root cause analysis and code patch via Groq API with valid key", async () => {
    const mockAiOutput = `### 🎯 Root Cause & Impact Analysis
Session token expiry is not refreshed on user interaction.

### 📍 Relevant Files & Components
- \`src/lib/auth/session.ts\`

### 🛠️ Recommended Code Changes & Patch
\`\`\`diff
- const session = await getSession();
+ const session = await refreshSessionToken();
\`\`\`

### 🧪 Verification & Unit Testing Steps
1. Run \`pnpm test tests/unit/auth.test.ts\`.`;

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: "chatcmpl-12345",
        model: "openai/gpt-oss-120b",
        choices: [
          {
            message: {
              content: mockAiOutput,
            },
          },
        ],
      }),
    });

    const context: IssueContext = {
      issueTitle: "Session token timeout bug",
      issueDescription: "User gets logged out after 5 minutes of inactivity.",
      projectKey: "AUTH",
      issueNumber: 42,
      repoOwner: "test-org",
      repoName: "workflow",
      defaultBranch: "main",
      fileTree: ["src/lib/auth/session.ts", "src/actions/auth.ts"],
      fileSnippets: [{ path: "src/lib/auth/session.ts", content: "export async function getSession() {}" }],
    };

    const res = await analyzeIssueWithGroq(context, "gsk_test_api_key_123456");
    expect(res.success).toBe(true);
    expect(res.content).toBe(mockAiOutput);
    expect(res.model).toBe("openai/gpt-oss-120b");
  });

  it("handles Groq API rate limit or error response gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      json: async () => ({
        error: {
          message: "Rate limit reached for model openai/gpt-oss-120b",
        },
      }),
    });

    const context: IssueContext = {
      issueTitle: "Test rate limit",
      projectKey: "TEST",
      issueNumber: 1,
    };

    const res = await analyzeIssueWithGroq(context, "gsk_test_key");
    expect(res.success).toBe(false);
    expect(res.error).toContain("Rate limit reached");
  });
});
