"use server";

import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceMember } from "@/lib/auth/session";

export interface AnalyticsFilterOptions {
  workspaceId: string;
  projectId?: string | null;
  timeRangeDays?: number; // e.g. 7, 14, 30, 90
  userId?: string; // Pre-verified caller (API routes); falls back to cookie session
}

export interface AnalyticsSummaryData {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  projects: Array<{ id: string; name: string; key: string }>;
  kpis: {
    totalIssues: number;
    doneIssues: number;
    inProgressIssues: number;
    backlogIssues: number;
    urgentIssues: number;
    completionRate: number;
    totalStoryPoints: number;
    completedStoryPoints: number;
    avgCycleTimeDays: number;
    avgLeadTimeDays: number;
    totalPRs: number;
    mergedPRs: number;
  };
  charts: {
    dailyThroughput: Array<{
      date: string;
      created: number;
      completed: number;
    }>;
    statusDistribution: Array<{
      status: string;
      label: string;
      count: number;
      color: string;
    }>;
    priorityDistribution: Array<{
      priority: string;
      label: string;
      count: number;
      color: string;
    }>;
    memberWorkload: Array<{
      userId: string;
      name: string;
      image?: string | null;
      email?: string | null;
      openCount: number;
      doneCount: number;
      storyPoints: number;
    }>;
  };
  bottlenecks: Array<{
    id: string;
    key: string;
    title: string;
    status: string;
    priority: string;
    daysInStatus: number;
    assignee?: { name?: string | null; image?: string | null } | null;
  }>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  BACKLOG: { label: "Backlog", color: "#71717a" },
  TODO: { label: "To Do", color: "#64748b" },
  IN_PROGRESS: { label: "In Progress", color: "#3b82f6" },
  IN_REVIEW: { label: "In Review", color: "#f59e0b" },
  DONE: { label: "Done", color: "#10b981" },
  CANCELED: { label: "Canceled", color: "#f43f5e" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  URGENT: { label: "Urgent", color: "#f43f5e" },
  HIGH: { label: "High", color: "#f97316" },
  MEDIUM: { label: "Medium", color: "#f59e0b" },
  LOW: { label: "Low", color: "#3b82f6" },
  NO_PRIORITY: { label: "No Priority", color: "#71717a" },
};

export async function getWorkspaceAnalytics(options: AnalyticsFilterOptions): Promise<{
  success: boolean;
  data?: AnalyticsSummaryData;
  error?: string;
}> {
  try {
    const { workspaceId, projectId, timeRangeDays = 30, userId } = options;

    if (userId) {
      // API-token caller — verify membership directly against the DB
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId,
          },
        },
      });
      if (!membership) {
        return { success: false, error: "Forbidden: You are not a member of this workspace." };
      }
    } else {
      await requireWorkspaceMember(workspaceId);
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        projects: {
          select: { id: true, name: true, key: true },
        },
      },
    });

    if (!workspace) {
      return { success: false, error: "Workspace not found" };
    }

    const projectFilter = projectId && projectId !== "ALL" 
      ? [projectId] 
      : workspace.projects.map((p) => p.id);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRangeDays);

    // Fetch issues and Git links in parallel
    const [allIssues, gitLinks] = await Promise.all([
      prisma.issue.findMany({
        where: {
          projectId: { in: projectFilter },
        },
        include: {
          assignee: { select: { id: true, name: true, image: true, email: true } },
          activityLogs: {
            where: {
              action: { in: ["ISSUE_MOVED", "STATUS_UPDATED", "ISSUE_CREATED"] },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      prisma.issueGitLink.findMany({
        where: {
          issue: { projectId: { in: projectFilter } },
        },
      }),
    ]);

    // KPI Metrics
    let doneCount = 0;
    let inProgressCount = 0;
    let backlogCount = 0;
    let urgentCount = 0;
    let totalStoryPoints = 0;
    let completedStoryPoints = 0;
    const cycleTimes: number[] = [];
    const leadTimes: number[] = [];

    const nowMs = Date.now();
    const bottlenecks: AnalyticsSummaryData["bottlenecks"] = [];

    const statusCounts: Record<string, number> = {
      BACKLOG: 0,
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
      CANCELED: 0,
    };

    const priorityCounts: Record<string, number> = {
      URGENT: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      NO_PRIORITY: 0,
    };

    const memberMap = new Map<
      string,
      {
        userId: string;
        name: string;
        image?: string | null;
        email?: string | null;
        openCount: number;
        doneCount: number;
        storyPoints: number;
      }
    >();

    for (const issue of allIssues) {
      const isDone = issue.status === "DONE";
      const isInProgress = issue.status === "IN_PROGRESS" || issue.status === "IN_REVIEW";
      const isBacklog = issue.status === "BACKLOG";
      const isUrgent = issue.priority === "URGENT" || issue.priority === "HIGH";

      if (isDone) doneCount++;
      if (isInProgress) inProgressCount++;
      if (isBacklog) backlogCount++;
      if (isUrgent) urgentCount++;

      const pts = issue.estimate || 0;
      totalStoryPoints += pts;
      if (isDone) completedStoryPoints += pts;

      statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1;
      priorityCounts[issue.priority] = (priorityCounts[issue.priority] || 0) + 1;

      // Cycle & Lead Times
      const createdMs = new Date(issue.createdAt).getTime();
      const updatedMs = new Date(issue.updatedAt).getTime();

      if (isDone) {
        // Lead time: Created -> Done
        const leadDays = (updatedMs - createdMs) / (1000 * 60 * 60 * 24);
        leadTimes.push(Math.max(0.1, leadDays));

        // Cycle time: First moved to IN_PROGRESS -> Done
        const startLog = issue.activityLogs.find((l: { details?: any; createdAt: Date }) =>
          JSON.stringify(l.details || "").includes("IN_PROGRESS")
        );
        const startMs = startLog ? new Date(startLog.createdAt).getTime() : createdMs;
        const cycleDays = (updatedMs - startMs) / (1000 * 60 * 60 * 24);
        cycleTimes.push(Math.max(0.1, cycleDays));
      } else if (isInProgress) {
        // Bottleneck detection (stuck > 4 days in progress / review)
        const daysInStatus = Math.round((nowMs - updatedMs) / (1000 * 60 * 60 * 24));
        if (daysInStatus >= 3) {
          bottlenecks.push({
            id: issue.id,
            key: `${issue.projectKey}-${issue.issueNumber}`,
            title: issue.title,
            status: issue.status,
            priority: issue.priority,
            daysInStatus,
            assignee: issue.assignee,
          });
        }
      }

      // Member Workload
      if (issue.assignee) {
        const uid = issue.assignee.id;
        if (!memberMap.has(uid)) {
          memberMap.set(uid, {
            userId: uid,
            name: issue.assignee.name || issue.assignee.email || "Teammate",
            image: issue.assignee.image,
            email: issue.assignee.email,
            openCount: 0,
            doneCount: 0,
            storyPoints: 0,
          });
        }
        const m = memberMap.get(uid)!;
        if (isDone) {
          m.doneCount++;
        } else {
          m.openCount++;
        }
        m.storyPoints += pts;
      }
    }

    // Sort bottlenecks by longest waiting
    bottlenecks.sort((a, b) => b.daysInStatus - a.daysInStatus);

    // Daily Throughput (for specified window)
    const dayMap = new Map<string, { created: number; completed: number }>();
    for (let d = 0; d < timeRangeDays; d++) {
      const target = new Date();
      target.setDate(target.getDate() - (timeRangeDays - 1 - d));
      const key = target.toISOString().slice(5, 10); // MM-DD
      dayMap.set(key, { created: 0, completed: 0 });
    }

    for (const issue of allIssues) {
      const createdKey = new Date(issue.createdAt).toISOString().slice(5, 10);
      if (dayMap.has(createdKey)) {
        dayMap.get(createdKey)!.created++;
      }
      if (issue.status === "DONE") {
        const updatedKey = new Date(issue.updatedAt).toISOString().slice(5, 10);
        if (dayMap.has(updatedKey)) {
          dayMap.get(updatedKey)!.completed++;
        }
      }
    }

    const dailyThroughput = Array.from(dayMap.entries()).map(([date, counts]) => ({
      date,
      created: counts.created,
      completed: counts.completed,
    }));

    // Averages
    const avgLead = leadTimes.length
      ? Number((leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length).toFixed(1))
      : 0;
    const avgCycle = cycleTimes.length
      ? Number((cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length).toFixed(1))
      : 0;

    const totalIssues = allIssues.length;
    const completionRate = totalIssues > 0 ? Math.round((doneCount / totalIssues) * 100) : 0;

    // Git PR Metrics
    const totalPRs = gitLinks.filter((g: { type: string }) => g.type === "PULL_REQUEST").length;
    const mergedPRs = gitLinks.filter((g: { type: string; status: string }) => g.type === "PULL_REQUEST" && g.status === "MERGED").length;

    return {
      success: true,
      data: {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
        },
        projects: workspace.projects,
        kpis: {
          totalIssues,
          doneIssues: doneCount,
          inProgressIssues: inProgressCount,
          backlogIssues: backlogCount,
          urgentIssues: urgentCount,
          completionRate,
          totalStoryPoints,
          completedStoryPoints,
          avgCycleTimeDays: avgCycle,
          avgLeadTimeDays: avgLead,
          totalPRs,
          mergedPRs,
        },
        charts: {
          dailyThroughput,
          statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({
            status,
            label: STATUS_CONFIG[status]?.label || status,
            count,
            color: STATUS_CONFIG[status]?.color || "#71717a",
          })),
          priorityDistribution: Object.entries(priorityCounts).map(([priority, count]) => ({
            priority,
            label: PRIORITY_CONFIG[priority]?.label || priority,
            count,
            color: PRIORITY_CONFIG[priority]?.color || "#71717a",
          })),
          memberWorkload: Array.from(memberMap.values()).sort((a, b) => b.openCount - a.openCount),
        },
        bottlenecks: bottlenecks.slice(0, 8),
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to calculate analytics." };
  }
}
