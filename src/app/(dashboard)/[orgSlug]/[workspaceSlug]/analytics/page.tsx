import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { BarChart3, TrendingUp, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface AnalyticsPageProps {
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { orgSlug, workspaceSlug } = await params;
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      organization: { slug: orgSlug },
    },
    include: {
      projects: true,
    },
  });

  if (!workspace) return null;

  const projectIds = workspace.projects.map((p) => p.id);

  const [totalIssues, doneIssues, inProgressIssues, urgentIssues] = await Promise.all([
    prisma.issue.count({ where: { projectId: { in: projectIds } } }),
    prisma.issue.count({ where: { projectId: { in: projectIds }, status: "DONE" } }),
    prisma.issue.count({ where: { projectId: { in: projectIds }, status: "IN_PROGRESS" } }),
    prisma.issue.count({ where: { projectId: { in: projectIds }, priority: "URGENT" } }),
  ]);

  const completionRate = totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Analytics & Velocity
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Engineering throughput and delivery metrics across {workspace.name}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase">
            <span>Completion Rate</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{completionRate}%</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase">
            <span>Resolved Tickets</span>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{doneIssues}</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase">
            <span>Active Sprint Load</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{inProgressIssues}</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase">
            <span>Urgent Items</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{urgentIssues}</div>
        </div>
      </div>
    </div>
  );
}
