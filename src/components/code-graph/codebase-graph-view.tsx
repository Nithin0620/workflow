"use client";

import React, { useState, useEffect, useRef, useTransition, useMemo } from "react";
import {
  CodebaseGraphData,
  CodeNode,
  CodeLayer,
  GraphFilterState,
} from "@/types/code-graph";
import { getProjectCodebaseGraph } from "@/actions/code-graph";
import { getSubgraphAtDirectory, LAYER_COLORS } from "@/lib/github/graph-builder";
import { ForceGraphCanvas } from "./force-graph-canvas";
import { GraphControls } from "./graph-controls";
import { GraphSearchBar } from "./graph-search-bar";
import { GraphNodeInspector } from "./graph-node-inspector";
import { CodebaseBreadcrumbs } from "./codebase-breadcrumbs";
import { DirectoryDetailModal } from "./directory-detail-modal";
import { RepositorySettingsDialog } from "@/components/repositories/repository-settings-dialog";
import {
  Network,
  RefreshCw,
  GitFork,
  FileCode,
  FolderGit2,
  FolderOpen,
  Folder,
  Sparkles,
  LayoutGrid,
  ArrowRight,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface CodebaseGraphViewProps {
  projectId: string;
  projectKey: string;
}

const DEFAULT_LAYERS: CodeLayer[] = [
  "ui",
  "actions",
  "api",
  "db",
  "hooks",
  "types",
  "tests",
  "config",
  "docs",
  "other",
];

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CodebaseGraphView({ projectId, projectKey }: CodebaseGraphViewProps) {
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [fullGraphData, setFullGraphData] = useState<CodebaseGraphData | null>(null);
  const [currentDirectory, setCurrentDirectory] = useState<string>(""); // "" = Root level
  const [viewLayout, setViewLayout] = useState<"canvas" | "grid">("canvas");
  const [repository, setRepository] = useState<{
    owner: string;
    name: string;
    branch: string;
    url: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<CodeNode | null>(null);
  const [repoSettingsOpen, setRepoSettingsOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalNode, setDetailModalNode] = useState<CodeNode | null>(null);

  const [filter, setFilter] = useState<GraphFilterState>({
    search: "",
    selectedLayers: DEFAULT_LAYERS,
    hideDirectories: false,
    minConnections: 0,
    showIssuesOnly: false,
  });

  const zoomActionRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    resetView: () => void;
  } | null>(null);

  const loadGraph = () => {
    setLoading(true);
    setError(null);
    startTransition(async () => {
      const res = await getProjectCodebaseGraph(projectId);
      if (res.success && res.graph) {
        setFullGraphData(res.graph);
        setRepository(res.repository || null);
      } else if (res.repository === null) {
        setFullGraphData(null);
        setRepository(null);
      } else {
        setError(res.error || "Failed to load codebase graph.");
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadGraph();
  }, [projectId]);

  // Compute clean subgraph for the current directory level
  const activeSubgraph = useMemo(() => {
    if (!fullGraphData) return null;
    return getSubgraphAtDirectory(fullGraphData, currentDirectory);
  }, [fullGraphData, currentDirectory]);

  // Drill down into folder
  const handleDrillDown = (targetPath: string) => {
    setCurrentDirectory(targetPath);
    setSelectedNode(null);
  };

  // Go up one level
  const handleGoBack = () => {
    if (!currentDirectory) return;
    const lastSlash = currentDirectory.lastIndexOf("/");
    if (lastSlash === -1) {
      setCurrentDirectory("");
    } else {
      setCurrentDirectory(currentDirectory.substring(0, lastSlash));
    }
    setSelectedNode(null);
  };

  // Open directory detail modal
  const handleOpenDirectoryDetails = (dirNode: CodeNode) => {
    setDetailModalNode(dirNode);
    setDetailModalOpen(true);
  };

  // Select node by ID
  const handleSelectNodeById = (nodeId: string) => {
    if (!fullGraphData) return;
    const target = fullGraphData.nodes.find((n) => n.id === nodeId) || null;
    if (target) {
      if (target.parentPath !== undefined && target.parentPath !== currentDirectory) {
        setCurrentDirectory(target.parentPath);
      }
      setSelectedNode(target);
    }
  };

  // Direct child nodes for the current directory (for detail modal)
  const currentDirChildNodes = useMemo(() => {
    if (!fullGraphData) return [];
    const targetPath = detailModalNode ? detailModalNode.path : currentDirectory;
    return fullGraphData.nodes.filter((n) => (n.parentPath || "") === targetPath);
  }, [fullGraphData, currentDirectory, detailModalNode]);

  // Search match count
  const matchCount =
    filter.search.trim().length > 0 && activeSubgraph
      ? activeSubgraph.nodes.filter(
          (n) =>
            n.name.toLowerCase().includes(filter.search.toLowerCase()) ||
            n.path.toLowerCase().includes(filter.search.toLowerCase()) ||
            n.layer.toLowerCase().includes(filter.search.toLowerCase())
        ).length
      : undefined;

  return (
    <div className="relative flex h-[calc(100vh-8.5rem)] w-full flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-black shadow-2xl">
      {/* Top Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 shadow-md">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Codebase Knowledge Graph</h2>
              {repository && (
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2.5 py-0.5 text-[11px] font-medium text-neutral-300 border border-neutral-800">
                  <GitFork className="h-3 w-3 text-neutral-400" />
                  <span>
                    {repository.owner}/{repository.name}
                  </span>
                  <span className="text-neutral-500">@{repository.branch}</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400">
              Clean architecture explorer • Click any module card or node to inspect
            </p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2.5">
          {activeSubgraph && (
            <GraphSearchBar
              searchQuery={filter.search}
              onSearchChange={(search) => setFilter((prev) => ({ ...prev, search }))}
              matchCount={matchCount}
              totalNodes={activeSubgraph.nodes.length}
            />
          )}

          {/* View Layout Toggle: Canvas vs Grid */}
          <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-0.5">
            <button
              onClick={() => setViewLayout("canvas")}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition ${
                viewLayout === "canvas"
                  ? "bg-neutral-800 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Interactive 2D Canvas"
            >
              <Network className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Graph</span>
            </button>
            <button
              onClick={() => setViewLayout("grid")}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition ${
                viewLayout === "grid"
                  ? "bg-neutral-800 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Architecture Cards Grid"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          <button
            onClick={() => {
              setDetailModalNode(
                fullGraphData?.nodes.find((n) => n.path === currentDirectory) || {
                  id: currentDirectory || "root",
                  name: currentDirectory || "Root Directory",
                  path: currentDirectory,
                  type: "directory",
                  layer: "other",
                  val: 10,
                }
              );
              setDetailModalOpen(true);
            }}
            disabled={!fullGraphData}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white disabled:opacity-40 transition"
            title="View full file list for current directory"
          >
            <FolderOpen className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">Files</span>
          </button>

          <button
            onClick={loadGraph}
            disabled={loading || isPending}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white disabled:opacity-50 transition"
            title="Refresh Knowledge Graph"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-1 flex-col items-center justify-center space-y-3 bg-neutral-950">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-xs font-medium text-neutral-400">
            Indexing repository files & structuring clean hierarchy...
          </p>
        </div>
      ) : !repository || !fullGraphData || !activeSubgraph ? (
        // Empty State: No Repo Connected
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-neutral-950 to-black">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/80 text-blue-400 mb-4 shadow-xl">
            <FolderGit2 className="h-8 w-8" />
          </div>
          <h3 className="text-base font-semibold text-white">No GitHub Repository Connected</h3>
          <p className="mt-1.5 max-w-md text-xs text-neutral-400">
            Connect your GitHub repository to explore your codebase hierarchy, modules, and dependencies.
          </p>
          <button
            onClick={() => setRepoSettingsOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
          >
            <FolderGit2 className="h-4 w-4" />
            <span>Connect GitHub Repository</span>
          </button>
        </div>
      ) : (
        <>
          {/* Breadcrumb & Sub-toolbar Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 bg-neutral-950/90 px-4 py-2">
            <CodebaseBreadcrumbs
              currentPath={currentDirectory}
              onNavigate={handleDrillDown}
              onGoBack={handleGoBack}
              canGoBack={!!currentDirectory}
            />

            <div className="text-[11px] text-neutral-400 font-medium">
              Showing <span className="font-bold text-white">{activeSubgraph.nodes.length}</span>{" "}
              {currentDirectory ? `items in ${currentDirectory}` : "root modules"}
            </div>
          </div>

          {/* Sub-toolbar Controls */}
          <GraphControls
            filter={filter}
            onFilterChange={setFilter}
            onZoomIn={() => zoomActionRef.current?.zoomIn()}
            onZoomOut={() => zoomActionRef.current?.zoomOut()}
            onResetView={() => zoomActionRef.current?.resetView()}
            layerCounts={activeSubgraph.stats.layerBreakdown}
          />

          {/* Content View: Interactive Canvas OR Architecture Grid */}
          {viewLayout === "canvas" ? (
            <div className="relative flex-1 w-full h-full overflow-hidden">
              <ForceGraphCanvas
                data={activeSubgraph}
                filter={filter}
                selectedNodeId={selectedNode ? selectedNode.id : null}
                onSelectNode={setSelectedNode}
                onDrillDown={handleDrillDown}
                zoomActionRef={zoomActionRef}
              />

              {/* Slide-Over Node Inspector */}
              {selectedNode && (
                <GraphNodeInspector
                  node={selectedNode}
                  repoUrl={repository?.url}
                  defaultBranch={repository?.branch}
                  onClose={() => setSelectedNode(null)}
                  onSelectNode={handleSelectNodeById}
                  onDrillDown={handleDrillDown}
                  onOpenDirectoryDetails={handleOpenDirectoryDetails}
                />
              )}

              {/* Bottom Floating Stats */}
              <div className="absolute bottom-3 left-4 pointer-events-none flex items-center gap-3 rounded-xl border border-neutral-800/80 bg-neutral-950/90 px-3.5 py-1.5 text-[11px] text-neutral-400 shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-1.5">
                  <FileCode className="h-3.5 w-3.5 text-blue-400" />
                  <span className="font-semibold text-white">{fullGraphData.stats.totalFiles}</span>{" "}
                  total files
                </div>
                <span className="text-neutral-600">•</span>
                <div className="flex items-center gap-1.5 text-indigo-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Double-click any folder to dive inside</span>
                </div>
              </div>
            </div>
          ) : (
            // Architecture Cards Grid View
            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-neutral-950 via-neutral-900 to-black">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSubgraph.nodes.map((node) => {
                  const isDir = node.type === "directory";
                  const layerColor = isDir ? "#6366f1" : LAYER_COLORS[node.layer] || "#94a3b8";

                  return (
                    <div
                      key={node.id}
                      className="group flex flex-col justify-between rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-4 shadow-lg backdrop-blur-md transition-all hover:border-indigo-500/50 hover:bg-neutral-900 hover:shadow-indigo-500/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-800"
                            style={{ backgroundColor: `${layerColor}18` }}
                          >
                            {isDir ? (
                              <Folder className="h-5 w-5 text-indigo-400" />
                            ) : (
                              <FileCode className="h-5 w-5" style={{ color: layerColor }} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                              {isDir ? `${node.name}/` : node.name}
                            </h3>
                            <p className="truncate text-[11px] text-neutral-400 font-mono">
                              {node.path}
                            </p>
                          </div>
                        </div>

                        <span
                          className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize"
                          style={{
                            backgroundColor: `${layerColor}20`,
                            color: layerColor,
                            border: `1px solid ${layerColor}40`,
                          }}
                        >
                          {node.layer}
                        </span>
                      </div>

                      {/* Card Body & Stats */}
                      <div className="mt-4 flex items-center justify-between border-t border-neutral-800/60 pt-3 text-xs">
                        <div className="text-neutral-400 text-[11px]">
                          {isDir ? (
                            <span>
                              {(node.childDirCount || 0) + (node.childFileCount || 0)} items inside
                            </span>
                          ) : (
                            <span>{formatBytes(node.size)}</span>
                          )}

                          {node.issueCount && node.issueCount > 0 ? (
                            <span className="ml-2 inline-flex items-center gap-1 text-red-400 font-semibold">
                              <AlertCircle className="h-3 w-3" />
                              {node.issueCount} issue
                            </span>
                          ) : null}
                        </div>

                        {isDir ? (
                          <button
                            onClick={() => handleDrillDown(node.path)}
                            className="flex items-center gap-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-2.5 py-1 text-xs font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition"
                          >
                            <span>Dive In</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedNode(node)}
                            className="flex items-center gap-1 rounded-lg bg-neutral-800 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:bg-neutral-700 hover:text-white transition"
                          >
                            <span>Inspect</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Dedicated Directory Files Modal */}
      <DirectoryDetailModal
        directoryNode={
          detailModalNode || {
            id: currentDirectory || "root",
            name: currentDirectory || "Root Directory",
            path: currentDirectory,
            type: "directory",
            layer: "other",
            val: 10,
          }
        }
        childNodes={currentDirChildNodes}
        repoUrl={repository?.url}
        defaultBranch={repository?.branch}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setDetailModalNode(null);
        }}
        onDrillDown={handleDrillDown}
        onSelectNode={(node) => {
          setSelectedNode(node);
          setDetailModalOpen(false);
        }}
      />

      {/* Repo Settings Modal for quick connect */}
      <RepositorySettingsDialog
        projectId={projectId}
        projectName={projectKey}
        projectKey={projectKey}
        isOpen={repoSettingsOpen}
        onClose={() => {
          setRepoSettingsOpen(false);
          loadGraph();
        }}
      />
    </div>
  );
}
