"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Only enable window-level Lenis smooth scroll on public marketing pages
    const isPublicPage =
      pathname === "/" ||
      pathname === "/how-it-works" ||
      pathname === "/contact" ||
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/planned-journey";

    if (!isPublicPage) {
      return;
    }

    // Initialize Lenis smooth scroll with smooth deceleration, easing curve and momentum delay
    const lenis = new Lenis({
      duration: 1.2, // Scroll duration for smooth start and gradual stop
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential ease-out for natural momentum
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.9, // Balanced scroll feel
      touchMultiplier: 1.5,
      infinite: false,
    });

    let animationFrameId: number;

    function raf(time: number) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }

    animationFrameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, [pathname]);

  return <>{children}</>;
}
