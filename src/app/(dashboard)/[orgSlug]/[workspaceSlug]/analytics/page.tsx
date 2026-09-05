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
    <div className="max-w-6xl mx-auto space-y-6 text-white">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Analytics & Velocity
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Engineering throughput and delivery metrics across {workspace.name}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase font-mono">
            <span>Completion Rate</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">{completionRate}%</div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase font-mono">
            <span>Resolved Tickets</span>
            <CheckCircle2 className="h-4 w-4 text-white" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">{doneIssues}</div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase font-mono">
            <span>Active Sprint Load</span>
            <Clock className="h-4 w-4 text-white" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">{inProgressIssues}</div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase font-mono">
            <span>Urgent Items</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">{urgentIssues}</div>
        </div>
      </div>
    </div>
  );
}
