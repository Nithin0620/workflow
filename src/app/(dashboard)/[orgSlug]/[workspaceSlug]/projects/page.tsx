import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FolderKanban, ArrowUpRight, Plus } from "lucide-react";

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
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!workspace) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Projects
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Manage codebases, roadmaps, and teams in {workspace.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspace.projects.map((p) => (
          <Link
            key={p.id}
            href={`/${orgSlug}/${workspaceSlug}/projects/${p.key}/board`}
            className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-blue-500 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-white text-xs shadow"
                    style={{ backgroundColor: p.color || "#3b82f6" }}
                  >
                    {p.key.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {p.name}
                    </h3>
                    <span className="font-mono text-xs text-neutral-400">{p.key}</span>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-neutral-400 group-hover:text-blue-600 transition" />
              </div>

              <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                {p.description || "No description provided."}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800 text-xs text-neutral-500">
              <span>{p._count.issues} active issues</span>
              <span className="text-blue-600 dark:text-blue-400 font-medium">Kanban Board →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
