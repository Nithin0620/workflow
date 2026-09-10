import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FolderKanban, ArrowUpRight, Plus } from "lucide-react";
import { BannerStrip } from "@/components/banners/banner-strip";
import { OnboardingTour, TourReplayButton } from "@/components/onboarding/onboarding-tour";

interface ProjectsPageProps {
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
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
          lead: { select: { name: true, email: true } },
          _count: { select: { issues: true } },
          banners: {
            select: { id: true, imageUrl: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!workspace) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-white">
      <div className="flex items-center justify-between border-b border-neutral-900 pb-4" data-tour="projects-header">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Projects
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage codebases, roadmaps, and teams in {workspace.name}
          </p>
        </div>
        <TourReplayButton tourId="projects" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-tour="projects-grid">
        {workspace.projects.map((p) => (
          <Link
            key={p.id}
            href={`/${orgSlug}/${workspaceSlug}/projects/${p.key}/board`}
            prefetch={true}
            className="group flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-lg transition hover:border-neutral-600 hover:bg-neutral-900"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl font-black text-black bg-white text-xs shadow"
                  >
                    {p.key.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-neutral-200 transition-colors">
                      {p.name}
                    </h3>
                    <span className="font-mono text-xs text-neutral-500">{p.key}</span>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-white transition" />
              </div>

              <p className="mt-4 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                {p.description || "No description provided."}
              </p>

              <BannerStrip imageUrls={p.banners.map((b) => b.imageUrl)} className="mt-4" />
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-neutral-900 pt-3 text-xs text-neutral-400">
              <span>{p._count.issues} active issues</span>
              <span className="text-white font-semibold group-hover:underline">Kanban Board →</span>
            </div>
          </Link>
        ))}
      </div>

      <OnboardingTour tourId="projects" />
    </div>
  );
}
