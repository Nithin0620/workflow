"use client";

import React from "react";
import { CodeLayer, GraphFilterState } from "@/types/code-graph";
import { LAYER_COLORS } from "@/lib/github/graph-builder";
import { Layers, Folder, AlertCircle, ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react";

interface GraphControlsProps {
  filter: GraphFilterState;
  onFilterChange: (newFilter: GraphFilterState) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  layerCounts: Record<CodeLayer, number>;
}

const ALL_LAYERS: { key: CodeLayer; label: string }[] = [
  { key: "ui", label: "UI & Components" },
  { key: "actions", label: "Server Actions" },
  { key: "api", label: "API Routes" },
  { key: "db", label: "Database / DB" },
  { key: "hooks", label: "React Hooks" },
  { key: "types", label: "Types" },
  { key: "tests", label: "Tests" },
  { key: "config", label: "Config" },
  { key: "docs", label: "Docs" },
];

export function GraphControls({
  filter,
  onFilterChange,
  onZoomIn,
  onZoomOut,
  onResetView,
  layerCounts,
}: GraphControlsProps) {
  const toggleLayer = (layer: CodeLayer) => {
    const isSelected = filter.selectedLayers.includes(layer);
    let updated: CodeLayer[];
    if (isSelected) {
      updated = filter.selectedLayers.filter((l) => l !== layer);
    } else {
      updated = [...filter.selectedLayers, layer];
    }
    onFilterChange({ ...filter, selectedLayers: updated });
  };

  const selectAllLayers = () => {
    onFilterChange({
      ...filter,
      selectedLayers: ALL_LAYERS.map((l) => l.key),
    });
  };

  const clearAllLayers = () => {
    onFilterChange({
      ...filter,
      selectedLayers: [],
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950/80 px-4 py-2.5 backdrop-blur-md">
      {/* Layer Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-0.5">
        <div className="flex items-center gap-1 text-xs font-semibold text-neutral-400 mr-1.5">
          <Layers className="h-3.5 w-3.5 text-neutral-400" />
          <span>Layers:</span>
        </div>

        {ALL_LAYERS.map(({ key, label }) => {
          const count = layerCounts[key] || 0;
          if (count === 0) return null;
          const isSelected = filter.selectedLayers.includes(key);
          const color = LAYER_COLORS[key];

          return (
            <button
              key={key}
              onClick={() => toggleLayer(key)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                isSelected
                  ? "bg-neutral-800 text-white shadow-sm ring-1 ring-neutral-700"
                  : "bg-neutral-900/60 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: color,
                  boxShadow: isSelected ? `0 0 6px ${color}` : "none",
                }}
              />
              <span>{label}</span>
              <span className="rounded-full bg-neutral-800/80 px-1 text-[10px] text-neutral-400">
                {count}
              </span>
            </button>
          );
        })}

        <button
          onClick={selectAllLayers}
          className="ml-1 text-[11px] text-neutral-400 hover:text-neutral-200 underline underline-offset-2"
        >
          All
        </button>
        <button
          onClick={clearAllLayers}
          className="ml-1 text-[11px] text-neutral-500 hover:text-neutral-300 underline underline-offset-2"
        >
          None
        </button>
      </div>

      {/* View & Display Options */}
      <div className="flex items-center gap-2">
        {/* Toggle Directories */}
        <button
          onClick={() =>
            onFilterChange({
              ...filter,
              hideDirectories: !filter.hideDirectories,
            })
          }
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all ${
            filter.hideDirectories
              ? "bg-neutral-800 text-neutral-300 border border-neutral-700"
              : "bg-neutral-900 text-neutral-400 hover:text-neutral-200"
          }`}
          title="Toggle directory folder nodes"
        >
          <Folder className="h-3.5 w-3.5" />
          <span>{filter.hideDirectories ? "Files Only" : "Show Folders"}</span>
        </button>

        {/* Show Issues Only Toggle */}
        <button
          onClick={() =>
            onFilterChange({
              ...filter,
              showIssuesOnly: !filter.showIssuesOnly,
            })
          }
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all ${
            filter.showIssuesOnly
              ? "bg-red-500/20 text-red-300 border border-red-500/40"
              : "bg-neutral-900 text-neutral-400 hover:text-neutral-200"
          }`}
          title="Filter files linked to active Kanban issues"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Issues Only</span>
        </button>

        <div className="h-4 w-[1px] bg-neutral-800" />

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1 bg-neutral-900 rounded-lg p-0.5 border border-neutral-800">
          <button
            onClick={onZoomIn}
            title="Zoom In"
            className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onZoomOut}
            title="Zoom Out"
            className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onResetView}
            title="Reset View & Recenter"
            className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
