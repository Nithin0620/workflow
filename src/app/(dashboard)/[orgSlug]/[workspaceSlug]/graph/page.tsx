import { requireWorkspaceMember } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { WorkspaceCodeGraphClient } from "@/components/code-graph/workspace-code-graph-client";

interface GraphPageProps {
  params: Promise<{
    orgSlug: string;
    workspaceSlug: string;
  }>;
  searchParams?: Promise<{
    project?: string;
  }>;
}

export default async function WorkspaceGraphPage({
  params,
  searchParams,
}: GraphPageProps) {
  const { orgSlug, workspaceSlug } = await params;
  const search = searchParams ? await searchParams : {};

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
          repository: {
            select: {
              id: true,
              repoOwner: true,
              repoName: true,
              repoUrl: true,
              defaultBranch: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!workspace) {
    return <div className="p-8 text-neutral-400">Workspace not found</div>;
  }

  await requireWorkspaceMember(workspace.id);

  const projectOptions = workspace.projects.map((p) => ({
    id: p.id,
    name: p.name,
    key: p.key,
    description: p.description,
    color: p.color,
    issueCount: p._count.issues,
    banners: p.banners.map((b) => b.imageUrl),
    hasRepository: !!p.repository,
    repository: p.repository
      ? {
          id: p.repository.id,
          owner: p.repository.repoOwner,
          name: p.repository.repoName,
          url: p.repository.repoUrl,
          branch: p.repository.defaultBranch,
          status: p.repository.status,
        }
      : null,
  }));

  return (
    <WorkspaceCodeGraphClient
      workspaceName={workspace.name}
      orgSlug={orgSlug}
      workspaceSlug={workspaceSlug}
      projects={projectOptions}
      initialProjectKey={search.project}
    />
  );
}
