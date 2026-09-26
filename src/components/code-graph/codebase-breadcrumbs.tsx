"use client";

import React from "react";
import { Folder, ChevronRight, Home, ArrowLeft } from "lucide-react";

interface CodebaseBreadcrumbsProps {
  currentPath: string; // e.g., "" or "src" or "src/components"
  onNavigate: (targetPath: string) => void;
  onGoBack: () => void;
  canGoBack: boolean;
}

export function CodebaseBreadcrumbs({
  currentPath,
  onNavigate,
  onGoBack,
  canGoBack,
}: CodebaseBreadcrumbsProps) {
  const segments = currentPath ? currentPath.split("/").filter(Boolean) : [];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
      {/* Back Button */}
      {canGoBack && (
        <button
          onClick={onGoBack}
          title="Go up to parent directory"
          className="flex items-center gap-1 rounded-md bg-neutral-900 px-2 py-1 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-800 transition-colors mr-1"
        >
          <ArrowLeft className="h-3 w-3" />
          <span className="text-[11px] font-medium">Up</span>
        </button>
      )}

      {/* Root Item */}
      <button
        onClick={() => onNavigate("")}
        className={`flex items-center gap-1 rounded-md px-2 py-1 font-semibold transition-colors ${
          segments.length === 0
            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
            : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
        }`}
      >
        <Home className="h-3.5 w-3.5" />
        <span>Root</span>
      </button>

      {/* Path Segments */}
      {segments.map((seg, idx) => {
        const fullPath = segments.slice(0, idx + 1).join("/");
        const isLast = idx === segments.length - 1;

        return (
          <React.Fragment key={fullPath}>
            <ChevronRight className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
            <button
              onClick={() => onNavigate(fullPath)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-colors ${
                isLast
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
              }`}
            >
              <Folder className="h-3 w-3 text-neutral-500" />
              <span>{seg}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
