"use client";

import * as React from "react";
import { useState } from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ content, children, side = "top", className = "" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-2 py-1 text-xs font-medium text-neutral-100 bg-neutral-900 border border-neutral-800 rounded-md shadow-md whitespace-nowrap pointer-events-none ${
            side === "top"
              ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
              : side === "bottom"
              ? "top-full left-1/2 -translate-x-1/2 mt-2"
              : side === "left"
              ? "right-full top-1/2 -translate-y-1/2 mr-2"
              : "left-full top-1/2 -translate-y-1/2 ml-2"
          } ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
