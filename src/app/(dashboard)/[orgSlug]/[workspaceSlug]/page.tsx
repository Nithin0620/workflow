import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FolderKanban, CheckCircle2, Clock, Users, ArrowUpRight } from "lucide-react";

interface WorkspacePageProps {
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}

export default async function WorkspaceOverviewPage({ params }: WorkspacePageProps) {
  const { orgSlug, workspaceSlug } = await params;
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      organization: { slug: orgSlug },
    },
    include: {
      projects: {
        include: {
          _count: { select: { issues: true } },
        },
      },
      members: {
        include: { user: true },
      },
    },
  });

  if (!workspace) return null;

  // Aggregate issue statistics
  const totalProjects = workspace.projects.length;
  const projectIds = workspace.projects.map((p) => p.id);

  const [totalIssues, inProgressIssues, doneIssues] = await Promise.all([
    prisma.issue.count({ where: { projectId: { in: projectIds } } }),
    prisma.issue.count({ where: { projectId: { in: projectIds }, status: "IN_PROGRESS" } }),
    prisma.issue.count({ where: { projectId: { in: projectIds }, status: "DONE" } }),
  ]);

  const recentAssignedIssues = await prisma.issue.findMany({
    where: {
      projectId: { in: projectIds },
      assigneeId: user.id,
    },
    include: { project: true },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header banner */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Welcome back, {user.name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Here is an overview of what is happening across <span className="font-semibold text-neutral-700 dark:text-neutral-300">{workspace.name}</span>.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Projects</span>
            <FolderKanban className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{totalProjects}</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Issues</span>
            <CheckCircle2 className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{totalIssues}</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{inProgressIssues}</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{doneIssues}</div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            Projects
          </h3>
          <Link
            href={`/${orgSlug}/${workspaceSlug}/projects`}
            className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            View all projects
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspace.projects.map((p) => (
            <Link
              key={p.id}
              href={`/${orgSlug}/${workspaceSlug}/projects/${p.key}/board`}
              className="group rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-blue-500 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white text-xs shadow"
                    style={{ backgroundColor: p.color || "#3b82f6" }}
                  >
                    {p.key.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {p.name}
                    </h4>
                    <span className="font-mono text-[11px] text-neutral-400">{p.key}</span>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-neutral-400 group-hover:text-blue-600 transition" />
              </div>

              <p className="mt-3 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
                {p.description || "No description provided."}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800 text-xs text-neutral-500">
                <span>{p._count.issues} issues</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">Open board →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
