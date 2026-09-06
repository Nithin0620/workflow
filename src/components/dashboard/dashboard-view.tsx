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
  Server,
  Database,
  GitBranch,
  Shield,
  Users,
  LogOut,
  Sparkles,
  ExternalLink,
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
  };
  banners?: { id: string; imageUrl: string }[];
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
}

export function DashboardView({
  user,
  organization,
  workspaces,
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
              Select a workspace to manage issues, sprints, and projects or configure servers.
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
              Team Members
            </span>
            <div className="text-2xl font-black text-white">{totalMembers}</div>
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
              return (
                <Link
                  key={ws.id}
                  href={wsUrl}
                  className="group relative flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-950 p-5 transition duration-200 hover:border-neutral-600 hover:bg-neutral-900/60 shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 group-hover:border-neutral-700 group-hover:bg-white group-hover:text-black transition">
                        <FolderKanban className="h-5 w-5" />
                      </div>

                      <span className="rounded-full bg-neutral-900 border border-neutral-800 px-2.5 py-0.5 text-[10px] font-mono font-bold text-neutral-400">
                        {ws.role}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-white transition">
                        {ws.name}
                      </h3>
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
                    <div className="flex items-center gap-3">
                      <span>{ws._count?.projects ?? 0} Projects</span>
                      <span>•</span>
                      <span>{ws._count?.members ?? 1} Members</span>
                    </div>

                    <div className="flex items-center gap-1 font-bold text-white group-hover:translate-x-1 transition">
                      <span>Open</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </Link>
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

        {/* Section 2: Infrastructure & Servers (Hub for upcoming expansion) */}
        <div className="space-y-4 pt-6 border-t border-neutral-900" data-tour="infra">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 font-mono">
              Infrastructure & Services
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Connect external servers, deployments, and cloud resources to your workspaces.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Servers Card */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300">
                  <Server className="h-4 w-4" />
                </div>
                <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                  Coming Soon
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Server Management</h4>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  Monitor VPS nodes, container health, and server telemetry directly from your dashboard.
                </p>
              </div>
            </div>

            {/* CI/CD Deployments */}
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
                <h4 className="text-sm font-bold text-white">CI/CD Pipelines</h4>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  Trigger automated builds, preview deployments, and link Git branches to issue tickets.
                </p>
              </div>
            </div>

            {/* Cloud Database */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300">
                  <Database className="h-4 w-4" />
                </div>
                <span className="rounded-md border border-emerald-900/40 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                  Active
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Supabase PostgreSQL</h4>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  Multi-tenant Postgres pooler connected with real-time SSE event bus and zero data lag.
                </p>
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
