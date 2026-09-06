"use server";

import { prisma } from "@/lib/db/prisma";
import { requireProjectAccess, requireWorkspaceMember } from "@/lib/auth/session";
import { runCronJobScan, BugHuntResult } from "@/lib/ai/bug-hunter";
import { parseGithubRepoUrl } from "@/lib/github/client";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { computeNextRun } from "@/lib/cron";

export interface CronJobItem {
  id: string;
  name: string;
  description: string | null;
  schedule: string;
  jobType: string;
  enabled: boolean;
  projectId: string;
  projectName: string;
  projectKey: string;
  repoOwner: string;
  repoName: string;
  defaultBranch: string;
  lastStatus: string | null;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  runCount: number;
  failedCount: number;
  totalFindings: number;
  totalIssuesCreated: number;
}

export interface CronRunItem {
  id: string;
  cronJobId: string | null;
  cronJobName?: string;
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
  createdAt: Date;
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function requireEditor(access: { projectRole: string }) {
  if (access.projectRole === "VIEWER") {
    throw new Error("Only project owners and editors can manage cron jobs.");
  }
}

export interface CreateCronJobInput {
  workspaceId: string;
  projectId: string;
  name: string;
  description?: string | null;
  schedule?: string;
  repoOwner: string;
  repoName: string;
  defaultBranch?: string;
  accessToken?: string | null;
  jobType?: string;
}

export async function createCronJob(input: CreateCronJobInput): Promise<{
  success: boolean;
  job?: CronJobItem;
  error?: string;
}> {
  try {
    await requireWorkspaceMember(input.workspaceId);
    await requireProjectAccess(input.projectId).then(requireEditor);
    const parsed = parseGithubRepoUrl(`${input.repoOwner}/${input.repoName}`) || parseGithubRepoUrl(input.repoOwner);
    const owner = parsed?.owner || input.repoOwner;
    const name = parsed?.name || input.repoName;

    const job = await prisma.cronJob.create({
      data: {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        schedule: input.schedule || "0 12 * * *",
        jobType: input.jobType || "AI_SCAN",
        repoOwner: owner,
        repoName: name,
        defaultBranch: input.defaultBranch || "main",
        accessToken: input.accessToken?.trim() || null,
        enabled: true,
      },
    });

    revalidatePath(`/`);
    return {
      success: true,
      job: {
        id: job.id,
        name: job.name,
        description: job.description,
        schedule: job.schedule,
        jobType: job.jobType,
        enabled: job.enabled,
        projectId: job.projectId,
        projectName: "",
        projectKey: "",
        repoOwner: job.repoOwner,
        repoName: job.repoName,
        defaultBranch: job.defaultBranch,
        lastStatus: null,
        lastRunAt: null,
        nextRunAt: computeNextRun(job.schedule, job.enabled),
        runCount: 0,
        failedCount: 0,
        totalFindings: 0,
        totalIssuesCreated: 0,
      },
    };
  } catch (err) {
    return { success: false, error: errMsg(err) };
  }
}

export interface UpdateCronJobInput {
  name?: string;
  description?: string | null;
  schedule?: string;
  enabled?: boolean;
  repoOwner?: string;
  repoName?: string;
  defaultBranch?: string;
  accessToken?: string | null;
}

export async function updateCronJob(
  cronJobId: string,
  input: UpdateCronJobInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const job = await prisma.cronJob.findUnique({ where: { id: cronJobId } });
    if (!job) throw new Error("Cron job not found.");
    await requireProjectAccess(job.projectId).then(requireEditor);

    const data: Prisma.CronJobUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.schedule !== undefined) data.schedule = input.schedule;
    if (input.enabled !== undefined) data.enabled = input.enabled;
    if (input.repoOwner !== undefined) data.repoOwner = input.repoOwner.trim();
    if (input.repoName !== undefined) data.repoName = input.repoName.trim();
    if (input.defaultBranch !== undefined) data.defaultBranch = input.defaultBranch.trim() || "main";
    if (input.accessToken !== undefined) data.accessToken = input.accessToken?.trim() || null;

    await prisma.cronJob.update({ where: { id: cronJobId }, data });
    revalidatePath(`/`);
    return { success: true };
  } catch (err) {
    return { success: false, error: errMsg(err) };
  }
}

export async function deleteCronJob(cronJobId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const job = await prisma.cronJob.findUnique({ where: { id: cronJobId } });
    if (!job) throw new Error("Cron job not found.");
    await requireProjectAccess(job.projectId).then(requireEditor);
    await prisma.cronJob.delete({ where: { id: cronJobId } });
    revalidatePath(`/`);
    return { success: true };
  } catch (err) {
    return { success: false, error: errMsg(err) };
  }
}

export async function toggleCronJob(cronJobId: string): Promise<{ success: boolean; enabled?: boolean; error?: string }> {
  try {
    const job = await prisma.cronJob.findUnique({ where: { id: cronJobId } });
    if (!job) throw new Error("Cron job not found.");
    await requireProjectAccess(job.projectId).then(requireEditor);
    const updated = await prisma.cronJob.update({
      where: { id: cronJobId },
      data: { enabled: !job.enabled },
    });
    revalidatePath(`/`);
    return { success: true, enabled: updated.enabled };
  } catch (err) {
    return { success: false, error: errMsg(err) };
  }
}

export async function runCronJobNow(
  cronJobId: string,
  customApiKey?: string
): Promise<BugHuntResult> {
  const job = await prisma.cronJob.findUnique({ where: { id: cronJobId } });
  if (!job) {
    return {
      success: false,
      projectId: cronJobId,
      projectKey: "UNKNOWN",
      projectName: "Unknown",
      issuesCreated: 0,
      findings: [],
      summary: "Cron job not found.",
      error: "Cron job not found.",
    };
  }
  const access = await requireProjectAccess(job.projectId);
  if (access.projectRole === "VIEWER") {
    return {
      success: false,
      projectId: job.projectId,
      projectKey: "UNKNOWN",
      projectName: "Unknown",
      issuesCreated: 0,
      findings: [],
      summary: "Permission denied.",
      error: "Only project owners and editors can run cron jobs.",
    };
  }

  const result = await runCronJobScan(cronJobId, "MANUAL", customApiKey);
  revalidatePath(`/`);
  return result;
}

/**
 * Lists all cron jobs in a workspace with per-job run history counts and next run.
 */
export async function getWorkspaceCronJobs(workspaceId: string): Promise<{
  success: boolean;
  jobs: CronJobItem[];
  error?: string;
}> {
  try {
    await requireWorkspaceMember(workspaceId);

    const jobs = await prisma.cronJob.findMany({
      where: { workspaceId },
      include: { project: { select: { id: true, name: true, key: true } } },
      orderBy: { createdAt: "desc" },
    });

    const logs = await prisma.cronExecutionLog.findMany({
      where: { workspaceId, cronJobId: { not: null } },
      select: {
        cronJobId: true,
        status: true,
        findingsCount: true,
        issuesCreated: true,
      },
    });

    const agg = new Map<string, { runCount: number; failedCount: number; findings: number; issues: number }>();
    for (const l of logs) {
      const key = l.cronJobId as string;
      const cur = agg.get(key) || { runCount: 0, failedCount: 0, findings: 0, issues: 0 };
      cur.runCount++;
      if (l.status === "FAILED") cur.failedCount++;
      cur.findings += l.findingsCount;
      cur.issues += l.issuesCreated;
      agg.set(key, cur);
    }

    const items: CronJobItem[] = jobs.map((j) => {
      const a = agg.get(j.id) || { runCount: 0, failedCount: 0, findings: 0, issues: 0 };
      return {
        id: j.id,
        name: j.name,
        description: j.description,
        schedule: j.schedule,
        jobType: j.jobType,
        enabled: j.enabled,
        projectId: j.projectId,
        projectName: j.project.name,
        projectKey: j.project.key,
        repoOwner: j.repoOwner,
        repoName: j.repoName,
        defaultBranch: j.defaultBranch,
        lastStatus: j.lastStatus,
        lastRunAt: j.lastRunAt,
        nextRunAt: computeNextRun(j.schedule, j.enabled),
        runCount: a.runCount,
        failedCount: a.failedCount,
        totalFindings: a.findings,
        totalIssuesCreated: a.issues,
      };
    });

    return { success: true, jobs: items };
  } catch (err) {
    return { success: false, jobs: [], error: errMsg(err) };
  }
}

/**
 * Combined run history across every cron job in the workspace, with optional filters.
 */
export async function getCronRunHistory(
  workspaceId: string,
  filters?: { cronJobId?: string; projectId?: string; status?: string }
): Promise<{ success: boolean; logs: CronRunItem[]; error?: string }> {
  try {
    await requireWorkspaceMember(workspaceId);

    const where: Prisma.CronExecutionLogWhereInput = { workspaceId };
    if (filters?.cronJobId) where.cronJobId = filters.cronJobId;
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.status && filters.status !== "ALL") where.status = filters.status;

    const dbLogs = await prisma.cronExecutionLog.findMany({
      where,
      include: {
        cronJob: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, key: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const logs: CronRunItem[] = dbLogs.map((l) => ({
      id: l.id,
      cronJobId: l.cronJobId,
      cronJobName: l.cronJob?.name,
      projectId: l.projectId,
      projectName: l.project?.name,
      projectKey: l.project?.key,
      triggerSource: l.triggerSource,
      status: l.status as "SUCCESS" | "FAILED" | "RUNNING",
      findingsCount: l.findingsCount,
      issuesCreated: l.issuesCreated,
      durationMs: l.durationMs,
      summary: l.summary,
      error: l.error,
      rawOutput: l.rawOutput,
      createdAt: l.createdAt,
    }));

    return { success: true, logs };
  } catch (err) {
    return { success: false, logs: [], error: errMsg(err) };
  }
}

/**
 * Single run detail for the /cron/[id] page.
 */
export async function getCronRunDetail(runId: string): Promise<{
  success: boolean;
  log?: CronRunItem & { workspaceId: string; rawOutput?: string | null };
  jobs?: { id: string; name: string }[];
  projectsAvailable?: { id: string; name: string; key: string }[];
  error?: string;
}> {
  try {
    const log = await prisma.cronExecutionLog.findUnique({
      where: { id: runId },
      include: {
        cronJob: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, key: true } },
      },
    });
    if (!log) throw new Error("Run not found.");
    await requireWorkspaceMember(log.workspaceId);

    return {
      success: true,
      log: {
        id: log.id,
        cronJobId: log.cronJobId,
        cronJobName: log.cronJob?.name,
        projectId: log.projectId,
        projectName: log.project?.name,
        projectKey: log.project?.key,
        triggerSource: log.triggerSource,
        status: log.status as "SUCCESS" | "FAILED" | "RUNNING",
        findingsCount: log.findingsCount,
        issuesCreated: log.issuesCreated,
        durationMs: log.durationMs,
        summary: log.summary,
        error: log.error,
        rawOutput: log.rawOutput,
        createdAt: log.createdAt,
        workspaceId: log.workspaceId,
      },
    };
  } catch (err) {
    return { success: false, error: errMsg(err) };
  }
}

/**
 * Recent runs for a single project (board cron modal) + per-job counts.
 */
export async function getProjectCronRuns(projectId: string): Promise<{
  success: boolean;
  workspaceId?: string;
  jobs: CronJobItem[];
  logs: CronRunItem[];
  error?: string;
}> {
  try {
    await requireProjectAccess(projectId);
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { workspaceId: true } });
    if (!project) throw new Error("Project not found.");

    const [jobsRes, logsRes] = [
      await getWorkspaceCronJobs(project.workspaceId),
      await getCronRunHistory(project.workspaceId, { projectId }),
    ];
    return {
      success: true,
      workspaceId: project.workspaceId,
      jobs: jobsRes.success ? jobsRes.jobs.filter((j) => j.projectId === projectId) : [],
      logs: logsRes.success ? logsRes.logs : [],
    };
  } catch (err) {
    return { success: false, jobs: [], logs: [], error: errMsg(err) };
  }
}

/**
 * All projects in a workspace + their linked repo, for the cron-create dialog.
 */
export async function getCronProjectOptions(workspaceId: string): Promise<{
  success: boolean;
  projects: {
    id: string;
    name: string;
    key: string;
    repo?: { owner: string; name: string; branch: string; hasToken: boolean } | null;
  }[];
  error?: string;
}> {
  try {
    await requireWorkspaceMember(workspaceId);
    const projects = await prisma.project.findMany({
      where: { workspaceId },
      include: { repository: { select: { repoOwner: true, repoName: true, defaultBranch: true, accessToken: true } } },
      orderBy: { name: "asc" },
    });
    return {
      success: true,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        key: p.key,
        repo: p.repository
          ? {
              owner: p.repository.repoOwner,
              name: p.repository.repoName,
              branch: p.repository.defaultBranch,
              hasToken: !!p.repository.accessToken,
            }
          : null,
      })),
    };
  } catch (err) {
    return { success: false, projects: [], error: errMsg(err) };
  }
}