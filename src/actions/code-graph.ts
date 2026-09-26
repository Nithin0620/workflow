"use server";

import { prisma } from "@/lib/db/prisma";
import { requireProjectAccess } from "@/lib/auth/session";
import { fetchRepositoryTree, fetchRepositoryFileContent } from "@/lib/github/client";
import { buildCodebaseGraph } from "@/lib/github/graph-builder";
import { CodebaseGraphData, LinkedIssueSummary } from "@/types/code-graph";

export interface GetCodebaseGraphResponse {
  success: boolean;
  graph?: CodebaseGraphData;
  repository?: {
    owner: string;
    name: string;
    branch: string;
    url: string;
  } | null;
  error?: string;
}

/**
 * Server Action: Fetches and builds the codebase knowledge graph for a project's connected repository.
 */
export async function getProjectCodebaseGraph(
  projectId: string
): Promise<GetCodebaseGraphResponse> {
  try {
    if (!projectId || typeof projectId !== "string") {
      return { success: false, error: "Invalid project ID provided." };
    }

    // RBAC: Verify user has read access to the project
    await requireProjectAccess(projectId);

    // Fetch repository configuration
    const repo = await prisma.projectRepository.findUnique({
      where: { projectId },
    });

    if (!repo) {
      return {
        success: true,
        repository: null,
        error: "No GitHub repository connected to this project.",
      };
    }

    // Fetch repository tree from GitHub API
    const treeRes = await fetchRepositoryTree(
      repo.repoOwner,
      repo.repoName,
      repo.defaultBranch || "main",
      repo.accessToken
    );

    if (!treeRes.success || !treeRes.tree || treeRes.tree.length === 0) {
      return {
        success: false,
        error: treeRes.error || "Failed to retrieve repository tree from GitHub.",
      };
    }

    // Fetch project issues to cross-reference with files
    const issues = await prisma.issue.findMany({
      where: { projectId },
      select: {
        id: true,
        projectKey: true,
        issueNumber: true,
        title: true,
        status: true,
        priority: true,
      },
      take: 200,
    });

    const issueSummaries: LinkedIssueSummary[] = issues.map((i) => ({
      id: i.id,
      key: `${i.projectKey}-${i.issueNumber}`,
      title: i.title,
      status: i.status,
      priority: i.priority,
    }));

    // Fetch contents for key entrypoint and configuration files (up to 25 files) to extract import graph
    const fileContents = new Map<string, string>();
    const candidates = treeRes.tree
      .filter(
        (item) =>
          item.type === "blob" &&
          (item.path.endsWith(".ts") ||
            item.path.endsWith(".tsx") ||
            item.path.endsWith(".js") ||
            item.path.endsWith(".jsx") ||
            item.path.endsWith(".py")) &&
          !item.path.includes(".test.") &&
          !item.path.includes(".spec.")
      )
      .slice(0, 30);

    // Concurrently fetch sample file contents for AST/dependency discovery
    await Promise.allSettled(
      candidates.map(async (c) => {
        const contentRes = await fetchRepositoryFileContent(
          repo.repoOwner,
          repo.repoName,
          c.path,
          repo.defaultBranch || "main",
          repo.accessToken
        );
        if (contentRes.success && contentRes.content) {
          fileContents.set(c.path, contentRes.content);
        }
      })
    );

    // Build the Knowledge Graph
    const graph = buildCodebaseGraph(treeRes.tree, fileContents, issueSummaries);

    return {
      success: true,
      graph,
      repository: {
        owner: repo.repoOwner,
        name: repo.repoName,
        branch: repo.defaultBranch || "main",
        url: repo.repoUrl,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "An unexpected error occurred while generating codebase graph.",
    };
  }
}
