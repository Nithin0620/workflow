"use client";

import { useState } from "react";
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
} from "lucide-react";

interface SidebarProps {
  orgSlug: string;
  workspaceSlug: string;
  workspaceId: string;
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
    <aside className="flex h-screen w-64 flex-col border-r border-neutral-900 bg-black p-4 text-white">
      {/* Workspace Switcher */}
      <WorkspaceSwitcher
        currentOrgSlug={orgSlug}
        currentWorkspaceSlug={workspaceSlug}
        workspaces={workspaces}
      />

      {/* Main Navigation */}
      <div className="mt-6 flex-1 space-y-6 overflow-y-auto">
        <div>
          <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-mono">
            WORKSPACE
          </span>
          <nav className="mt-1.5 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                    isActive
                      ? "bg-white text-black font-bold"
                      : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Projects Section */}
        <div>
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

          <div className="mt-1.5 space-y-1">
            {projects.map((p) => {
              const boardHref = `${baseUrl}/projects/${p.key}/board`;
              const isActive = pathname.startsWith(boardHref);
              return (
                <Link
                  key={p.id}
                  href={boardHref}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                    isActive
                      ? "bg-neutral-800 text-white font-bold"
                      : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className="h-2 w-2 rounded-full shrink-0 bg-white"
                    />
                    <span className="truncate">{p.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500">{p.key}</span>
                </Link>
              );
            })}

            {projects.length === 0 && (
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
