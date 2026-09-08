"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className = "" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, showTop: true, showLeft: false });
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const showTop = rect.top > 50;
      const showLeft = rect.left < 50;

      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        showTop,
        showLeft,
      });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible]);

  const tooltipElement = isVisible && mounted ? createPortal(
    <div
      className={`absolute z-[9999] px-3 py-1.5 text-xs font-semibold text-neutral-100 bg-neutral-800 border border-neutral-700/80 rounded-md shadow-lg shadow-black/40 whitespace-nowrap pointer-events-none animate-in fade-in duration-200 ${className}`}
      style={{
        top: coords.showTop ? coords.top - 8 : coords.top + 32,
        left: coords.showLeft ? coords.left : coords.left + 16,
        transform: coords.showTop
          ? (coords.showLeft ? 'translateY(-100%)' : 'translate(-50%, -100%)')
          : (coords.showLeft ? 'none' : 'translateX(-50%)')
      }}
    >
      {content}
    </div>,
    document.body
  ) : null;

  return (
    <div
      ref={containerRef}
      className="inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {tooltipElement}
    </div>
  );
}
