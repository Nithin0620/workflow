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

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      organization: { slug: orgSlug },
    },
    include: {
      organization: true,
      members: {
        where: { userId: user.id },
      },
    },
  });

  if (!workspace) redirect("/dashboard");

  const memberRole = workspace.members[0]?.role || "MEMBER";
  const canManage = memberRole === "OWNER" || memberRole === "ADMIN";

  return (
    <CronManagementClient
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      orgSlug={orgSlug}
      workspaceSlug={workspaceSlug}
      canManage={canManage}
    />
  );
}
