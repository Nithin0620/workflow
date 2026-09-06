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

  // Run workspace lookup and membership list in parallel — both are independent
  const [workspace, userMemberships] = await Promise.all([
    prisma.workspace.findFirst({
      where: {
        slug: workspaceSlug,
        organization: { slug: orgSlug },
        members: { some: { userId: user.id } },
      },
      include: {
        organization: true,
        projects: {
          select: { id: true, name: true, key: true, color: true },
        },
      },
    }),
    prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: {
        workspace: {
          include: { organization: true },
        },
      },
    }),
  ]);

  if (!workspace) {
    notFound();
  }

  const formattedWorkspaces = userMemberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    role: m.role,
    organization: {
      name: m.workspace.organization.name,
      slug: m.workspace.organization.slug,
    },
  }));

  // Fetch discussion channels for the sidebar
  const { getWorkspaceChannels } = await import("@/actions/discussions");
  const { workspaceChannels, projectGroups } = await getWorkspaceChannels(
    workspace.id
  );

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
