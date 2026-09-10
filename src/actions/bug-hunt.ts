"use server";

import { prisma } from "@/lib/db/prisma";
import { requireProjectAccess, requireWorkspaceMember } from "@/lib/auth/session";
import { runProjectBugHunt, BugHuntResult } from "@/lib/ai/bug-hunter";
import { revalidatePath } from "next/cache";

export interface WorkspaceRepoOverviewItem {
  projectId: string;
  projectName: string;
  projectKey: string;
  color: string | null;
  repository: {
    id: string;
    repoOwner: string;
    repoName: string;
    defaultBranch: string;
    aiScanEnabled: boolean;
    cronSchedule: string | null;
    lastScannedAt: string | null;
    status: string;
  } | null;
  aiBugReportCount: number;
}

/**
 * Runs a manual bug hunt on a specific project.
 */
export async function runManualBugHunt(
  projectId: string,
  customApiKey?: string
): Promise<BugHuntResult> {
  const access = await requireProjectAccess(projectId);
  if (access.projectRole === "VIEWER") {
    return {
      success: false,
      projectId,
      projectKey: "UNKNOWN",
      projectName: "Unknown",
      issuesCreated: 0,
      findings: [],
      summary: "Permission denied.",
      error: "Only project owners and editors can trigger bug hunts.",
    };
  }

  const result = await runProjectBugHunt(projectId, "MANUAL", customApiKey);
  revalidatePath(`/`);
  return result;
}

/**
 * Runs bug hunts across all active projects in a workspace.
 */
export async function runWorkspaceBugHunts(
  workspaceId: string,
  customApiKey?: string
): Promise<{
  success: boolean;
  totalProjects: number;
  scannedProjects: number;
  totalIssuesCreated: number;
  results: BugHuntResult[];
  summary: string;
}> {
  await requireWorkspaceMember(workspaceId);

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    include: { repository: true },
  });

  const activeProjects = projects.filter(
    (p) => p.repository && p.repository.status === "ACTIVE" && p.repository.aiScanEnabled
  );

  // ⚡ Bolt: Parallelize bug hunts across projects
  // 💡 What: Replaced sequential `for` loop with `Promise.all` for concurrent AI scan processing.
  // 🎯 Why: AI scans involve significant external API / network latency. Running them sequentially caused O(N) waiting time.
  // 📊 Impact: Reduces total workspace bug hunt duration from ~N * 10s to ~10s total, significantly improving responsiveness.
  // 🔬 Measurement: Observe response time of `runWorkspaceBugHunts` server action.
  const results = await Promise.all(
    activeProjects.map((project) => runProjectBugHunt(project.id, "MANUAL", customApiKey))
  );

  let totalIssuesCreated = 0;
  for (const res of results) {
    if (res.success) {
      totalIssuesCreated += res.issuesCreated;
    }
  }

  revalidatePath(`/`);

  return {
    success: true,
    totalProjects: projects.length,
    scannedProjects: activeProjects.length,
    totalIssuesCreated,
    results,
    summary: `Scanned ${activeProjects.length} of ${projects.length} project(s). Created ${totalIssuesCreated} autonomous bug report(s).`,
  };
}

/**
 * Retrieves repository & AI scanner health overview for a workspace.
 */
export async function getWorkspaceRepositoriesOverview(
  workspaceId: string
): Promise<{
  success: boolean;
  overview: WorkspaceRepoOverviewItem[];
  error?: string;
}> {
  try {
    await requireWorkspaceMember(workspaceId);

    const projects = await prisma.project.findMany({
      where: { workspaceId },
      include: {
        repository: true,
        issues: {
          where: {
            title: { startsWith: "[AI Bug Report]" },
          },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const overview: WorkspaceRepoOverviewItem[] = projects.map((p) => ({
      projectId: p.id,
      projectName: p.name,
      projectKey: p.key,
      color: p.color,
          repository: p.repository
        ? {
            id: p.repository.id,
            repoOwner: p.repository.repoOwner,
            repoName: p.repository.repoName,
            defaultBranch: p.repository.defaultBranch,
            aiScanEnabled: p.repository.aiScanEnabled,
            cronSchedule: p.repository.cronSchedule,
            lastScannedAt: p.repository.lastScannedAt?.toISOString() ?? null,
            status: p.repository.status,
          }
        : null,
      aiBugReportCount: p.issues.length,
    }));

    return { success: true, overview };
  } catch (err: any) {
    return { success: false, overview: [], error: err.message };
  }
}

export interface CronLogItem {
  id: string;
  projectId: string | null;
  projectName?: string;
  projectKey?: string;
  triggerSource: string;
  status: "SUCCESS" | "FAILED" | "RUNNING";
  findingsCount: number;
  issuesCreated: number;
  durationMs: number;
  summary: string;
  error?: string | null;
  rawOutput?: string | null;
  createdAt: string;
}

/**
 * Retrieves execution history for cron jobs in a workspace or specific project.
 */
export async function getCronExecutionHistory(
  workspaceId: string,
  projectId?: string
): Promise<{
  success: boolean;
  logs: CronLogItem[];
  error?: string;
}> {
  try {
    await requireWorkspaceMember(workspaceId);

    // Query CronExecutionLog safely
    const whereClause: any = { workspaceId };
    if (projectId) whereClause.projectId = projectId;

    let dbLogs: any[] = [];
    try {
      dbLogs = await (prisma as any).cronExecutionLog.findMany({
        where: whereClause,
        include: {
          project: { select: { id: true, name: true, key: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    } catch {
      dbLogs = [];
    }

    const logs: CronLogItem[] = dbLogs.map((l: any) => ({
      id: l.id,
      projectId: l.projectId,
      projectName: l.project?.name,
      projectKey: l.project?.key,
      triggerSource: l.triggerSource,
      status: l.status,
      findingsCount: l.findingsCount,
      issuesCreated: l.issuesCreated,
      durationMs: l.durationMs,
      summary: l.summary,
      error: l.error,
      rawOutput: l.rawOutput,
      createdAt: l.createdAt?.toISOString() ?? new Date(0).toISOString(),
    }));

    return { success: true, logs };
  } catch (err: any) {
    return { success: false, logs: [], error: err.message };
  }
}

