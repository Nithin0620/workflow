import { getCurrentUser } from "@/lib/auth/session";
import { PublicNavbar } from "@/components/common/public-navbar";
import { PlannedJourneys } from "@/components/home/planned-journeys";
import { JourneyFooter } from "@/components/home/journey-footer";
import { AnimatedFooter } from "@/components/layout/animated-footer";

export const metadata = {
  title: "Planned Journeys — Workflow",
  description: "Every capability Workflow is engineering next — the roadmap ahead.",
};

export default async function PlannedJourneyPage() {
  const user = await getCurrentUser();

  const userWorkspaceUrl =
    user?.workspaceMembers[0]?.workspace?.organization
      ? `/${user.workspaceMembers[0].workspace.organization.slug}/${user.workspaceMembers[0].workspace.slug}`
      : null;

  return (
    <div className="min-h-screen bg-black text-white">
      <PublicNavbar theme="dark" workspaceUrl={userWorkspaceUrl} />
      <PlannedJourneys />
      <JourneyFooter />
      <AnimatedFooter />
    </div>
  );
}
