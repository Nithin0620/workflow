import { PlannedJourneys } from "@/components/home/planned-journeys";
import { JourneyFooter } from "@/components/home/journey-footer";
import { AnimatedFooter } from "@/components/layout/animated-footer";

export const metadata = {
  title: "Planned Journeys — Workflow",
  description: "Every capability Workflow is engineering next — the roadmap ahead.",
};

export default async function PlannedJourneyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <PlannedJourneys />
      <JourneyFooter />
      <AnimatedFooter />
    </div>
  );
}
