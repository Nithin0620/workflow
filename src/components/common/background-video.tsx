"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface BackgroundVideoProps {
  src: string;
  overlayClassName?: string;
  videoClassName?: string;
}

/**
 * Full-bleed animated video layer. Renders absolutely inside a `relative`
 * (and overflow-hidden) parent so siblings must carry `relative z-10`.
 */
export function BackgroundVideo({
  src,
  overlayClassName = "",
  videoClassName = "",
}: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.play().catch(() => {
        // Autoplay policy prevented playback or handled silently
      });
    }
  }, [src]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className={cn("absolute inset-0 h-full w-full object-cover opacity-40", videoClassName)}
      >
        <source src={src} type="video/mp4" />
      </video>
      {overlayClassName && <div className={cn("absolute inset-0", overlayClassName)} />}
    </div>
  );
}