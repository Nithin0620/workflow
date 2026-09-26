/**
 * GitHub REST API Client
 * Provides repo validation, branch listing, tree indexing, and file fetching.
 */

export interface ParsedRepo {
  owner: string;
  name: string;
}

export interface RepoMetadata {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  isPrivate: boolean;
  defaultBranch: string;
  description: string | null;
  htmlUrl: string;
}

export interface BranchInfo {
  name: string;
  isDefault: boolean;
}

export interface FileTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  size?: number;
  sha: string;
}

/**
 * Parses GitHub repository URL or "owner/repo" shorthand.
 */
export function parseGithubRepoUrl(input: string): ParsedRepo | null {
  if (!input || typeof input !== "string") return null;
  const clean = input.trim().replace(/\.git$/, "").replace(/\/$/, "");

  // Match full URLs like https://github.com/owner/repo
  const urlMatch = clean.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/i);
  if (urlMatch) {
    return { owner: urlMatch[1], name: urlMatch[2] };
  }

  // Match shorthand like owner/repo
  const shortMatch = clean.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (shortMatch && !clean.includes("://")) {
    return { owner: shortMatch[1], name: shortMatch[2] };
  }

  return null;
}

/**
 * Helper to build GitHub API request headers.
 */
function getHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Workflow-AI-Engine",
  };
  if (token && token.trim().length > 0) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  return headers;
}

/**
 * Validates connectivity to a GitHub repository.
 */
export async function validateGithubConnection(
  owner: string,
  name: string,
  token?: string | null
): Promise<{ success: boolean; data?: RepoMetadata; error?: string }> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
      headers: getHeaders(token),
      next: { revalidate: 0 },
    });

    if (res.status === 404) {
      return {
        success: false,
        error: token
          ? "Repository not found or token lacks access permission."
          : "Repository not found or is private. Please provide a GitHub Personal Access Token.",
      };
    }

    if (res.status === 401) {
      return { success: false, error: "Invalid GitHub Access Token." };
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body.message || `GitHub API error (${res.status})` };
    }

    const data = await res.json();
    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        fullName: data.full_name,
        owner: data.owner?.login || owner,
        isPrivate: !!data.private,
        defaultBranch: data.default_branch || "main",
        description: data.description || null,
        htmlUrl: data.html_url || `https://github.com/${owner}/${name}`,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to connect to GitHub" };
  }
}

/**
 * Fetches the branches of a repository.
 */
export async function fetchRepositoryBranches(
  owner: string,
  name: string,
  token?: string | null,
  defaultBranch = "main"
): Promise<{ success: boolean; branches: BranchInfo[]; error?: string }> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${name}/branches?per_page=100`, {
      headers: getHeaders(token),
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return { success: false, branches: [], error: `Failed to fetch branches (${res.status})` };
    }

    const data = await res.json();
    const branches: BranchInfo[] = Array.isArray(data)
      ? data.map((b: any) => ({
          name: b.name,
          isDefault: b.name === defaultBranch,
        }))
      : [];

    return { success: true, branches };
  } catch (err: any) {
    return { success: false, branches: [], error: err.message };
  }
}

/**
 * Fetches the repository recursive file tree for code scanning.
 */
export async function fetchRepositoryTree(
  owner: string,
  name: string,
  branch = "main",
  token?: string | null
): Promise<{ success: boolean; tree: FileTreeItem[]; error?: string }> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${name}/git/trees/${branch}?recursive=1`,
      {
        headers: getHeaders(token),
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      return { success: false, tree: [], error: `Failed to fetch repository tree (${res.status})` };
    }

    const data = await res.json();
    const tree: FileTreeItem[] = Array.isArray(data.tree)
      ? data.tree
          .filter((item: any) => item.type === "blob" || item.type === "tree")
          .map((item: any) => ({
            path: item.path,
            mode: item.mode,
            type: item.type,
            size: item.size,
            sha: item.sha,
          }))
      : [];

    return { success: true, tree };
  } catch (err: any) {
    return { success: false, tree: [], error: err.message };
  }
}

/**
 * Fetches the raw content of a specific file in the repository.
 */
export async function fetchRepositoryFileContent(
  owner: string,
  name: string,
  filePath: string,
  branch = "main",
  token?: string | null
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const cleanPath = filePath.replace(/^\/+/, "");
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${name}/contents/${cleanPath}?ref=${branch}`,
      {
        headers: getHeaders(token),
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      return { success: false, error: `File not found or inaccessible (${res.status})` };
    }

    const data = await res.json();
    if (data.content && data.encoding === "base64") {
      const decoded = Buffer.from(data.content, "base64").toString("utf-8");
      return { success: true, content: decoded };
    }

    return { success: false, error: "Unsupported file encoding or directory path" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Extracts unique issue keys (e.g., "PROJ-123", "WORK-42") from commit messages, branch names, or PR titles/bodies.
 */
export function extractIssueKeys(text: string, projectKey?: string): { projectKey: string; issueNumber: number; fullKey: string }[] {
  if (!text || typeof text !== "string") return [];

  // Match pattern like [A-Z]{2,10}-\d+ (e.g. PROJ-102, WORK-4, ENG-999)
  const regex = /\b([A-Z]{2,10})-(\d+)\b/gi;
  const matches = Array.from(text.matchAll(regex));
  
  const results: { projectKey: string; issueNumber: number; fullKey: string }[] = [];
  const seen = new Set<string>();

  for (const match of matches) {
    const rawProjectKey = match[1].toUpperCase();
    const issueNum = parseInt(match[2], 10);
    const fullKey = `${rawProjectKey}-${issueNum}`;

    if (projectKey && rawProjectKey !== projectKey.toUpperCase()) {
      continue;
    }

    if (!seen.has(fullKey) && !isNaN(issueNum) && issueNum > 0) {
      seen.add(fullKey);
      results.push({
        projectKey: rawProjectKey,
        issueNumber: issueNum,
        fullKey,
      });
    }
  }

  return results;
}

/**
 * Helper to generate suggested Git branch name for an issue
 */
export function generateSuggestedBranchName(projectKey: string, issueNumber: number, title: string): string {
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40)
    .replace(/-+$/, "");
  
  return `feat/${projectKey.toUpperCase()}-${issueNumber}-${cleanTitle || "task"}`;
}

