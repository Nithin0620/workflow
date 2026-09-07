import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import { WorkspaceLayoutShell } from "@/components/common/workspace-layout-shell";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { orgSlug, workspaceSlug } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Find workspace membership from in-memory cached user record
  const currentMembership = user.workspaceMembers.find(
    (m) =>
      m.workspace.slug === workspaceSlug &&
      m.workspace.organization.slug === orgSlug
  );

  const { getWorkspaceChannels } = await import("@/actions/discussions");

  // Fetch workspace projects and discussion channels in parallel
  const [workspace, discussionData] = await Promise.all([
    prisma.workspace.findFirst({
      where: {
        slug: workspaceSlug,
        organization: { slug: orgSlug },
        members: { some: { userId: user.id } },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        projects: {
          select: { id: true, name: true, key: true, color: true },
        },
      },
    }),
    currentMembership
      ? getWorkspaceChannels(currentMembership.workspaceId)
      : Promise.resolve({ workspaceChannels: [], projectGroups: [] }),
  ]);

  if (!workspace) {
    notFound();
  }

  const formattedWorkspaces = user.workspaceMembers.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    role: m.role,
    organization: {
      name: m.workspace.organization.name,
      slug: m.workspace.organization.slug,
    },
  }));

  const { workspaceChannels, projectGroups } = discussionData;

  return (
    <WorkspaceLayoutShell
      orgSlug={orgSlug}
      workspaceSlug={workspaceSlug}
      workspaceId={workspace.id}
      projects={workspace.projects}
      workspaces={formattedWorkspaces}
      workspaceChannels={workspaceChannels as any}
      projectChannelGroups={projectGroups as any}
    >
      {children}
    </WorkspaceLayoutShell>
  );
}
