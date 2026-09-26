"use client";

import React from "react";
import { CodeNode } from "@/types/code-graph";
import { LAYER_COLORS } from "@/lib/github/graph-builder";
import {
  X,
  FileCode,
  Folder,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Layers,
  Database,
  Globe,
  FolderOpen,
  ListFilter,
  Link as LinkIcon,
} from "lucide-react";

interface GraphNodeInspectorProps {
  node: CodeNode | null;
  repoUrl?: string | null;
  defaultBranch?: string;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
  onDrillDown?: (targetPath: string) => void;
  onOpenDirectoryDetails?: (node: CodeNode) => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function GraphNodeInspector({
  node,
  repoUrl,
  defaultBranch = "main",
  onClose,
  onSelectNode,
  onDrillDown,
  onOpenDirectoryDetails,
}: GraphNodeInspectorProps) {
  if (!node) return null;

  const isDirectory = node.type === "directory";
  const layerColor = isDirectory ? "#6366f1" : LAYER_COLORS[node.layer] || "#94a3b8";

  const githubFileUrl = repoUrl
    ? `${repoUrl.replace(/\/$/, "")}/${isDirectory ? "tree" : "blob"}/${defaultBranch}/${node.path}`
    : null;

  return (
    <aside className="absolute right-4 top-16 bottom-4 z-20 w-80 md:w-96 flex flex-col rounded-2xl border border-neutral-800 bg-neutral-950/95 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-neutral-800/80 pb-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-800"
            style={{ backgroundColor: `${layerColor}18` }}
          >
            {isDirectory ? (
              <Folder className="h-5 w-5 text-indigo-400" />
            ) : node.layer === "db" ? (
              <Database className="h-5 w-5" style={{ color: layerColor }} />
            ) : node.layer === "api" ? (
              <Globe className="h-5 w-5" style={{ color: layerColor }} />
            ) : (
              <FileCode className="h-5 w-5" style={{ color: layerColor }} />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-white" title={node.name}>
              {isDirectory ? `${node.name}/` : node.name}
            </h3>
            <p className="truncate text-[11px] text-neutral-400 font-mono" title={node.path}>
              {node.path}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body / Details */}
      <div className="flex-1 space-y-4 overflow-y-auto py-3 pr-1 text-xs">
        {/* If directory, show Drill Down & View Files CTA */}
        {isDirectory ? (
          <div className="space-y-2 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3">
            <div className="flex items-center justify-between text-indigo-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <FolderOpen className="h-4 w-4" />
                <span>Directory Contents</span>
              </span>
              <span className="text-[11px] bg-indigo-900/60 px-2 py-0.5 rounded-full text-indigo-200">
                {(node.childDirCount || 0) + (node.childFileCount || 0)} items
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Drill down into this directory to view its sub-folders, files, and module relationships.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {onDrillDown && (
                <button
                  onClick={() => onDrillDown(node.path)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span>Dive Inside</span>
                </button>
              )}
              {onOpenDirectoryDetails && (
                <button
                  onClick={() => onOpenDirectoryDetails(node)}
                  className="flex items-center justify-center gap-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-800 transition"
                  title="View full file list modal"
                >
                  <ListFilter className="h-3.5 w-3.5" />
                  <span>Files</span>
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* Layer & Metadata Pills */}
        <div className="flex flex-wrap gap-2">
          {!isDirectory && (
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-medium"
              style={{
                backgroundColor: `${layerColor}20`,
                color: layerColor,
                border: `1px solid ${layerColor}40`,
              }}
            >
              <Layers className="h-3 w-3" />
              <span className="capitalize">{node.layer} Layer</span>
            </span>
          )}

          {!isDirectory && (
            <span className="inline-flex items-center rounded-md bg-neutral-900 px-2 py-0.5 text-neutral-300 border border-neutral-800 font-mono">
              {formatBytes(node.size)}
            </span>
          )}

          {node.extension && (
            <span className="inline-flex items-center rounded-md bg-neutral-900 px-2 py-0.5 text-neutral-300 border border-neutral-800 font-mono">
              {node.extension}
            </span>
          )}
        </div>

        {/* Connectivity Stats */}
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-2.5">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
              Outgoing Imports
            </span>
            <span className="mt-0.5 text-base font-bold text-white">
              {node.imports?.length || node.outDegree || 0}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
              Incoming Dependents
            </span>
            <span className="mt-0.5 text-base font-bold text-white">
              {node.importedBy?.length || node.inDegree || 0}
            </span>
          </div>
        </div>

        {/* Outgoing Imports List */}
        {node.imports && node.imports.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 font-semibold text-neutral-300">
              <ArrowRight className="h-3 w-3 text-blue-400" />
              <span>Imports ({node.imports.length})</span>
            </div>
            <div className="max-h-28 space-y-1 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-900/50 p-1.5">
              {node.imports.map((imp) => {
                const basename = imp.split("/").pop();
                return (
                  <button
                    key={imp}
                    onClick={() => onSelectNode(imp)}
                    className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-[11px] text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                  >
                    <span className="truncate font-mono" title={imp}>
                      {basename}
                    </span>
                    <LinkIcon className="h-2.5 w-2.5 text-neutral-500 shrink-0 ml-1" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Incoming Dependents List */}
        {node.importedBy && node.importedBy.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 font-semibold text-neutral-300">
              <ArrowLeft className="h-3 w-3 text-purple-400" />
              <span>Imported By ({node.importedBy.length})</span>
            </div>
            <div className="max-h-28 space-y-1 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-900/50 p-1.5">
              {node.importedBy.map((imp) => {
                const basename = imp.split("/").pop();
                return (
                  <button
                    key={imp}
                    onClick={() => onSelectNode(imp)}
                    className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-[11px] text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                  >
                    <span className="truncate font-mono" title={imp}>
                      {basename}
                    </span>
                    <LinkIcon className="h-2.5 w-2.5 text-neutral-500 shrink-0 ml-1" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Linked Issues */}
        {node.issues && node.issues.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 font-semibold text-red-400">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Linked Issues ({node.issues.length})</span>
            </div>
            <div className="space-y-1.5">
              {node.issues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-red-400 font-mono">{issue.key}</span>
                    <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">
                      {issue.status}
                    </span>
                  </div>
                  <p className="mt-1 text-neutral-300 line-clamp-2">{issue.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      {githubFileUrl && (
        <div className="border-t border-neutral-800/80 pt-3">
          <a
            href={githubFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 py-2 text-xs font-medium text-white hover:bg-neutral-800 transition-colors"
          >
            <span>View on GitHub</span>
            <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
          </a>
        </div>
      )}
    </aside>
  );
}
