import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import { Sidebar } from "@/components/common/sidebar";
import { Header } from "@/components/common/header";

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

  // Find workspace
  const workspace = await prisma.workspace.findFirst({
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
  });

  if (!workspace) {
    notFound();
  }

  // Find all accessible workspaces for switcher
  const userMemberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: {
      workspace: {
        include: { organization: true },
      },
    },
  });

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

  return (
    <div className="flex h-full w-full bg-white text-black">
      <Sidebar
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        workspaceId={workspace.id}
        projects={workspace.projects}
        workspaces={formattedWorkspaces}
      />
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        <Header orgSlug={orgSlug} workspaceSlug={workspaceSlug} />
        <main className="flex-1 overflow-y-auto p-6 bg-[#fcfcfc] text-black">
          {children}
        </main>
      </div>
    </div>
  );
}
