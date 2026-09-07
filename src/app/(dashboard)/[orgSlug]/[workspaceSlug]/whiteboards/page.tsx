import { requireWorkspaceMember } from "@/lib/auth/session";
import { getWorkspaceWhiteboards } from "@/actions/whiteboards";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import {
  PenTool,
  Plus,
  FolderKanban,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Share2,
} from "lucide-react";
import { WhiteboardListClient } from "@/components/whiteboard/whiteboard-list-client";

interface WhiteboardsPageProps {
  params: Promise<{
    orgSlug: string;
    workspaceSlug: string;
  }>;
}

export default async function WhiteboardsPage({ params }: WhiteboardsPageProps) {
  const { orgSlug, workspaceSlug } = await params;

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      organization: { slug: orgSlug },
    },
    include: {
      projects: {
        select: { id: true, name: true, key: true, color: true },
      },
    },
  });

  if (!workspace) {
    return <div className="p-8 text-neutral-400">Workspace not found</div>;
  }

  await requireWorkspaceMember(workspace.id);

  const { data: whiteboards = [] } = await getWorkspaceWhiteboards(workspace.id);

  return (
    <div className="flex h-screen flex-1 flex-col bg-black text-white overflow-y-auto">
      {/* Page Header */}
      <header className="border-b border-neutral-900 px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-400 mb-1">
              <span>{workspace.name}</span>
              <span>/</span>
              <span className="text-white font-medium">Whiteboards & Canvases</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <PenTool className="h-6 w-6 text-blue-500" />
              Collaborative Canvases
            </h1>
            <p className="text-xs text-neutral-400 mt-1 max-w-xl">
              Infinite visual boards for system architecture, ER diagrams, retrospectives, and cross-project planning.
            </p>
          </div>

          <WhiteboardListClient
            workspaceId={workspace.id}
            orgSlug={orgSlug}
            workspaceSlug={workspaceSlug}
            projects={workspace.projects}
          />
        </div>
      </header>

      {/* Whiteboards Grid */}
      <main className="flex-1 p-8">
        {whiteboards.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/50 p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-500 border border-blue-500/20 mb-4">
              <PenTool className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-white">No whiteboards created yet</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm">
              Brainstorm system architectures or wireframes together in real-time across your workspace and projects.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {whiteboards.map((board) => (
              <Link
                key={board.id}
                href={`/${orgSlug}/${workspaceSlug}/whiteboards/${board.id}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 shadow-lg transition-all duration-200 hover:border-neutral-700 hover:bg-neutral-900/60 hover:shadow-blue-500/5 hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                      <PenTool className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {new Date(board.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {board.title}
                  </h3>
                  {board.description && (
                    <p className="text-xs text-neutral-400 line-clamp-2 mt-1.5">
                      {board.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 border-t border-neutral-900 pt-3">
                  {board.projects.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {board.projects.map((pw) => (
                        <span
                          key={pw.project.id}
                          className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: `${pw.project.color || "#3b82f6"}20`,
                            color: pw.project.color || "#3b82f6",
                          }}
                        >
                          <FolderKanban className="h-2.5 w-2.5" />
                          {pw.project.key}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-neutral-500">Workspace Wide</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
