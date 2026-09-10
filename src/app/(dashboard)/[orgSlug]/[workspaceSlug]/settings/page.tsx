import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { MembersList } from "@/components/settings/members-list";
import { WorkspaceAiScanner } from "@/components/settings/workspace-ai-scanner";
import { WorkspaceDangerZone } from "@/components/settings/workspace-danger-zone";
import { UserProfileSettings } from "@/components/settings/user-profile-settings";
import { OnboardingTour, TourReplayButton } from "@/components/onboarding/onboarding-tour";

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
    <div className="max-w-4xl mx-auto space-y-8 text-white pb-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Workspace Settings & Team
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage workspace details, team members, security credentials, and account settings.
          </p>
        </div>
        <TourReplayButton tourId="settings" />
      </div>

      {/* General info card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-lg" data-tour="settings-general">
        <h2 className="text-sm font-bold text-white">
          General Details
        </h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
              Workspace Name
            </label>
            <div className="mt-1 text-sm font-semibold text-white">
              {workspace.name}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
              Workspace Slug
            </label>
            <div className="mt-1 font-mono text-xs font-medium text-neutral-400">
              {workspace.slug}
            </div>
          </div>
        </div>
      </div>

      {/* Autonomous AI Codebase Scanners (Daily 12:00 PM) */}
      <div data-tour="settings-ai-scanner">
        <WorkspaceAiScanner
          workspaceId={workspace.id}
          canManage={currentUserRole === "OWNER" || currentUserRole === "ADMIN"}
        />
      </div>

      {/* Interactive Members Directory */}
      <div data-tour="settings-members">
        <MembersList
          workspaceId={workspace.id}
          currentUserRole={currentUserRole}
          currentUserId={user.id}
          initialMembers={workspace.members}
        />
      </div>

      {/* Personal User Profile & Password Settings */}
      <div data-tour="settings-profile">
        <UserProfileSettings
          currentUser={{
            id: user.id,
            name: user.name,
            email: user.email,
          }}
        />
      </div>

      {/* Workspace Danger Zone (Rename, Leave, Delete) */}
      <div data-tour="settings-danger">
        <WorkspaceDangerZone
          workspaceId={workspace.id}
          initialWorkspaceName={workspace.name}
          currentUserRole={currentUserRole}
        />
      </div>

      <OnboardingTour tourId="settings" />
    </div>
  );
}
