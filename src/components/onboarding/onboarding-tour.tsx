"use client";

import { useEffect, useRef } from "react";
import type { Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { CircleHelp } from "lucide-react";
import { buildTourDriver, isTour } from "@/lib/onboarding-tours";
import { getTourState, markTourSeen } from "@/actions/onboarding";

interface OnboardingTourProps {
  tourId: string;
}

/**
 * Plays the guided tour for a page on the user's first visit.
 * Finish, Skip, or the close button all mark it seen so it doesn't replay.
 */
export function OnboardingTour({ tourId }: OnboardingTourProps) {
  const ran = useRef(false);
  const active = useRef<Driver | null>(null);

  useEffect(() => {
    // StrictMode double-fires this effect in dev; `ran` makes it a no-op
    // on the second run while the first async continuation still proceeds.
    if (ran.current || !isTour(tourId)) return;
    ran.current = true;

    (async () => {
      const res = await getTourState(tourId);
      if (res.success && res.seen) return;
      if (active.current?.isActive()) return;

      active.current = buildTourDriver(tourId, { onFinish: () => markTourSeen(tourId) });
      active.current?.drive();
    })();
  }, [tourId]);

  return null;
}

interface TourReplayButtonProps {
  tourId: string;
  className?: string;
}

/**
 * A small help icon to replay a page's guided tour at any time.
 */
export function TourReplayButton({ tourId, className = "" }: TourReplayButtonProps) {
  const driverRef = useRef<Driver | null>(null);

  const play = () => {
    if (!isTour(tourId)) return;
    if (driverRef.current?.isActive()) return;
    driverRef.current = buildTourDriver(tourId);
    driverRef.current?.drive();
  };

  return (
    <button
      onClick={play}
      title="Replay the guided tour"
      aria-label="Replay the guided tour"
      className={`flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 text-neutral-400 transition hover:border-neutral-600 dark:hover:border-neutral-400 hover:text-white dark:text-black ${className}`}
    >
      <CircleHelp className="h-4 w-4" />
    </button>
  );
}