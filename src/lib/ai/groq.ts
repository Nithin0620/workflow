/**
 * Groq AI Engine Integration
 * Powered by high-speed LLaMA 3.3 models via Groq API.
 */

export interface IssueContext {
  issueTitle: string;
  issueDescription?: string | null;
  projectKey: string;
  issueNumber: number;
  repoOwner?: string;
  repoName?: string;
  defaultBranch?: string;
  fileTree?: string[];
  fileSnippets?: Array<{ path: string; content: string }>;
}

export interface AiFixResult {
  success: boolean;
  content?: string;
  model?: string;
  error?: string;
}

const DEFAULT_MODEL = "openai/gpt-oss-120b";

/**
 * Calls Groq API to analyze an issue and generate root cause + fix recommendation.
 */
export async function analyzeIssueWithGroq(
  context: IssueContext,
  apiKey?: string | null
): Promise<AiFixResult> {
  const token = (apiKey || process.env.GROQ_API_KEY || "").trim();

  if (!token) {
    return {
      success: false,
      error: "GROQ_API_KEY is not configured. Please provide a Groq API key in environment variables or project settings.",
    };
  }

  const systemPrompt = `You are a Staff Software Engineer & Autonomous Code Triage Agent for Workflow (Linear/Jira alternative).
Your task is to analyze bug reports and feature requests against the connected codebase and generate precise, actionable recommendations.

Format your response cleanly in Markdown with these standard sections:
### 🎯 Root Cause & Impact Analysis
Explain why this issue happens or what needs to be implemented based on the issue description and repository context.

### 📍 Relevant Files & Components
List the exact file paths in the codebase that should be inspected or modified.

### 🛠️ Recommended Code Changes & Patch
Provide the proposed fix or implementation with clear code blocks or diffs:
\`\`\`diff
- // existing code
+ // proposed fix
\`\`\`

### 🧪 Verification & Unit Testing Steps
Provide concrete steps or test cases to verify the fix and prevent regressions.

Keep your response technical, concise, practical, and directly ready for engineers to implement.`;

  // Build user prompt with issue and codebase context
  let userPrompt = `### Issue Details
- **Identifier**: ${context.projectKey}-${context.issueNumber}
- **Title**: ${context.issueTitle}
- **Description**: ${context.issueDescription || "No description provided."}
`;

  if (context.repoOwner && context.repoName) {
    userPrompt += `- **Connected Repository**: ${context.repoOwner}/${context.repoName} (${context.defaultBranch || "main"})\n`;
  }

  if (context.fileTree && context.fileTree.length > 0) {
    const treePreview = context.fileTree.slice(0, 100).join("\n");
    userPrompt += `\n### Repository File Tree (Sample):\n\`\`\`\n${treePreview}\n\`\`\`\n`;
  }

  if (context.fileSnippets && context.fileSnippets.length > 0) {
    userPrompt += `\n### Relevant Source Files:\n`;
    for (const file of context.fileSnippets.slice(0, 5)) {
      const truncated = file.content.slice(0, 3000);
      userPrompt += `\n**File: \`${file.path}\`**\n\`\`\`\n${truncated}\n\`\`\`\n`;
    }
  }

  userPrompt += `\nPlease provide the root cause analysis, target files, recommended code patch, and verification steps.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errJson.error?.message || `Groq API returned error ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();
    const messageContent = data.choices?.[0]?.message?.content;

    if (!messageContent) {
      return { success: false, error: "Groq API returned an empty response." };
    }

    return {
      success: true,
      content: messageContent,
      model: data.model || DEFAULT_MODEL,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to communicate with Groq AI API.",
    };
  }
}
