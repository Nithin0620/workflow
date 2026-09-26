"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CodebaseGraphView } from "./codebase-graph-view";
import { BannerStrip } from "@/components/banners/banner-strip";
import {
  FolderKanban,
  Network,
  GitFork,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

export interface WorkspaceProjectItem {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  color?: string | null;
  issueCount: number;
  banners: string[];
  hasRepository: boolean;
  repository?: {
    id: string;
    owner: string;
    name: string;
    url: string;
    branch: string;
    status: string;
  } | null;
}

interface WorkspaceCodeGraphClientProps {
  workspaceName: string;
  orgSlug: string;
  workspaceSlug: string;
  projects: WorkspaceProjectItem[];
  initialProjectKey?: string;
}

export function WorkspaceCodeGraphClient({
  workspaceName,
  orgSlug,
  workspaceSlug,
  projects,
  initialProjectKey,
}: WorkspaceCodeGraphClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const paramKey = searchParams.get("project") || initialProjectKey;

  const matchedProject = paramKey
    ? projects.find(
        (p) => p.key.toLowerCase() === paramKey.toLowerCase() || p.id === paramKey
      )
    : null;

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    matchedProject ? matchedProject.id : null
  );

  const activeProject = projects.find((p) => p.id === selectedProjectId) || null;

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    const target = projects.find((p) => p.id === projectId);
    if (target) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("project", target.key.toLowerCase());
      router.replace(`${pathname}?${params.toString()}`);
    }
  };

  const handleBackToProjectsList = () => {
    setSelectedProjectId(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("project");
    router.replace(`${pathname}`);
  };

  // If no projects in workspace
  if (projects.length === 0) {
    return (
      <div className="flex h-screen flex-1 flex-col items-center justify-center p-8 text-center bg-black text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/80 text-blue-400 mb-4 shadow-xl">
          <FolderKanban className="h-8 w-8" />
        </div>
        <h2 className="text-base font-bold text-white">No Projects Found</h2>
        <p className="mt-1.5 max-w-sm text-xs text-neutral-400">
          Create a project in {workspaceName} and connect a GitHub repository to explore its codebase knowledge graph.
        </p>
      </div>
    );
  }

  // --- View 1: Project Selection Gallery Grid (When no project is selected) ---
  if (!activeProject) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 text-white py-6 px-4 md:px-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-900 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 shadow-md">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Codebase Knowledge Graph</span>
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Select a project below to explore its 2D architecture and module dependencies in {workspaceName}
              </p>
            </div>
          </div>
        </div>

        {/* Projects Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => {
            const projectColor = p.color || "#6366f1";

            return (
              <button
                key={p.id}
                onClick={() => handleSelectProject(p.id)}
                className="group flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-lg text-left transition-all hover:border-indigo-500/50 hover:bg-neutral-900 hover:shadow-indigo-500/10 cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl font-black text-black text-xs shadow-md"
                        style={{ backgroundColor: projectColor }}
                      >
                        {p.key.slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {p.name}
                        </h3>
                        <span className="font-mono text-xs text-neutral-500">{p.key}</span>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>

                  <p className="mt-3.5 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {p.description || "No description provided."}
                  </p>

                  {/* GitHub Repo Connection Status Badge */}
                  <div className="mt-4">
                    {p.hasRepository && p.repository ? (
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-950/40 px-2.5 py-1 text-[11px] font-medium text-emerald-300 border border-emerald-800/40">
                        <GitFork className="h-3 w-3 text-emerald-400" />
                        <span className="truncate max-w-[200px]">
                          {p.repository.owner}/{p.repository.name}
                        </span>
                        <span className="text-emerald-500">@{p.repository.branch}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-neutral-500 border border-neutral-800">
                        <GitFork className="h-3 w-3 text-neutral-600" />
                        <span>No Repo Connected</span>
                      </div>
                    )}
                  </div>

                  {p.banners.length > 0 && (
                    <BannerStrip imageUrls={p.banners} className="mt-4" />
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-neutral-900 pt-3 text-xs text-neutral-400">
                  <span>{p.issueCount} active issues</span>
                  <span className="text-indigo-400 font-semibold group-hover:text-indigo-300 flex items-center gap-1">
                    <span>Explore Graph</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- View 2: Active Project Graph Explorer ---
  return (
    <div className="flex h-screen flex-1 flex-col bg-black text-white overflow-hidden">
      {/* Top Workspace Bar & Back to Projects Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-900 bg-neutral-950/90 px-6 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToProjectsList}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white transition shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Projects</span>
          </button>

          <div className="h-4 w-[1px] bg-neutral-800" />

          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400 font-medium">{workspaceName}</span>
            <span className="text-neutral-600">/</span>
            <span className="font-bold text-white flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: activeProject.color || "#6366f1" }}
              />
              <span>{activeProject.name}</span>
            </span>
          </div>
        </div>

        {/* Project Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-400 font-medium">Switch Project:</label>
          <div className="relative">
            <select
              value={activeProject.id}
              onChange={(e) => handleSelectProject(e.target.value)}
              className="appearance-none rounded-xl border border-neutral-800 bg-neutral-900 pl-3 pr-8 py-1.5 text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none transition-colors cursor-pointer"
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name} ({proj.key}) {proj.hasRepository ? "✓ Connected" : "(No Repo)"}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          </div>
        </div>
      </div>

      {/* Main Graph Canvas / Architecture Explorer */}
      <div className="flex-1 p-4 overflow-hidden">
        <CodebaseGraphView
          projectId={activeProject.id}
          projectKey={activeProject.key}
        />
      </div>
    </div>
  );
}
