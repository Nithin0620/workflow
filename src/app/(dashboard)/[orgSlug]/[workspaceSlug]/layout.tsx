import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import { WorkspaceLayoutShell } from "@/components/common/workspace-layout-shell";
import { unstable_cache } from "next/cache";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}

/**
 * Cache the workspace projects query per (orgSlug, workspaceSlug, userId).
 * Revalidates every 30 s — fast enough for navigation latency, fresh enough for
 * project renames / new channels to show without a full reload.
 */
const getCachedWorkspace = unstable_cache(
  async (orgSlug: string, workspaceSlug: string, userId: string) => {
    return prisma.workspace.findFirst({
      where: {
        slug: workspaceSlug,
        organization: { slug: orgSlug },
        members: { some: { userId } },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        projects: {
          select: { id: true, name: true, key: true, color: true },
        },
      },
    });
  },
  ["workspace-layout"],
  { revalidate: 30, tags: ["workspace-layout"] }
);

const getCachedChannels = unstable_cache(
  async (workspaceId: string) => {
    const { getWorkspaceChannels } = await import("@/actions/discussions");
    return getWorkspaceChannels(workspaceId);
  },
  ["workspace-channels"],
  { revalidate: 30, tags: ["workspace-channels"] }
);

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

  // Fetch workspace and channels in parallel using per-key cached functions
  const [workspace, discussionData] = await Promise.all([
    getCachedWorkspace(orgSlug, workspaceSlug, user.id),
    currentMembership
      ? getCachedChannels(currentMembership.workspaceId)
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
