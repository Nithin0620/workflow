import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { runProjectBugHunt, BugHuntResult } from "@/lib/ai/bug-hunter";

/**
 * Scheduled Daily Cron Job for Autonomous Bug Hunting (Daily 12:00 PM)
 * Can be triggered by Vercel Cron, GitHub Actions, or internal curl schedule.
 */
export async function GET(req: NextRequest) {
  return handleCronExecution(req);
}

export async function POST(req: NextRequest) {
  return handleCronExecution(req);
}

async function handleCronExecution(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Verify cron secret if configured in environment
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Find all active project repositories with AI scanning enabled
    const repos = await prisma.projectRepository.findMany({
      where: {
        aiScanEnabled: true,
        status: "ACTIVE",
      },
      include: {
        project: {
          select: { id: true, key: true, name: true },
        },
      },
    });

    const results: BugHuntResult[] = [];
    let totalIssuesCreated = 0;

    for (const repo of repos) {
      const result = await runProjectBugHunt(repo.projectId, "CRON");
      results.push(result);
      if (result.success) {
        totalIssuesCreated += result.issuesCreated;
      }
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs,
      totalRepositoriesConfigured: repos.length,
      totalIssuesCreated,
      results: results.map((r) => ({
        projectKey: r.projectKey,
        projectName: r.projectName,
        success: r.success,
        issuesCreated: r.issuesCreated,
        findingsCount: r.findings.length,
        summary: r.summary,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: err.message || "Failed to execute scheduled bug hunt.",
      },
      { status: 500 }
    );
  }
}
