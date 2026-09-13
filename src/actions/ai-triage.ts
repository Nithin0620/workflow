"use server";

import { prisma } from "@/lib/db/prisma";
import { requireProjectAccess } from "@/lib/auth/session";
import { analyzeIssueWithGroq, IssueContext } from "@/lib/ai/groq";
import { fetchRepositoryTree, fetchRepositoryFileContent } from "@/lib/github/client";
import { broadcastProjectEvent } from "@/lib/realtime/events";
import { revalidatePath } from "next/cache";

/**
 * Finds files in the repository tree that are likely relevant to the issue.
 */
function findRelevantFiles(
  tree: Array<{ path: string }>,
  title: string,
  description?: string | null
): string[] {
  const text = `${title} ${description || ""}`.toLowerCase();
  const tokens = text
    .split(/[\s,.;:()\[\]{}"'`\/\\]+/)
    .filter((w) => w.length > 3 && !["this", "that", "with", "from", "have", "make", "when", "what", "then"].includes(w));

  const codeFiles = tree.filter((f) =>
    /\.(ts|tsx|js|jsx|py|go|rs|java|sql|prisma|json|yaml|yml|md)$/i.test(f.path) &&
    !f.path.includes("node_modules") &&
    !f.path.includes(".next") &&
    !f.path.includes("dist/")
  );

  // 1. Direct path matches
  const directMatches = codeFiles.filter((f) => text.includes(f.path.toLowerCase())).map((f) => f.path);
  if (directMatches.length >= 3) return directMatches.slice(0, 5);

  // 2. Keyword score matching
  const scored = codeFiles.map((file) => {
    let score = 0;
    const lowerPath = file.path.toLowerCase();
    for (const token of tokens) {
      if (lowerPath.includes(token)) score += 10;
    }
    return { path: file.path, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const relevant = scored.filter((s) => s.score > 0).map((s) => s.path);

  const combined = Array.from(new Set([...directMatches, ...relevant]));
  return combined.slice(0, 5);
}

/**
 * Triggers an AI codebase scan and fix recommendation for an issue.
 */
export async function triggerAiIssueTriage(
  issueId: string,
  customApiKey?: string
): Promise<{
  success: boolean;
  comment?: any;
  aiOutput?: string;
  error?: string;
}> {
  try {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        project: {
          include: {
            repository: true,
          },
        },
      },
    });

    if (!issue) {
      return { success: false, error: "Issue not found." };
    }

    const { user } = await requireProjectAccess(issue.projectId);

    const repo = issue.project.repository;
    const context: IssueContext = {
      issueTitle: issue.title,
      issueDescription: issue.description,
      projectKey: issue.projectKey,
      issueNumber: issue.issueNumber,
    };

    // If repository is connected, fetch tree and snippets
    if (repo && repo.status === "ACTIVE") {
      context.repoOwner = repo.repoOwner;
      context.repoName = repo.repoName;
      context.defaultBranch = repo.defaultBranch;

      const treeRes = await fetchRepositoryTree(
        repo.repoOwner,
        repo.repoName,
        repo.defaultBranch,
        repo.accessToken
      );

      if (treeRes.success && treeRes.tree.length > 0) {
        context.fileTree = treeRes.tree.map((f) => f.path);

        const relevantPaths = findRelevantFiles(
          treeRes.tree,
          issue.title,
          issue.description
        );

        // 💡 What: Replaced sequential `for` loop with `Promise.all` for concurrent file content fetching.
        // 🎯 Why: Sequential API calls for N files blocked thread and scaled latency as O(N).
        // 📊 Impact: Significantly faster execution when fetching multiple relevant files from GitHub API by running requests concurrently.
        const fileSnippets: Array<{ path: string; content: string }> = [];
        const contentResults = await Promise.all(
          relevantPaths.map(async (filePath) => {
            const contentRes = await fetchRepositoryFileContent(
              repo.repoOwner,
              repo.repoName,
              filePath,
              repo.defaultBranch,
              repo.accessToken
            );
            return { filePath, contentRes };
          })
        );

        for (const { filePath, contentRes } of contentResults) {
          if (contentRes.success && contentRes.content) {
            fileSnippets.push({ path: filePath, content: contentRes.content });
          }
        }

        context.fileSnippets = fileSnippets;
      }
    }

    // Call Groq AI API
    const aiResult = await analyzeIssueWithGroq(context, customApiKey);

    if (!aiResult.success || !aiResult.content) {
      return {
        success: false,
        error: aiResult.error || "Groq AI could not generate a recommendation.",
      };
    }

    const formattedCommentContent = `🤖 **Autonomous AI Codebase Fix & Triage Report**\n*Model: ${aiResult.model || "Groq LLaMA 3.3"}*\n\n---\n\n${aiResult.content}`;

    // Create the AI comment in database
    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          issueId: issue.id,
          authorId: user.id,
          content: formattedCommentContent,
          isAi: true,
        },
        include: {
          author: { select: { id: true, name: true, image: true, email: true } },
          attachments: true,
        },
      });

      await tx.activityLog.create({
        data: {
          workspaceId: issue.project.workspaceId,
          issueId: issue.id,
          actorId: user.id,
          action: "COMMENT_ADDED",
          details: { isAi: true, type: "AI_FIX_RECOMMENDATION" },
        },
      });

      return newComment;
    });

    // Broadcast real-time comment event
    broadcastProjectEvent({
      type: "COMMENT_ADDED",
      projectId: issue.projectId,
      timestamp: Date.now(),
      actor: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      data: {
        issueId: issue.id,
        commentId: comment.id,
      },
    });

    revalidatePath(`/`);

    return {
      success: true,
      comment,
      aiOutput: aiResult.content,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to run AI triage.",
    };
  }
}
