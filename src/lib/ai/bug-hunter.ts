/**
 * Autonomous Codebase Bug Hunter Engine
 * Scans connected repositories and creates tracked issues with recommended patches.
 */

import { prisma } from "@/lib/db/prisma";
import { fetchRepositoryTree, fetchRepositoryFileContent } from "@/lib/github/client";
import { broadcastProjectEvent } from "@/lib/realtime/events";
import { IssuePriority, IssueStatus } from "@prisma/client";

export interface BugFinding {
  title: string;
  severity: "HIGH" | "MEDIUM" | "LOW" | "URGENT";
  filePath: string;
  rootCause: string;
  proposedPatch: string;
  reproduction: string;
}

export interface BugHuntResult {
  success: boolean;
  projectId: string;
  projectKey: string;
  projectName: string;
  issuesCreated: number;
  findings: BugFinding[];
  summary: string;
  error?: string;
}

const DEFAULT_MODEL = "openai/gpt-oss-120b";

/**
 * Executes an AI Bug Hunt on a project's connected repository.
 */
export async function runProjectBugHunt(
  projectId: string,
  triggerSource: "MANUAL" | "CRON" = "MANUAL",
  customApiKey?: string
): Promise<BugHuntResult> {
  const token = (customApiKey || process.env.GROQ_API_KEY || "").trim();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      repository: true,
      columns: { orderBy: { order: "asc" } },
      workspace: { include: { organization: true } },
      lead: true,
    },
  });

  if (!project) {
    return {
      success: false,
      projectId,
      projectKey: "UNKNOWN",
      projectName: "Unknown",
      issuesCreated: 0,
      findings: [],
      summary: "Project not found.",
      error: "Project not found.",
    };
  }

  const repo = project.repository;
  if (!repo || repo.status !== "ACTIVE" || !repo.aiScanEnabled) {
    return {
      success: false,
      projectId: project.id,
      projectKey: project.key,
      projectName: project.name,
      issuesCreated: 0,
      findings: [],
      summary: "No active repository with AI scan enabled.",
      error: "Repository is not active or AI scanning is disabled.",
    };
  }

  if (!token) {
    return {
      success: false,
      projectId: project.id,
      projectKey: project.key,
      projectName: project.name,
      issuesCreated: 0,
      findings: [],
      summary: "GROQ_API_KEY is not configured.",
      error: "GROQ_API_KEY is missing. Configure in .env or pass a custom key.",
    };
  }

  // 1. Fetch Repository Tree
  const treeRes = await fetchRepositoryTree(
    repo.repoOwner,
    repo.repoName,
    repo.defaultBranch,
    repo.accessToken
  );

  if (!treeRes.success || treeRes.tree.length === 0) {
    return {
      success: false,
      projectId: project.id,
      projectKey: project.key,
      projectName: project.name,
      issuesCreated: 0,
      findings: [],
      summary: "Failed to fetch repository tree.",
      error: treeRes.error || "Repository tree empty or inaccessible.",
    };
  }

  // Filter core source code files
  const codeFiles = treeRes.tree.filter((f) =>
    /\.(ts|tsx|js|jsx|py|go|rs|java|sql|prisma)$/i.test(f.path) &&
    !f.path.includes("node_modules") &&
    !f.path.includes(".next") &&
    !f.path.includes("dist/") &&
    !f.path.includes("build/") &&
    !f.path.endsWith(".d.ts")
  );

  // Sample top key application files (up to 8 files)
  const sampledPaths = codeFiles.slice(0, 8).map((f) => f.path);
  const fileContents: Array<{ path: string; content: string }> = [];

  for (const path of sampledPaths) {
    const fileRes = await fetchRepositoryFileContent(
      repo.repoOwner,
      repo.repoName,
      path,
      repo.defaultBranch,
      repo.accessToken
    );
    if (fileRes.success && fileRes.content) {
      fileContents.push({ path, content: fileRes.content.slice(0, 2500) });
    }
  }

  if (fileContents.length === 0) {
    return {
      success: false,
      projectId: project.id,
      projectKey: project.key,
      projectName: project.name,
      issuesCreated: 0,
      findings: [],
      summary: "No readable source files found to scan.",
      error: "Could not read source files from repository.",
    };
  }

  // 2. Prompt Groq AI for static bug detection
  const systemPrompt = `You are an Autonomous Software Security & Quality Engineer.
Analyze the provided codebase files for real, critical bugs, logic flaws, race conditions, type bugs, unhandled promise rejections, or security vulnerabilities.

Return ONLY a valid JSON array of findings. If no significant bugs are found, return an empty array [].
Each finding in the array MUST match this exact JSON schema:
[
  {
    "title": "Concise bug summary (max 60 chars)",
    "severity": "HIGH" | "MEDIUM" | "LOW" | "URGENT",
    "filePath": "relative/path/to/file.ts",
    "rootCause": "Detailed explanation of the flaw and why it happens",
    "proposedPatch": "Exact code diff or replacement snippet",
    "reproduction": "Steps to reproduce or edge-case trigger"
  }
]
Limit findings to 1-3 most critical real bugs. Do not output markdown fences or explanatory text outside the JSON array.`;

  let userPrompt = `Repository: ${repo.repoOwner}/${repo.repoName} (Branch: ${repo.defaultBranch})\n\n`;
  for (const file of fileContents) {
    userPrompt += `--- File: ${file.path} ---\n${file.content}\n\n`;
  }
  userPrompt += `Audit these files and return the JSON array of findings.`;

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
        temperature: 0.1,
        max_tokens: 2048,
      }),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        projectId: project.id,
        projectKey: project.key,
        projectName: project.name,
        issuesCreated: 0,
        findings: [],
        summary: "Groq API error during bug hunt.",
        error: err.error?.message || `Groq API returned ${res.status}`,
      };
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content || "[]";

    // Extract JSON array
    let findings: BugFinding[] = [];
    try {
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        findings = JSON.parse(jsonMatch[0]);
      }
    } catch {
      findings = [];
    }

    let createdCount = 0;
    const defaultStatus = project.columns[0]?.key || "TODO";

    // Find default creator user (project lead or workspace member)
    const creatorId =
      project.leadId ||
      project.workspace.organization.ownerId;

    for (const finding of findings.slice(0, 3)) {
      const fullTitle = `[AI Bug Report] ${finding.title}`;

      // Avoid creating duplicate issues if already open with same title
      const existing = await prisma.issue.findFirst({
        where: {
          projectId: project.id,
          title: fullTitle,
        },
      });

      if (existing) continue;

      const description = `### 🤖 Autonomous AI Bug Hunter Finding
*Discovered during ${triggerSource === "CRON" ? "Daily 12:00 PM Scheduled Scan" : "Manual Codebase Audit"}*
*Repository: \`${repo.repoOwner}/${repo.repoName}\` (${repo.defaultBranch})*

---

#### 📍 Affected File
\`${finding.filePath}\`

#### 🎯 Root Cause & Impact
${finding.rootCause}

#### 🛠️ Recommended Code Patch
\`\`\`diff
${finding.proposedPatch}
\`\`\`

#### 🧪 Reproduction & Edge Case
${finding.reproduction}
`;

      const priorityVal: IssuePriority =
        finding.severity === "URGENT" || finding.severity === "HIGH"
          ? "HIGH"
          : finding.severity === "LOW"
          ? "LOW"
          : "MEDIUM";

      // Atomically increment issueSequence & create issue
      const updatedProject = await prisma.project.update({
        where: { id: project.id },
        data: { issueSequence: { increment: 1 } },
      });

      const newIssue = await prisma.issue.create({
        data: {
          projectId: project.id,
          projectKey: project.key,
          issueNumber: updatedProject.issueSequence,
          title: fullTitle,
          description,
          status: defaultStatus as IssueStatus,
          priority: priorityVal,
          creatorId,
        },
        include: {
          assignee: { select: { id: true, name: true, image: true, email: true } },
          creator: { select: { id: true, name: true, image: true } },
        },
      });

      // Add AI initial comment
      await prisma.comment.create({
        data: {
          issueId: newIssue.id,
          authorId: creatorId,
          content: `🤖 **AI Autonomous Analysis Summary**\nThis issue was automatically raised by the Daily Bug Hunter after scanning \`${finding.filePath}\`. Proposed fix is ready for review.`,
          isAi: true,
        },
      });

      // Broadcast real-time issue creation
      broadcastProjectEvent({
        type: "ISSUE_CREATED",
        projectId: project.id,
        timestamp: Date.now(),
        actor: {
          id: "ai-agent",
          name: "Workflow AI Agent",
          email: "ai@workflow.local",
        },
        data: {
          issue: newIssue,
        },
      });

      createdCount++;
    }

    // Persist CronExecutionLog
    try {
      await (prisma as any).cronExecutionLog.create({
        data: {
          projectId: project.id,
          workspaceId: project.workspace.id,
          triggerSource,
          status: "SUCCESS",
          findingsCount: findings.length,
          issuesCreated: createdCount,
          durationMs: Date.now() - (globalThis as any).__scanStart || 1500,
          summary:
            findings.length > 0
              ? `Found ${findings.length} flaw(s), created ${createdCount} issue(s) on board.`
              : "Codebase clean, no flaws detected.",
          rawOutput: JSON.stringify(findings),
        },
      });
    } catch {
      // Non-blocking log persistence
    }

    return {
      success: true,
      projectId: project.id,
      projectKey: project.key,
      projectName: project.name,
      issuesCreated: createdCount,
      findings,
      summary:
        findings.length > 0
          ? `Bug hunt complete: Found ${findings.length} potential issue(s), created ${createdCount} new issue(s) on board.`
          : "Bug hunt complete: Codebase clean, no critical flaws detected.",
    };
  } catch (err: any) {
    try {
      if (project?.id && project?.workspace?.id) {
        await (prisma as any).cronExecutionLog.create({
          data: {
            projectId: project.id,
            workspaceId: project.workspace.id,
            triggerSource,
            status: "FAILED",
            findingsCount: 0,
            issuesCreated: 0,
            durationMs: 500,
            summary: "Error during bug hunt execution.",
            error: err.message,
          },
        });
      }
    } catch {}

    return {
      success: false,
      projectId: project?.id || projectId,
      projectKey: project?.key || "UNKNOWN",
      projectName: project?.name || "Unknown",
      issuesCreated: 0,
      findings: [],
      summary: "Error during bug hunt execution.",
      error: err.message,
    };
  }
}
