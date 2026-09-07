import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { CronManagementClient } from "@/components/cron/cron-management-client";

interface CronJobsPageProps {
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}

export default async function CronJobsPage({ params }: CronJobsPageProps) {
  const { orgSlug, workspaceSlug } = await params;
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const { getWorkspaceCronJobs, getCronRunHistory } = await import("@/actions/cron-jobs");

  // In-memory membership lookup
  const currentMembership = user.workspaceMembers.find(
    (m) =>
      m.workspace.slug === workspaceSlug &&
      m.workspace.organization.slug === orgSlug
  );

  const workspaceId = currentMembership?.workspaceId;

  const [workspace, jobsRes, historyRes] = await Promise.all([
    prisma.workspace.findFirst({
      where: {
        slug: workspaceSlug,
        organization: { slug: orgSlug },
        members: { some: { userId: user.id } },
      },
      select: {
        id: true,
        name: true,
      },
    }),
    workspaceId
      ? getWorkspaceCronJobs(workspaceId)
      : Promise.resolve({ success: false, jobs: [] }),
    workspaceId
      ? getCronRunHistory(workspaceId)
      : Promise.resolve({ success: false, logs: [] }),
  ]);

  if (!workspace) redirect("/dashboard");

  const memberRole = currentMembership?.role || "MEMBER";
  const canManage = memberRole === "OWNER" || memberRole === "ADMIN";

  return (
    <CronManagementClient
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      orgSlug={orgSlug}
      workspaceSlug={workspaceSlug}
      canManage={canManage}
      initialJobs={jobsRes.success ? jobsRes.jobs : []}
      initialLogs={historyRes.success ? historyRes.logs : []}
    />
  );
}
