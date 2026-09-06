"use server";

import { prisma } from "@/lib/db/prisma";
import { requireProjectAccess } from "@/lib/auth/session";
import { connectRepositorySchema, updateRepositorySchema } from "@/lib/validators";
import {
  parseGithubRepoUrl,
  validateGithubConnection,
  fetchRepositoryBranches,
  RepoMetadata,
  BranchInfo,
} from "@/lib/github/client";
import { revalidatePath } from "next/cache";

export interface ProjectRepoDetails {
  id: string;
  projectId: string;
  repoUrl: string;
  repoOwner: string;
  repoName: string;
  defaultBranch: string;
  hasToken: boolean;
  maskedToken: string | null;
  aiScanEnabled: boolean;
  cronSchedule: string | null;
  lastScannedAt: Date | null;
  status: string;
}

/**
 * Mask access token for secure UI display (e.g., ghp_****5678).
 */
function maskToken(token?: string | null): string | null {
  if (!token) return null;
  const trimmed = token.trim();
  if (trimmed.length <= 8) return "••••••••";
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}

/**
 * Retrieves the connected repository settings for a project.
 */
export async function getProjectRepository(projectId: string): Promise<{
  success: boolean;
  repository?: ProjectRepoDetails | null;
  error?: string;
}> {
  try {
    await requireProjectAccess(projectId);

    const repo = await prisma.projectRepository.findUnique({
      where: { projectId },
    });

    if (!repo) {
      return { success: true, repository: null };
    }

    return {
      success: true,
      repository: {
        id: repo.id,
        projectId: repo.projectId,
        repoUrl: repo.repoUrl,
        repoOwner: repo.repoOwner,
        repoName: repo.repoName,
        defaultBranch: repo.defaultBranch,
        hasToken: !!repo.accessToken,
        maskedToken: maskToken(repo.accessToken),
        aiScanEnabled: repo.aiScanEnabled,
        cronSchedule: repo.cronSchedule,
        lastScannedAt: repo.lastScannedAt,
        status: repo.status,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch project repository." };
  }
}

/**
 * Connects and authorizes a GitHub repository to a project.
 */
export async function connectProjectRepository(rawInput: unknown): Promise<{
  success: boolean;
  repository?: ProjectRepoDetails;
  metadata?: RepoMetadata;
  error?: string;
}> {
  try {
    const validated = connectRepositorySchema.parse(rawInput);
    const access = await requireProjectAccess(validated.projectId);

    if (access.projectRole === "VIEWER") {
      return { success: false, error: "Only project owners and editors can connect repositories." };
    }

    const parsed = parseGithubRepoUrl(validated.repoUrl);
    if (!parsed) {
      return {
        success: false,
        error: "Invalid GitHub repository format. Use 'owner/repo' or 'https://github.com/owner/repo'.",
      };
    }

    // Validate connectivity against GitHub API
    const validation = await validateGithubConnection(
      parsed.owner,
      parsed.name,
      validated.accessToken
    );

    if (!validation.success || !validation.data) {
      return { success: false, error: validation.error || "Could not connect to GitHub repository." };
    }

    const defaultBranch =
      validated.defaultBranch && validated.defaultBranch.trim().length > 0
        ? validated.defaultBranch.trim()
        : validation.data.defaultBranch || "main";

    const canonicalUrl = `https://github.com/${parsed.owner}/${parsed.name}`;

    const repoDelegate = (prisma as any).projectRepository;
    if (!repoDelegate) {
      return { success: false, error: "Database repository schema not initialized." };
    }

    const repo = await repoDelegate.upsert({
      where: { projectId: validated.projectId },
      create: {
        projectId: validated.projectId,
        repoUrl: canonicalUrl,
        repoOwner: parsed.owner,
        repoName: parsed.name,
        defaultBranch,
        accessToken: validated.accessToken ? validated.accessToken.trim() : null,
        aiScanEnabled: validated.aiScanEnabled,
        cronSchedule: validated.cronSchedule || "0 12 * * *",
        status: "ACTIVE",
      },
      update: {
        repoUrl: canonicalUrl,
        repoOwner: parsed.owner,
        repoName: parsed.name,
        defaultBranch,
        accessToken:
          validated.accessToken !== undefined
            ? validated.accessToken
              ? validated.accessToken.trim()
              : null
            : undefined,
        aiScanEnabled: validated.aiScanEnabled,
        cronSchedule: validated.cronSchedule,
        status: "ACTIVE",
      },
    });

    revalidatePath(`/`);

    return {
      success: true,
      repository: {
        id: repo.id,
        projectId: repo.projectId,
        repoUrl: repo.repoUrl,
        repoOwner: repo.repoOwner,
        repoName: repo.repoName,
        defaultBranch: repo.defaultBranch,
        hasToken: !!repo.accessToken,
        maskedToken: maskToken(repo.accessToken),
        aiScanEnabled: repo.aiScanEnabled,
        cronSchedule: repo.cronSchedule,
        lastScannedAt: repo.lastScannedAt,
        status: repo.status,
      },
      metadata: validation.data,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to link repository." };
  }
}

/**
 * Updates settings for a connected repository.
 */
export async function updateRepositorySettings(rawInput: unknown): Promise<{
  success: boolean;
  repository?: ProjectRepoDetails;
  error?: string;
}> {
  try {
    const validated = updateRepositorySchema.parse(rawInput);
    const access = await requireProjectAccess(validated.projectId);

    if (access.projectRole === "VIEWER") {
      return { success: false, error: "Only project owners and editors can update repository settings." };
    }

    const current = await prisma.projectRepository.findUnique({
      where: { projectId: validated.projectId },
    });

    if (!current) {
      return { success: false, error: "No repository connected to this project." };
    }

    const updateData: any = {};
    if (validated.defaultBranch !== undefined) updateData.defaultBranch = validated.defaultBranch;
    if (validated.aiScanEnabled !== undefined) updateData.aiScanEnabled = validated.aiScanEnabled;
    if (validated.cronSchedule !== undefined) updateData.cronSchedule = validated.cronSchedule;
    if (validated.accessToken !== undefined) {
      updateData.accessToken = validated.accessToken ? validated.accessToken.trim() : null;
    }

    const updated = await prisma.projectRepository.update({
      where: { projectId: validated.projectId },
      data: updateData,
    });

    revalidatePath(`/`);

    return {
      success: true,
      repository: {
        id: updated.id,
        projectId: updated.projectId,
        repoUrl: updated.repoUrl,
        repoOwner: updated.repoOwner,
        repoName: updated.repoName,
        defaultBranch: updated.defaultBranch,
        hasToken: !!updated.accessToken,
        maskedToken: maskToken(updated.accessToken),
        aiScanEnabled: updated.aiScanEnabled,
        cronSchedule: updated.cronSchedule,
        lastScannedAt: updated.lastScannedAt,
        status: updated.status,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update repository settings." };
  }
}

/**
 * Disconnects and unlinks a repository from a project.
 */
export async function disconnectProjectRepository(projectId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const access = await requireProjectAccess(projectId);
    if (access.projectRole !== "OWNER") {
      return { success: false, error: "Only project owners can disconnect repositories." };
    }

    await prisma.projectRepository.deleteMany({
      where: { projectId },
    });

    revalidatePath(`/`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to disconnect repository." };
  }
}

/**
 * Tests live connection for a project repository or preview credentials.
 */
export async function testRepositoryConnection(
  projectId: string,
  overrideToken?: string | null
): Promise<{
  success: boolean;
  metadata?: RepoMetadata;
  branches?: BranchInfo[];
  error?: string;
}> {
  try {
    await requireProjectAccess(projectId);

    const repo = await prisma.projectRepository.findUnique({
      where: { projectId },
    });

    if (!repo) {
      return { success: false, error: "No repository is connected." };
    }

    const token = overrideToken !== undefined ? overrideToken : repo.accessToken;
    const validation = await validateGithubConnection(repo.repoOwner, repo.repoName, token);

    if (!validation.success) {
      await prisma.projectRepository.update({
        where: { projectId },
        data: { status: "ERROR" },
      });
      return { success: false, error: validation.error };
    }

    const branchRes = await fetchRepositoryBranches(
      repo.repoOwner,
      repo.repoName,
      token,
      repo.defaultBranch
    );

    await prisma.projectRepository.update({
      where: { projectId },
      data: { status: "ACTIVE" },
    });

    return {
      success: true,
      metadata: validation.data,
      branches: branchRes.branches,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Connection test failed." };
  }
}
