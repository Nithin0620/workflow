import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { PublicNavbar } from "@/components/common/public-navbar";
import { AnimatedSaasObjects } from "@/components/home/animated-saas-objects";
import { MacKanbanMockup } from "@/components/home/mac-kanban-mockup";


import {
  Kanban,
  Zap,
  ShieldCheck,
  Command,
  ArrowRight,
  CheckCircle2,
  Users,
  Sparkles,
  BarChart3,
  Layers,
  ChevronRight,
  Laptop,
  FolderKanban,
} from "lucide-react";

export default async function LandingPage() {
  const user = await getCurrentUser();

  const userWorkspaceUrl =
    user?.workspaceMembers[0]?.workspace?.organization
      ? `/${user.workspaceMembers[0].workspace.organization.slug}/${user.workspaceMembers[0].workspace.slug}`
      : null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* 1. TOP NAV - PURE BLACK */}
      <PublicNavbar theme="dark" workspaceUrl={userWorkspaceUrl} />

      {/* 2. HERO SECTION - PURE BLACK */}
      <section className="relative overflow-hidden bg-black px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <AnimatedSaasObjects />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[600px] rounded-full bg-white/5 blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-4xl text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950 px-3.5 py-1.5 text-xs text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            <span>Workflow — Built for High-Velocity Product Teams</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] text-white">
            The real-time workspace for modern engineering.
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-neutral-400 leading-relaxed">
            Manage issues, sprint cycles, and cross-team roadmaps with keyboard-first speed,
            instant drag-and-drop Kanban, and real-time collaboration.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-black shadow-lg shadow-white/10 transition hover:bg-neutral-200"
              >
                <span>Go to Dashboard & Workspaces</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-black shadow-lg shadow-white/10 transition hover:bg-neutral-200"
              >
                <span>Create Free Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            <Link
              href="/how-it-works"
              className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-900"
            >
              <span>See How It Works</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Quick Workspaces Section for logged in users */}
          {user && user.workspaceMembers.length > 0 && (
            <div className="pt-6">
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-bold mb-3">
                Your Active Workspaces
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {user.workspaceMembers.map((m) => {
                  const wsUrl = `/${m.workspace.organization.slug}/${m.workspace.slug}`;
                  return (
                    <Link
                      key={m.id}
                      href={wsUrl}
                      className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-2 text-xs font-semibold text-white hover:border-neutral-600 hover:bg-neutral-900 transition"
                    >
                      <FolderKanban className="h-3.5 w-3.5 text-neutral-400" />
                      <span>{m.workspace.name}</span>
                      <span className="font-mono text-[10px] text-neutral-500">
                        ({m.workspace.slug})
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Keyboard Hint */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-neutral-500 font-mono">
            <span>Press</span>
            <kbd className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-neutral-300 font-semibold">
              ⌘K
            </kbd>
            <span>anywhere for instant Command Palette</span>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE MOCKUP - PURE BLACK */}
      <MacKanbanMockup />

      {/* 4. DOMAIN HIERARCHY - PURE WHITE SECTION */}
      <section id="hierarchy" className="bg-white text-black px-6 py-24 border-t border-neutral-200">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 font-mono">
              DOMAIN HIERARCHY
            </h2>
            <p className="text-3xl sm:text-5xl font-extrabold text-black tracking-tight">
              Built for engineering teams that scale.
            </p>
            <p className="text-sm text-neutral-600 max-w-xl mx-auto">
              Clean separation of concerns from top-level companies to individual ticket discussions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-neutral-200 bg-[#fbfbfb] p-6 space-y-3 hover:border-black hover:bg-white transition hover:shadow-lg">
              <div className="h-8 w-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="text-base font-bold text-black">Organization</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Top-level governance and billing boundary for your entire company (e.g. Acme Corp).
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-[#fbfbfb] p-6 space-y-3 hover:border-black hover:bg-white transition hover:shadow-lg">
              <div className="h-8 w-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="text-base font-bold text-black">Workspace</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Dedicated team spaces (e.g. Engineering, Mobile, DevOps) with custom members and RBAC.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-[#fbfbfb] p-6 space-y-3 hover:border-black hover:bg-white transition hover:shadow-lg">
              <div className="h-8 w-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="text-base font-bold text-black">Project</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Codebases or initiatives with unique keys (e.g. <span className="font-mono font-bold text-black">TRIP</span>, <span className="font-mono font-bold text-black">DEV</span>).
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-[#fbfbfb] p-6 space-y-3 hover:border-black hover:bg-white transition hover:shadow-lg">
              <div className="h-8 w-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs">
                4
              </div>
              <h3 className="text-base font-bold text-black">Issue & Tasks</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Atomic tasks with Markdown discussions, @mentions, story points, and activity logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FEATURES GRID - PURE WHITE SECTION */}
      <section id="features" className="bg-[#f7f7f7] text-black px-6 py-24 border-t border-neutral-200">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 font-mono">
              FEATURES
            </h2>
            <p className="text-3xl sm:text-5xl font-extrabold text-black tracking-tight">
              Crafted for velocity & clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-3 hover:border-black transition hover:shadow-md">
              <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center">
                <Kanban className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-black">Fractional Kanban Engine</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Instant drag-and-drop powered by fractional float indexing. Only 1 row updates in PostgreSQL on card drag.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-3 hover:border-black transition hover:shadow-md">
              <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center">
                <Command className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-black">Command Palette (⌘K)</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Navigate anywhere, jump to projects, and run actions instantly without ever leaving your keyboard.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-3 hover:border-black transition hover:shadow-md">
              <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-black">Granular RBAC Security</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Owner, Admin, Member, and Viewer roles with strict server-side boundary validation on every mutation.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-3 hover:border-black transition hover:shadow-md">
              <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-black">Multi-Provider Auth</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Sign in with Google, GitHub, or secure Email + Password salted with 12 rounds of bcrypt.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-3 hover:border-black transition hover:shadow-md">
              <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-black">Velocity & Analytics</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Live metrics on sprint throughput, completion rates, bottleneck alerts, and active team workload.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-3 hover:border-black transition hover:shadow-md">
              <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center">
                <FolderKanban className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-black">Multi-Project Management</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Spin up codebases with custom issue sequence counters, color accents, and dedicated lead assignments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PAID SERVICES & ENTERPRISE ENQUIRY BANNER */}
      <section className="bg-black text-white px-6 py-20 border-t border-neutral-900">
        <div className="mx-auto max-w-5xl rounded-3xl border border-neutral-800 bg-neutral-950 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          <div className="space-y-4 max-w-xl text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs font-mono text-neutral-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>PAID SERVICE & CONSULTING</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Need custom private hosting or dedicated enterprise setup?
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              We provide tailored on-premise deployments, SSO SAML integration, custom Jira/Linear migrations, and dedicated SLA engineering support.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto shrink-0">
            <Link
              href="/contact"
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs sm:text-sm font-bold text-black shadow-xl hover:bg-neutral-200 transition"
            >
              <span>Start Enquiry</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. CALL TO ACTION - PURE WHITE */}
      <section className="bg-white text-black px-6 py-20 border-t border-neutral-200 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h3 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
            Build and ship software with Workflow.
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600">
            Join modern product engineering teams using fast, keyboard-first issue management.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl bg-black px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl hover:bg-neutral-800 transition"
            >
              <span>Get Started for Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-neutral-300 bg-white px-6 py-3.5 text-xs sm:text-sm font-bold text-black hover:border-black transition"
            >
              <span>Contact Sales</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FOOTER - PURE BLACK */}
      <footer className="border-t border-neutral-900 bg-black px-6 py-16 text-white">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-black font-black text-xs">
              W
            </div>
            <span className="text-sm font-bold text-white">Workflow</span>
            <span className="text-xs text-neutral-500">© 2026. Built with Next.js & PostgreSQL.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-neutral-400">
            <Link href="/how-it-works" className="hover:text-white transition">
              How It Works
            </Link>
            <Link href="/contact" className="hover:text-white transition">
              Contact & Enquiry
            </Link>
            <Link href="/login" className="hover:text-white transition">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-white transition font-bold text-white">
              Create Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
