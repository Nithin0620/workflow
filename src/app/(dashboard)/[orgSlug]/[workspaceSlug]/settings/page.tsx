import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { MembersList } from "@/components/settings/members-list";
import { WorkspaceAiScanner } from "@/components/settings/workspace-ai-scanner";
import { WorkspaceDangerZone } from "@/components/settings/workspace-danger-zone";
import { UserProfileSettings } from "@/components/settings/user-profile-settings";

interface SettingsPageProps {
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { orgSlug, workspaceSlug } = await params;
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      organization: { slug: orgSlug },
    },
    include: {
      organization: true,
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!workspace) return null;

  const currentMember = workspace.members.find((m) => m.userId === user.id);
  const currentUserRole = currentMember?.role || "MEMBER";

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-white dark:text-black pb-12">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white dark:text-black">
          Workspace Settings & Team
        </h1>
        <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-0.5">
          Manage workspace details, team members, security credentials, and account settings.
        </p>
      </div>

      {/* General info card */}
      <div className="rounded-2xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-6 shadow-lg">
        <h2 className="text-sm font-bold text-white dark:text-black">
          General Details
        </h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-500 uppercase tracking-wider font-mono">
              Workspace Name
            </label>
            <div className="mt-1 text-sm font-semibold text-white dark:text-black">
              {workspace.name}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-500 uppercase tracking-wider font-mono">
              Workspace Slug
            </label>
            <div className="mt-1 font-mono text-xs font-medium text-neutral-400 dark:text-neutral-600">
              {workspace.slug}
            </div>
          </div>
        </div>
      </div>

      {/* Autonomous AI Codebase Scanners (Daily 12:00 PM) */}
      <WorkspaceAiScanner
        workspaceId={workspace.id}
        canManage={currentUserRole === "OWNER" || currentUserRole === "ADMIN"}
      />

      {/* Interactive Members Directory */}
      <MembersList
        workspaceId={workspace.id}
        currentUserRole={currentUserRole}
        currentUserId={user.id}
        initialMembers={workspace.members}
      />

      {/* Personal User Profile & Password Settings */}
      <UserProfileSettings
        currentUser={{
          id: user.id,
          name: user.name,
          email: user.email,
        }}
      />

      {/* Workspace Danger Zone (Rename, Leave, Delete) */}
      <WorkspaceDangerZone
        workspaceId={workspace.id}
        initialWorkspaceName={workspace.name}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
