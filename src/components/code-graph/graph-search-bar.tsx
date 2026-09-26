"use client";

import React from "react";
import { Search, X, Sparkles } from "lucide-react";

interface GraphSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  matchCount?: number;
  totalNodes?: number;
}

export function GraphSearchBar({
  searchQuery,
  onSearchChange,
  matchCount,
  totalNodes,
}: GraphSearchBarProps) {
  return (
    <div className="relative flex items-center">
      <div className="relative flex items-center w-full max-w-sm">
        <Search className="absolute left-3 h-4 w-4 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search files, routes, components, or issues..."
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900/90 pl-9 pr-8 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
        />
        {searchQuery ? (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 p-0.5 text-neutral-400 hover:text-white rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="absolute right-2.5 flex items-center gap-1 text-[10px] text-neutral-500 pointer-events-none">
            <Sparkles className="h-3 w-3 text-neutral-500" />
          </div>
        )}
      </div>

      {searchQuery && matchCount !== undefined && totalNodes !== undefined && (
        <div className="ml-3 text-xs text-neutral-400">
          <span className="font-semibold text-blue-400">{matchCount}</span> of{" "}
          <span className="text-neutral-300">{totalNodes}</span> nodes found
        </div>
      )}
    </div>
  );
}
