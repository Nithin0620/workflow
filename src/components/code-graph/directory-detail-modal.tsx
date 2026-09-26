"use client";

import React, { useState } from "react";
import { CodeNode } from "@/types/code-graph";
import { LAYER_COLORS } from "@/lib/github/graph-builder";
import {
  X,
  Folder,
  FileCode,
  ExternalLink,
  ArrowRight,
  AlertCircle,
  Search,
  Layers,
  FolderOpen,
} from "lucide-react";

interface DirectoryDetailModalProps {
  directoryNode: CodeNode | null;
  childNodes: CodeNode[];
  repoUrl?: string | null;
  defaultBranch?: string;
  isOpen: boolean;
  onClose: () => void;
  onDrillDown: (targetPath: string) => void;
  onSelectNode: (node: CodeNode) => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DirectoryDetailModal({
  directoryNode,
  childNodes,
  repoUrl,
  defaultBranch = "main",
  isOpen,
  onClose,
  onDrillDown,
  onSelectNode,
}: DirectoryDetailModalProps) {
  const [search, setSearch] = useState("");

  if (!isOpen || !directoryNode) return null;

  const filteredChildren = childNodes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.path.toLowerCase().includes(search.toLowerCase()) ||
    c.layer.toLowerCase().includes(search.toLowerCase())
  );

  const isRoot = !directoryNode.path;
  const displayName = isRoot ? "Root Directory" : directoryNode.path;

  const githubFolderUrl = repoUrl
    ? `${repoUrl.replace(/\/$/, "")}/tree/${defaultBranch}/${directoryNode.path}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{displayName}</h2>
              <p className="text-xs text-neutral-400">
                {childNodes.length} items in this directory • Click any sub-folder to drill down
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {githubFolderUrl && (
              <a
                href={githubFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition"
              >
                <span>View on GitHub</span>
                <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
              </a>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search Filter Toolbar */}
        <div className="border-b border-neutral-800/80 bg-neutral-900/30 px-6 py-3">
          <div className="relative flex items-center max-w-md">
            <Search className="absolute left-3 h-4 w-4 text-neutral-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter files in this directory..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 pl-9 pr-4 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Directory Contents Grid / List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredChildren.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Folder className="h-10 w-10 text-neutral-600 mb-2" />
              <p className="text-xs text-neutral-400">No matching files or folders found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredChildren.map((item) => {
                const isDir = item.type === "directory";
                const layerColor = LAYER_COLORS[item.layer] || "#94a3b8";

                return (
                  <div
                    key={item.id}
                    className="group flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-900/40 p-3.5 transition-all hover:border-neutral-700 hover:bg-neutral-900/80 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-800"
                          style={{ backgroundColor: `${layerColor}15` }}
                        >
                          {isDir ? (
                            <Folder className="h-4 w-4 text-blue-400" />
                          ) : (
                            <FileCode className="h-4 w-4" style={{ color: layerColor }} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4
                            className="truncate text-xs font-semibold text-white group-hover:text-blue-400 transition-colors"
                            title={item.name}
                          >
                            {item.name}
                          </h4>
                          <p
                            className="truncate text-[10px] text-neutral-400 font-mono"
                            title={item.path}
                          >
                            {item.path}
                          </p>
                        </div>
                      </div>

                      {/* Right metadata badge */}
                      <span
                        className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium capitalize"
                        style={{
                          backgroundColor: `${layerColor}20`,
                          color: layerColor,
                          border: `1px solid ${layerColor}40`,
                        }}
                      >
                        {item.layer}
                      </span>
                    </div>

                    {/* Stats and Action Footer */}
                    <div className="mt-3 flex items-center justify-between border-t border-neutral-800/60 pt-2 text-[11px]">
                      <div className="flex items-center gap-2 text-neutral-400">
                        {isDir ? (
                          <span>
                            {(item.childDirCount || 0) + (item.childFileCount || 0)} items inside
                          </span>
                        ) : (
                          <span>{formatBytes(item.size)}</span>
                        )}

                        {item.issueCount && item.issueCount > 0 ? (
                          <span className="flex items-center gap-1 text-red-400 font-semibold">
                            <AlertCircle className="h-3 w-3" />
                            {item.issueCount} {item.issueCount === 1 ? "issue" : "issues"}
                          </span>
                        ) : null}
                      </div>

                      <div>
                        {isDir ? (
                          <button
                            onClick={() => {
                              onClose();
                              onDrillDown(item.path);
                            }}
                            className="flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300"
                          >
                            <span>Open Folder</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onClose();
                              onSelectNode(item);
                            }}
                            className="flex items-center gap-1 font-medium text-neutral-300 hover:text-white"
                          >
                            <span>Inspect</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
