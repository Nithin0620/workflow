"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WorkspaceSwitcher } from "@/components/workspaces/workspace-switcher";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  orgSlug: string;
  workspaceSlug: string;
  workspaceId: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  projects?: Array<{ id: string; name: string; key: string; color?: string | null }>;
  workspaces?: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
    organization: { name: string; slug: string };
  }>;
}

export function Sidebar({
  orgSlug,
  workspaceSlug,
  workspaceId,
  isCollapsed = false,
  onToggleCollapse,
  projects = [],
  workspaces = [],
}: SidebarProps) {
  const pathname = usePathname();
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const baseUrl = `/${orgSlug}/${workspaceSlug}`;

  const navLinks = [
    { label: "Overview", href: baseUrl, icon: LayoutDashboard },
    { label: "Projects", href: `${baseUrl}/projects`, icon: FolderKanban },
    { label: "Analytics", href: `${baseUrl}/analytics`, icon: BarChart3 },
    { label: "Settings & Team", href: `${baseUrl}/settings`, icon: Settings },
  ];

  return (
    <aside
      className={`relative flex h-screen flex-col border-r border-neutral-900 bg-black text-white transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-16 p-2" : "w-64 p-4"
      }`}
    >
      {/* Prominent half-overlapping collapse / expand button on the right border with bright red hover glow */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="group/btn absolute -right-3.5 top-6 z-30 flex h-7 w-7 items-center justify-center rounded-full border-2 border-neutral-800 bg-neutral-950 text-neutral-400 shadow-xl transition-all duration-200 transform hover:scale-115 active:scale-95 hover:border-red-500 hover:bg-black hover:text-red-400 hover:shadow-[0_0_16px_rgba(239,68,68,0.85)]"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
          ) : (
            <ChevronLeft className="h-4 w-4 transition-transform group-hover/btn:-translate-x-0.5" />
          )}
        </button>
      )}

      {/* Workspace Switcher */}
      <div className="relative z-20 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex-1">
            <WorkspaceSwitcher
              currentOrgSlug={orgSlug}
              currentWorkspaceSlug={workspaceSlug}
              workspaces={workspaces}
            />
          </div>
        ) : (
          <button
            onClick={onToggleCollapse}
            title={`Workspace: ${workspaceSlug} (click to expand)`}
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 font-bold font-mono text-xs text-white hover:border-neutral-700 transition"
          >
            {workspaceSlug.slice(0, 2).toUpperCase()}
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="mt-6 flex-1 space-y-6 overflow-y-auto overflow-x-hidden">
        <div>
          {!isCollapsed && (
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-mono">
              WORKSPACE
            </span>
          )}
          <nav className={`space-y-1 ${!isCollapsed ? "mt-1.5" : ""}`}>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={isCollapsed ? link.label : undefined}
                  className={`flex items-center rounded-xl transition ${
                    isCollapsed
                      ? "justify-center p-2.5"
                      : "gap-2.5 px-2.5 py-2 text-xs font-medium"
                  } ${
                    isActive
                      ? "bg-white text-black font-bold shadow-md"
                      : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{link.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Projects Section */}
        <div>
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-mono">
                PROJECTS
              </span>
              <button
                onClick={() => setCreateProjectOpen(true)}
                className="rounded p-1 text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
                title="Create Project"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center pb-1">
              <button
                onClick={() => setCreateProjectOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
                title="Create Project"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className={`space-y-1 ${!isCollapsed ? "mt-1.5" : ""}`}>
            {projects.map((p) => {
              const boardHref = `${baseUrl}/projects/${p.key}/board`;
              const isActive = pathname.startsWith(boardHref);
              return (
                <Link
                  key={p.id}
                  href={boardHref}
                  title={isCollapsed ? `${p.name} (${p.key})` : undefined}
                  className={`flex items-center rounded-xl transition ${
                    isCollapsed
                      ? "justify-center p-2.5"
                      : "justify-between px-2.5 py-2 text-xs font-medium"
                  } ${
                    isActive
                      ? "bg-neutral-800 text-white font-bold"
                      : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                  }`}
                >
                  {isCollapsed ? (
                    <span className="font-mono text-xs font-bold text-neutral-300">
                      {p.key.slice(0, 2)}
                    </span>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 truncate">
                        <div className="h-2 w-2 rounded-full shrink-0 bg-white" />
                        <span className="truncate">{p.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-neutral-500">{p.key}</span>
                    </>
                  )}
                </Link>
              );
            })}

            {projects.length === 0 && !isCollapsed && (
              <button
                onClick={() => setCreateProjectOpen(true)}
                className="w-full text-left rounded-lg px-2.5 py-2 text-xs text-neutral-500 hover:bg-neutral-900"
              >
                + Create your first project
              </button>
            )}
          </div>
        </div>
      </div>

      <CreateProjectDialog
        workspaceId={workspaceId}
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
      />
    </aside>
  );
}
