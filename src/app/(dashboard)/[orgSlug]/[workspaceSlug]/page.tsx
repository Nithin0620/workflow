import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FolderKanban, CheckCircle2, Clock, Users, ArrowUpRight } from "lucide-react";
import { BannerCarousel } from "@/components/banners/banner-carousel";
import { BannerStrip } from "@/components/banners/banner-strip";

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
          banners: {
            select: { id: true, imageUrl: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
      members: {
        include: { user: true },
      },
      banners: {
        select: { id: true, imageUrl: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!workspace) return null;

  const userRole = user.workspaceMembers.find((wm) => wm.workspace.id === workspace.id)?.role;

  // Aggregate issue statistics
  const totalProjects = workspace.projects.length;
  const projectIds = workspace.projects.map((p) => p.id);

  const groupedIssues = await prisma.issue.groupBy({
    by: ['status'],
    where: { projectId: { in: projectIds } },
    _count: true
  });

  const totalIssues = groupedIssues.reduce((acc, curr) => acc + curr._count, 0);
  const inProgressIssues = groupedIssues.find(g => g.status === "IN_PROGRESS")?._count || 0;
  const doneIssues = groupedIssues.find(g => g.status === "DONE")?._count || 0;

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
    <div className="space-y-8 max-w-6xl mx-auto text-white">
      {/* Header banner */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Welcome back, {user.name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Here is an overview of what is happening across <span className="font-semibold text-white">{workspace.name}</span>.
        </p>
      </div>

      {/* Workspace banner carousel */}
      <BannerCarousel
        banners={workspace.banners}
        canEdit={userRole === "OWNER" || userRole === "ADMIN"}
        workspaceId={workspace.id}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Active Projects</span>
            <FolderKanban className="h-4 w-4 text-white" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">{totalProjects}</div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Total Issues</span>
            <CheckCircle2 className="h-4 w-4 text-white" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">{totalIssues}</div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">In Progress</span>
            <Clock className="h-4 w-4 text-white" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">{inProgressIssues}</div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">{doneIssues}</div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
            YOUR PROJECTS
          </h3>
          <Link
            href={`/${orgSlug}/${workspaceSlug}/projects`}
            className="text-xs font-semibold text-neutral-300 hover:text-white transition"
          >
            View all projects →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspace.projects.map((p) => (
            <Link
              key={p.id}
              href={`/${orgSlug}/${workspaceSlug}/projects/${p.key}/board`}
              className="group rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-lg transition hover:border-neutral-600 hover:bg-neutral-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl font-black text-black bg-white text-xs shadow"
                  >
                    {p.key.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-neutral-200 transition-colors">
                      {p.name}
                    </h4>
                    <span className="font-mono text-xs text-neutral-500">{p.key}</span>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-white transition" />
              </div>

              <p className="mt-4 line-clamp-2 text-xs text-neutral-400 leading-relaxed">
                {p.description || "No description provided."}
              </p>

              <BannerStrip imageUrls={p.banners.map((b) => b.imageUrl)} className="mt-4" />

              <div className="mt-4 flex items-center justify-between border-t border-neutral-900 pt-3 text-xs text-neutral-400">
                <span>{p._count.issues} issues</span>
                <span className="text-white font-semibold group-hover:underline">Open board →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
