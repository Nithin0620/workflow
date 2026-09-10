import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserWorkspaces } from "@/actions/workspaces";
import { getActiveDiscussionsOverview } from "@/actions/discussions";
import { prisma } from "@/lib/db/prisma";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { AnimatedFooter } from "@/components/layout/animated-footer";

export const metadata = {
  title: "Dashboard & Workspaces — Workflow",
  description: "View and manage all your workspaces, projects, and infrastructure.",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  let workspaces: any[] = [];
  let discussionsData = { channels: [] as any[] };

  try {
    const [wsRes, discRes] = await Promise.all([
      getUserWorkspaces().catch(() => []),
      getActiveDiscussionsOverview().catch(() => ({ channels: [] })),
    ]);
    workspaces = wsRes;
    discussionsData = discRes;
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
  }

  // Retrieve user's primary organization
  let orgData = user.workspaceMembers?.[0]?.workspace?.organization
    ? {
        id: user.workspaceMembers[0].workspace.organization.id,
        name: user.workspaceMembers[0].workspace.organization.name,
        slug: user.workspaceMembers[0].workspace.organization.slug,
      }
    : null;

  if (!orgData) {
    try {
      const ownedOrg = await prisma.organization.findFirst({
        where: { ownerId: user.id },
      });
      if (ownedOrg) {
        orgData = { id: ownedOrg.id, name: ownedOrg.name, slug: ownedOrg.slug };
      }
    } catch (err) {
      console.error("Error fetching owned organization:", err);
    }
  }

  if (!orgData) {
    orgData = {
      id: "default",
      name: user.name ? `${user.name}'s Org` : "Workflow Org",
      slug: user.name ? user.name.toLowerCase().replace(/\s+/g, "-") : "my-org",
    };
  }

  return (
    <>
      <DashboardView
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        }}
        organization={orgData}
        workspaces={workspaces as any}
        activeDiscussions={discussionsData.channels}
      />
      <OnboardingTour tourId="dashboard" />
      <AnimatedFooter />
    </>
  );
}
