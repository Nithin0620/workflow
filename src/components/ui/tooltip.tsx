"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className = "" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: false, left: false });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // If close to top edge, show below. Otherwise show above.
      const showTop = rect.top > 50;
      // If close to left edge, shift right
      const showLeft = rect.left < 50;

      setPosition({ top: showTop, left: showLeft });
    }
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-[100] px-3 py-1.5 text-xs font-semibold text-neutral-100 bg-neutral-800 border border-neutral-700/80 rounded-md shadow-lg shadow-black/40 whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-200 ${
            position.top
              ? "bottom-full mb-2"
              : "top-full mt-2"
          } ${
            position.left
              ? "left-0"
              : "left-1/2 -translate-x-1/2"
          } ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
