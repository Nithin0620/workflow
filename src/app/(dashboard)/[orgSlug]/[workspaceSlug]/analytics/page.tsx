import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import { getWorkspaceAnalytics } from "@/actions/analytics";
import { AnalyticsView } from "@/components/analytics/analytics-view";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";

interface AnalyticsPageProps {
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { orgSlug, workspaceSlug } = await params;
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      organization: { slug: orgSlug },
    },
    select: { id: true },
  });

  if (!workspace) {
    notFound();
  }

  const result = await getWorkspaceAnalytics({
    workspaceId: workspace.id,
    timeRangeDays: 30,
  });

  if (!result.success || !result.data) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-neutral-400">
        Failed to load analytics data.
      </div>
    );
  }

  return (
    <>
      <OnboardingTour tourId="analytics" />
      <AnalyticsView
        initialData={result.data}
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
      />
    </>
  );
}
