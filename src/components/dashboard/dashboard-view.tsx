"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog";
import { Logo } from "@/components/common/logo";
import { BannerStrip } from "@/components/banners/banner-strip";
import { TourReplayButton } from "@/components/onboarding/onboarding-tour";
import {
  FolderKanban,
  Building2,
  Plus,
  ArrowRight,
  Smartphone,
  HardDrive,
  KeyRound,
  Users,
  LogOut,
  Sparkles,
  ExternalLink,
  MessagesSquare,
  MessageSquare,
  Hash,
  Megaphone,
  ArrowUpRight,
  GitBranch,
  Workflow,
  BarChart3,
  BookOpen,
  Map,
  Clock,
  Webhook,
  Calendar,
  Shield,
  ClipboardCheck,
  PenTool,
} from "lucide-react";

interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  role: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  _count?: {
    projects: number;
    members: number;
    discussionChannels?: number;
  };
  banners?: { id: string; imageUrl: string }[];
}

interface ActiveDiscussionChannel {
  id: string;
  name: string;
  topic?: string | null;
  type: "TEXT" | "ANNOUNCEMENT";
  workspaceName: string;
  workspaceSlug: string;
  orgSlug: string;
  projectName?: string | null;
  projectKey?: string | null;
  messageCount: number;
  lastMessage?: {
    content: string;
    authorName: string | null;
    createdAt: string;
  } | null;
}

interface DashboardViewProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  workspaces: WorkspaceData[];
  activeDiscussions?: ActiveDiscussionChannel[];
}

export function DashboardView({
  user,
  organization,
  workspaces,
  activeDiscussions = [],
}: DashboardViewProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const totalProjects = workspaces.reduce(
    (acc, w) => acc + (w._count?.projects || 0),
    0
  );
  const totalMembers = workspaces.reduce(
    (acc, w) => acc + (w._count?.members || 0),
    0
  );
  const totalChannels = workspaces.reduce(
    (acc, w) => acc + (w._count?.discussionChannels || 2),
    0
  );

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-neutral-900 bg-black/90 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="h-7 w-7 shrink-0" />
            <span className="text-base font-bold tracking-tight text-white">
              Workflow
            </span>
          </Link>

          <span className="text-neutral-700">/</span>

          <div className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-xs font-semibold text-neutral-300">
            <Building2 className="h-3.5 w-3.5 text-neutral-500" />
            <span>{organization.name}</span>
          </div>
        </div>

        {/* User profile & Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-extrabold text-white">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-white">
                {user.name || "My Account"}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                {user.email}
              </div>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-950 p-2 text-xs text-neutral-400 hover:border-neutral-700 hover:text-white transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Hub Content */}
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {/* Welcome Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-900 pb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {user.name ? user.name.split(" ")[0] : "Developer"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-neutral-400">
              Select a workspace to manage issues, sprints, discussions, or configure servers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateDialogOpen(true)}
              data-tour="create-workspace"
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black shadow-lg shadow-white/10 hover:bg-neutral-200 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Create Workspace</span>
            </button>
            <TourReplayButton tourId="dashboard" />
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" data-tour="dash-stats">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              Workspaces
            </span>
            <div className="text-2xl font-black text-white">{workspaces.length}</div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              Active Projects
            </span>
            <div className="text-2xl font-black text-white">{totalProjects}</div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              Discussions & Channels
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white">{totalChannels}</span>
              <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-mono font-bold text-amber-400 uppercase">
                Live Sync
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              Database
            </span>
            <div className="flex items-center gap-1.5 pt-1 text-xs font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Supabase Connected</span>
            </div>
          </div>
        </div>

        {/* Section 1: Your Workspaces */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 font-mono">
              Available Workspaces ({workspaces.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-tour="workspaces-grid">
            {workspaces.map((ws) => {
              const wsUrl = `/${ws.organization.slug}/${ws.slug}`;
              const discussionsUrl = `${wsUrl}/discussions`;
              return (
                <div
                  key={ws.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-950 p-5 transition duration-200 hover:border-neutral-600 hover:bg-neutral-900/60 shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Link
                        href={wsUrl}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 group-hover:border-neutral-700 group-hover:bg-white group-hover:text-black transition"
                      >
                        <FolderKanban className="h-5 w-5" />
                      </Link>

                      <div className="flex items-center gap-2">
                        <Link
                          href={discussionsUrl}
                          className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-[11px] font-mono font-semibold text-neutral-300 hover:border-neutral-700 hover:text-white transition"
                          title="Open workspace discussions"
                        >
                          <MessagesSquare className="h-3 w-3 text-amber-400" />
                          <span>Chat</span>
                        </Link>
                        <span className="rounded-full bg-neutral-900 border border-neutral-800 px-2.5 py-0.5 text-[10px] font-mono font-bold text-neutral-400">
                          {ws.role}
                        </span>
                      </div>
                    </div>

                    <div>
                      <Link href={wsUrl}>
                        <h3 className="text-base font-bold text-white group-hover:text-white transition hover:underline">
                          {ws.name}
                        </h3>
                      </Link>
                      <p className="mt-1 font-mono text-xs text-neutral-500">
                        /{ws.organization.slug}/{ws.slug}
                      </p>
                      {ws.description && (
                        <p className="mt-2 text-xs text-neutral-400 line-clamp-2">
                          {ws.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <BannerStrip imageUrls={ws.banners?.map((b) => b.imageUrl) || []} />

                  <div className="mt-6 flex items-center justify-between border-t border-neutral-900 pt-3 text-xs text-neutral-400">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span>{ws._count?.projects ?? 0} Projects</span>
                      <span>•</span>
                      <span>{ws._count?.discussionChannels ?? 2} Channels</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={discussionsUrl}
                        className="flex items-center gap-1 font-semibold text-neutral-400 hover:text-white transition text-xs"
                      >
                        <Hash className="h-3 w-3" />
                        <span>Discussions</span>
                      </Link>
                      <Link
                        href={wsUrl}
                        className="flex items-center gap-1 font-bold text-white group-hover:translate-x-1 transition"
                      >
                        <span>Open</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Create New Workspace Card */}
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 p-6 text-center transition hover:border-neutral-600 hover:bg-neutral-950"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-neutral-400 mb-2">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-white">Create New Workspace</span>
              <span className="text-[11px] text-neutral-500 mt-0.5">
                Add an engineering, product, or design team
              </span>
            </button>
          </div>
        </div>

        {/* Section 2: Active Discussion Groups */}
        <div className="space-y-4 pt-6 border-t border-neutral-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 font-mono">
                Active Discussion Groups ({activeDiscussions.length})
              </h2>
              <span className="flex items-center gap-1 rounded-full border border-emerald-900/40 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Hub
              </span>
            </div>

            {workspaces[0] && (
              <Link
                href={`/${workspaces[0].organization.slug}/${workspaces[0].slug}/discussions`}
                className="text-xs font-semibold text-neutral-400 hover:text-white transition flex items-center gap-1"
              >
                <span>Go to Discussions</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {activeDiscussions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 p-8 text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-neutral-500">
                <MessageSquare className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-neutral-300">
                No discussion channels yet
              </p>
              <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                Channels are automatically generated when you open a workspace's discussions hub.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeDiscussions.map((channel) => {
                const channelUrl = `/${channel.orgSlug}/${channel.workspaceSlug}/discussions/${channel.id}`;
                const isAnnouncement = channel.type === "ANNOUNCEMENT";

                return (
                  <Link
                    key={channel.id}
                    href={channelUrl}
                    className="group relative flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-950 p-5 transition duration-200 hover:border-neutral-600 hover:bg-neutral-900/60 shadow-lg"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 group-hover:border-neutral-700 group-hover:bg-white group-hover:text-black transition">
                          {isAnnouncement ? (
                            <Megaphone className="h-4 w-4 text-amber-400 group-hover:text-black" />
                          ) : (
                            <Hash className="h-4 w-4 text-neutral-300 group-hover:text-black" />
                          )}
                        </div>

                        <span className="rounded-full bg-neutral-900 border border-neutral-800 px-2.5 py-0.5 text-[10px] font-mono text-neutral-400">
                          {channel.workspaceName}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white font-mono group-hover:underline">
                            #{channel.name}
                          </h3>
                          {channel.projectName && (
                            <span className="rounded border border-neutral-800 bg-neutral-900/60 px-1.5 py-0.5 text-[9px] font-mono text-neutral-400">
                              {channel.projectName}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                          {channel.topic ||
                            (channel.projectName
                              ? `Project discussion channel for ${channel.projectName}`
                              : "Workspace team channel for discussions & threads")}
                        </p>
                      </div>
                    </div>

                    {/* Last activity / message snippet */}
                    <div className="mt-5 border-t border-neutral-900 pt-3 flex items-center justify-between text-xs text-neutral-400">
                      <div className="text-[11px] text-neutral-500 truncate max-w-[180px]">
                        {channel.lastMessage ? (
                          <span>
                            <span className="text-neutral-300 font-medium">
                              {channel.lastMessage.authorName?.split(" ")[0] || "User"}:{" "}
                            </span>
                            {channel.lastMessage.content}
                          </span>
                        ) : (
                          <span>{channel.messageCount} messages</span>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white group-hover:translate-x-1 transition shrink-0">
                        <span>Join</span>
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 3: Platform & Capabilities (Hub for upcoming features) */}
        <div className="space-y-8 pt-6 border-t border-neutral-900" data-tour="infra">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 font-mono">
              Platform & Capabilities
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Everything Workflow ships — what&apos;s live today and what&apos;s coming next.
            </p>
          </div>

          {/* Active */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Active
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Live and available in your workspaces right now.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Active: Discussions */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300">
                    <MessagesSquare className="h-4 w-4" />
                  </div>
                  <span className="rounded-md border border-emerald-900/40 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                    Active
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Discussions</h4>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Real-time threads with connected servers, team members, and all workspaces.
                  </p>
                </div>
              </div>

              {/* Active: Workspace Collaboration */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="rounded-md border border-emerald-900/40 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                    Active
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Workspace Collaboration</h4>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Shared boards, live cursors, and roles for seamless team collaboration.
                  </p>
                </div>
              </div>

              {/* Active: Collaborative Whiteboards */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300">
                    <PenTool className="h-4 w-4" />
                  </div>
                  <span className="rounded-md border border-emerald-900/40 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                    Active
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Collaborative Whiteboards</h4>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Infinite canvas for real-time architecture, flowcharts, and visual brainstorming.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Infrastructure & Services */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
                Infrastructure & Services
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Storage, security, and platform plumbing on the roadmap.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Coming Soon: Storage Services */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300">
                    <HardDrive className="h-4 w-4" />
                  </div>
                  <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                    Coming Soon
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Storage Services</h4>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Object storage for files, assets, and backups with versioning and shared links.
                  </p>
                </div>
              </div>

              {/* Coming Soon: Secret Services */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                    Coming Soon
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Secret Services</h4>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Encrypted vault for API keys, tokens, and credentials shared securely across members.
                  </p>
                </div>
              </div>

              {/* Coming Soon: Webhooks & API */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300">
                    <Webhook className="h-4 w-4" />
                  </div>
                  <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                    Coming Soon
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Webhooks & API</h4>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Connect Workflow with external services and build custom integrations using APIs and webhooks.
                  </p>
                </div>
              </div>

              {/* Coming Soon: Mobile Native App */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                    Coming Soon
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Mobile Native App</h4>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Native iOS and Android apps to manage workspaces, tasks, and updates from anywhere.
                  </p>
                </div>
              </div>

              {/* Coming Soon: Audit & Security */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                    Coming Soon
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Audit & Security</h4>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Monitor workspace activity, permission changes, authentication events, and security logs.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Planned Features */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
                Planned Features
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Product tools and integrations coming to your workflow.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Coming Soon: AI Workspace Assistant */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                    Coming Soon
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">AI Workspace Assistant</h4>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Ask questions, summarize projects, generate tasks, and surface blockers using your workspace context.
                  </p>
                </div>
              </div>

              {/* Coming Soon: Git Integrations */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300">
                    <GitBranch className="h-4 w-4" />
                  </div>
                  <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                    Coming Soon
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Git Integrations</h4>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Connect repositories, commits, pull requests, and branches directly to issues and projects.
                  </p>
                </div>
              </div>

              {/* Coming Soon: Workflow Automation */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300">
                    <Workflow className="h-4 w-4" />
                  </div>
                  <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                    Coming Soon
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Workflow Automation</h4>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Automate repetitive actions with triggers, conditions, and actions across your workspace.
                  </p>
                </div>
              </div>

              {/* Coming Soon: Analytics & Insights */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                    Coming Soon
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Analytics & Insights</h4>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Track project velocity, cycle time, workload, bottlenecks, and team activity.
                  </p>
                </div>
              </div>

              {/* Coming Soon: Knowledge Base */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                    Coming Soon
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Knowledge Base</h4>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Create and organize technical documentation, guides, and team knowledge alongside projects.
                  </p>
                </div>
              </div>

              {/* Coming Soon: Roadmaps */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300">
                    <Map className="h-4 w-4" />
                  </div>
                  <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                    Coming Soon
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Roadmaps</h4>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Plan milestones, initiatives, dependencies, and long-term project goals visually.
                  </p>
                </div>
              </div>

              {/* Coming Soon: Time Tracking */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                    Coming Soon
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Time Tracking</h4>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Track time spent on issues and projects with activity-based work logs.
                  </p>
                </div>
              </div>

              {/* Coming Soon: Calendar & Scheduling */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                    Coming Soon
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Calendar & Scheduling</h4>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Sync deadlines, milestones, meetings, and task schedules with your calendar.
                  </p>
                </div>
              </div>

              {/* Coming Soon: Decision Log */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300">
                    <ClipboardCheck className="h-4 w-4" />
                  </div>
                  <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                    Coming Soon
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Decision Log</h4>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Capture important technical decisions from discussions and keep them connected to projects and issues.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create Workspace Dialog */}
      <CreateWorkspaceDialog
        orgId={organization.id}
        orgSlug={organization.slug}
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </div>
  );
}
