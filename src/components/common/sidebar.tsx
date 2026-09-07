"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WorkspaceSwitcher } from "@/components/workspaces/workspace-switcher";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { CreateChannelDialog } from "@/components/discussions/create-channel-dialog";
import { DiscussionSearchDialog } from "@/components/discussions/discussion-search-dialog";
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Settings,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Hash,
  Megaphone,
  MessagesSquare,
  Search,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  PenTool,
} from "lucide-react";
import { useState, useEffect } from "react";

export interface ChannelItem {
  id: string;
  name: string;
  topic?: string | null;
  type: "TEXT" | "ANNOUNCEMENT";
  unreadCount?: number;
}

export interface ProjectGroupChannels {
  project: {
    id: string;
    name: string;
    key: string;
    color?: string | null;
  };
  channels: ChannelItem[];
}

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
  workspaceChannels?: ChannelItem[];
  projectChannelGroups?: ProjectGroupChannels[];
}

export function Sidebar({
  orgSlug,
  workspaceSlug,
  workspaceId,
  isCollapsed = false,
  onToggleCollapse,
  projects = [],
  workspaces = [],
  workspaceChannels = [],
  projectChannelGroups = [],
}: SidebarProps) {
  const pathname = usePathname();
  const isDiscussionsMode = pathname.includes("/discussions");

  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [targetProjectIdForChannel, setTargetProjectIdForChannel] = useState<string | null>(null);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      originalPushState.apply(this, args);
      setTimeout(() => setCanGoForward(false), 0);
    };
    const onPopState = () => setCanGoForward(true);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.history.pushState = originalPushState;
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  const baseUrl = `/${orgSlug}/${workspaceSlug}`;

  const navLinks = [
    { label: "Overview", href: baseUrl, icon: LayoutDashboard },
    { label: "Projects", href: `${baseUrl}/projects`, icon: FolderKanban },
    { label: "Whiteboards", href: `${baseUrl}/whiteboards`, icon: PenTool },
    { label: "Analytics", href: `${baseUrl}/analytics`, icon: BarChart3 },
    { label: "Cron Jobs & AI", href: `${baseUrl}/cron`, icon: Clock },
    { label: "Settings & Team", href: `${baseUrl}/settings`, icon: Settings },
  ];

  const openCreateChannelFor = (projectId?: string | null) => {
    setTargetProjectIdForChannel(projectId || null);
    setCreateChannelOpen(true);
  };

  return (
    <aside
      className={`relative flex h-screen flex-col border-r border-neutral-900 bg-black text-white transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-16 p-2" : "w-64 p-4"
      }`}
    >
      {/* Collapse / Expand Toggle Button */}
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

      {/* Back / Forward Buttons */}
      <div className={`relative z-10 flex justify-center gap-2 ${isCollapsed ? "" : "mb-2"}`}>
        <button
          onClick={() => window.history.back()}
          title="Go back"
          className={`flex items-center gap-2 rounded-xl border border-emerald-900/40 bg-emerald-950/30 text-emerald-400 transition hover:border-emerald-500/50 hover:bg-emerald-950/60 hover:text-emerald-300 ${
            isCollapsed ? "h-10 w-10 justify-center" : "px-2.5 py-2 text-xs font-medium"
          }`}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Back</span>}
        </button>
        <button
          onClick={() => window.history.forward()}
          title="Go forward"
          disabled={!canGoForward}
          className={`flex items-center gap-2 rounded-xl border border-amber-900/40 bg-amber-950/30 text-amber-400 transition hover:border-amber-500/50 hover:bg-amber-950/60 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-30 ${
            isCollapsed ? "h-10 w-10 justify-center" : "px-2.5 py-2 text-xs font-medium"
          }`}
        >
          {!isCollapsed && <span>Forward</span>}
          <ArrowRight className="h-4 w-4 shrink-0" />
        </button>
      </div>

      {/* Workspace Switcher / Header */}
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

      {/* DEDICATED DISCUSSIONS MODE SIDEBAR */}
      {isDiscussionsMode ? (
        <div className="mt-4 flex-1 flex flex-col min-h-0 overflow-hidden">
          {!isCollapsed ? (
            <>
              {/* Search Discussions button */}
              <button
                onClick={() => setSearchDialogOpen(true)}
                className="flex items-center justify-between w-full rounded-xl border border-neutral-800 bg-neutral-900/80 px-3 py-2 text-xs text-neutral-400 hover:border-neutral-700 hover:text-white transition shadow-sm mb-4"
              >
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Search discussions...</span>
                </div>
                <kbd className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-[9px] text-neutral-400">
                  ⌘K
                </kbd>
              </button>

              {/* Discussions Tree - High Priority Section */}
              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                {/* General Channels */}
                <div>
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                      WORKSPACE CHANNELS
                    </span>
                    <button
                      onClick={() => openCreateChannelFor(null)}
                      className="rounded p-1 text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
                      title="Create Workspace Channel"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {workspaceChannels.map((c) => {
                      const channelHref = `${baseUrl}/discussions/${c.id}`;
                      const isActive = pathname === channelHref;
                      const isAnnouncement = c.type === "ANNOUNCEMENT";
                      return (
                        <Link
                          key={c.id}
                          href={channelHref}
                          prefetch={true}
                          className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition ${
                            isActive
                              ? "bg-white text-black font-bold shadow-md"
                              : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isAnnouncement ? (
                              <Megaphone
                                className={`h-3.5 w-3.5 shrink-0 ${
                                  isActive ? "text-black" : "text-amber-400"
                                }`}
                              />
                            ) : (
                              <Hash
                                className={`h-3.5 w-3.5 shrink-0 ${
                                  isActive ? "text-black" : "text-neutral-400"
                                }`}
                              />
                            )}
                            <span className="truncate">{c.name}</span>
                          </div>
                          {c.unreadCount && c.unreadCount > 0 ? (
                            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold font-mono text-white">
                              {c.unreadCount}
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Project-Specific Channels */}
                {projectChannelGroups.map((group) => (
                  <div key={group.project.id} className="pt-2 border-t border-neutral-900">
                    <div className="flex items-center justify-between px-2 py-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        <span className="truncate text-[11px] font-bold text-neutral-300 font-mono uppercase tracking-wider">
                          {group.project.name}
                        </span>
                      </div>
                      <button
                        onClick={() => openCreateChannelFor(group.project.id)}
                        className="text-neutral-500 hover:text-white p-0.5 rounded transition"
                        title={`Add channel to ${group.project.name}`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="space-y-0.5 mt-1">
                      {group.channels.map((c) => {
                        const channelHref = `${baseUrl}/discussions/${c.id}`;
                        const isActive = pathname === channelHref;
                        return (
                          <Link
                            key={c.id}
                            href={channelHref}
                            prefetch={true}
                            className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition ${
                              isActive
                                ? "bg-white text-black font-bold shadow-md"
                                : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Hash
                                className={`h-3.5 w-3.5 shrink-0 ${
                                  isActive ? "text-black" : "text-neutral-400"
                                }`}
                              />
                              <span className="truncate">{c.name}</span>
                            </div>
                            {c.unreadCount && c.unreadCount > 0 ? (
                              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold font-mono text-white">
                                {c.unreadCount}
                              </span>
                            ) : null}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Action: Return to Workspace */}
              <div className="pt-3 mt-auto border-t border-neutral-900">
                <Link
                  href={baseUrl}
                  prefetch={true}
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-neutral-800 bg-neutral-900/60 p-2.5 text-xs font-bold text-neutral-200 hover:border-neutral-700 hover:bg-neutral-900 hover:text-white transition shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Return to Workspace</span>
                </Link>
              </div>
            </>
          ) : (
            /* Collapsed Discussions Mode */
            <div className="flex flex-col items-center justify-between h-full py-2">
              <div className="space-y-2">
                <button
                  onClick={() => setSearchDialogOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-neutral-400 hover:text-white transition"
                  title="Search Discussions"
                >
                  <Search className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openCreateChannelFor(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-neutral-400 hover:text-white transition"
                  title="Create Channel"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Link
                href={baseUrl}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
                title="Return to Workspace"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      ) : (
        /* STANDARD WORKSPACE MODE SIDEBAR */
        <div className="mt-5 flex-1 space-y-6 overflow-y-auto overflow-x-hidden pr-0.5">
          {/* Main Workspace Navigation */}
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
                    prefetch={true}
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

              {/* Discussions Navigation Link */}
              <Link
                href={`${baseUrl}/discussions`}
                prefetch={true}
                title={isCollapsed ? "Discussions" : undefined}
                className={`flex items-center rounded-xl transition ${
                  isCollapsed
                    ? "justify-center p-2.5"
                    : "justify-between px-2.5 py-2 text-xs font-medium"
                } text-neutral-400 hover:bg-neutral-900 hover:text-white`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <MessagesSquare className="h-4 w-4 shrink-0 text-amber-400" />
                  {!isCollapsed && <span>Discussions</span>}
                </div>
                {!isCollapsed && (
                  <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-400">
                    Live
                  </span>
                )}
              </Link>
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
                    prefetch={true}
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
      )}

      <CreateProjectDialog
        workspaceId={workspaceId}
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
      />

      <CreateChannelDialog
        workspaceId={workspaceId}
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        isOpen={createChannelOpen}
        onClose={() => setCreateChannelOpen(false)}
        projects={projects}
        defaultProjectId={targetProjectIdForChannel}
      />

      <DiscussionSearchDialog
        workspaceId={workspaceId}
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        isOpen={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
      />
    </aside>
  );
}
