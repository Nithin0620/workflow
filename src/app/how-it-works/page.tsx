import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { PublicNavbar } from "@/components/common/public-navbar";
import {
  ArrowRight,
  CheckCircle2,
  Users,
  FolderKanban,
  Kanban,
  MessageSquare,
  Command,
  ShieldCheck,
  Zap,
  Terminal,
  Layers,
  Sparkles,
  GitBranch,
} from "lucide-react";

export default async function HowItWorksPage() {
  const user = await getCurrentUser();

  const userWorkspaceUrl =
    user?.workspaceMembers[0]?.workspace?.organization
      ? `/${user.workspaceMembers[0].workspace.organization.slug}/${user.workspaceMembers[0].workspace.slug}`
      : null;
  const steps = [
    {
      number: "01",
      title: "Sign Up & Multi-Tenant Auto-Provisioning",
      icon: Users,
      description:
        "When you sign up using Google, GitHub, or Email/Password, Workflow automatically creates your Organization and a default 'General Workspace' in a single ACID transaction. You start with the OWNER role.",
      details: [
        "One-click OAuth or bcrypt salted credentials",
        "Instant default workspace provisioning",
        "Customizable workspace slugs and team settings",
      ],
    },
    {
      number: "02",
      title: "Create Projects & Unique Issue Keys",
      icon: FolderKanban,
      description:
        "Create distinct projects for each codebase or initiative (e.g. 'TripTally' with key TRIP or 'Mobile App' with key APP). All issues automatically increment cleanly (e.g. TRIP-101, TRIP-102).",
      details: [
        "Unique 2-6 character project prefix keys",
        "Custom color accents and lead assignments",
        "Independent issue numbering sequences",
      ],
    },
    {
      number: "03",
      title: "Interactive Drag & Drop Kanban",
      icon: Kanban,
      description:
        "Manage tasks across 6 engineering stages (Backlog, To Do, In Progress, In Review, Done, Canceled). Moving cards updates the UI instantly with 0ms latency thanks to fractional indexing.",
      details: [
        "6 standard engineering workflow stages",
        "Fractional float ordering (single-row DB writes)",
        "Instant search & assignee filter toolbar",
      ],
    },
    {
      number: "04",
      title: "Deep Collaboration & Audit History",
      icon: MessageSquare,
      description:
        "Click any card to open the slide-over detail panel. Write rich Markdown descriptions, assign story points, tag @teammates, and review the immutable audit trail of who changed what.",
      details: [
        "Markdown editor with formatting preview",
        "Inline property pickers for Priority & Story Points",
        "Immutable chronological Activity History timeline",
      ],
    },
    {
      number: "05",
      title: "Linear-Style Keyboard First Speed",
      icon: Command,
      description:
        "Work without touching your mouse. Press ⌘K or Ctrl+K anywhere to bring up the universal Command Palette to search tickets, jump to projects, and run actions.",
      details: [
        "⌘K / Ctrl+K universal Command Palette",
        "Instant keyboard shortcuts for power developers",
        "Distraction-free high-contrast monochrome design",
      ],
    },
    {
      number: "06",
      title: "Role-Based Access Control (RBAC)",
      icon: ShieldCheck,
      description:
        "Invite team members via email and assign precise roles: Owner, Admin, Member, or Viewer. Every Server Action strictly enforces RBAC guards on the server.",
      details: [
        "Owner: Full workspace and billing control",
        "Admin: Project creation and member management",
        "Member: Create/edit issues and discussions",
        "Viewer: Read-only observation",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* 1. TOP NAVIGATION - PURE BLACK */}
      <PublicNavbar theme="dark" workspaceUrl={userWorkspaceUrl} />

      {/* 2. HERO HEADER - PURE BLACK */}
      <section className="border-b border-neutral-900 bg-black px-6 pt-20 pb-16 text-center space-y-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3.5 py-1 text-xs text-neutral-300 font-mono">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span>DOCUMENTATION & ARCHITECTURE GUIDE</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
            How Workflow Powers Modern Engineering Teams
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            A comprehensive overview of our 4-tier multi-tenant hierarchy, zero-latency fractional indexing, and keyboard-first productivity engine.
          </p>
        </div>
      </section>

      {/* 3. STEP BY STEP GUIDE - ALTERNATING BLACK & WHITE CARDS */}
      <section className="bg-neutral-950 px-6 py-20 border-b border-neutral-900">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center pb-8 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 font-mono">
              LIFECYCLE WALKTHROUGH
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              6 Simple Steps From Setup to Sprint Completion
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isEven = idx % 2 === 1;

              return (
                <div
                  key={step.number}
                  className={`rounded-2xl p-7 space-y-5 transition duration-200 border ${
                    isEven
                      ? "bg-white text-black border-neutral-200 hover:shadow-xl"
                      : "bg-neutral-900 text-white border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900/90"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isEven
                            ? "bg-black text-white"
                            : "bg-white text-black"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            isEven ? "text-neutral-500" : "text-neutral-400"
                          }`}
                        >
                          STEP {step.number}
                        </span>
                        <h3 className="text-base font-bold leading-snug">{step.title}</h3>
                      </div>
                    </div>
                  </div>

                  <p
                    className={`text-xs leading-relaxed ${
                      isEven ? "text-neutral-700" : "text-neutral-300"
                    }`}
                  >
                    {step.description}
                  </p>

                  <div
                    className={`pt-4 border-t space-y-2 text-xs ${
                      isEven
                        ? "border-neutral-200 text-neutral-600"
                        : "border-neutral-800 text-neutral-400"
                    }`}
                  >
                    {step.details.map((detail, dIdx) => (
                      <div key={dIdx} className="flex items-center gap-2">
                        <CheckCircle2
                          className={`h-3.5 w-3.5 shrink-0 ${
                            isEven ? "text-black" : "text-white"
                          }`}
                        />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. UNDER THE HOOD - PURE BLACK TECHNICAL DEEP DIVE */}
      <section className="bg-black text-white px-6 py-24 border-b border-neutral-900">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 font-mono">
              UNDER THE HOOD
            </h2>
            <p className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              High Performance Architecture
            </p>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto">
              Engineered with PostgreSQL transactions, Next.js Turbopack, and NextAuth session guards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-3 hover:border-neutral-700 transition">
              <div className="h-10 w-10 rounded-xl bg-white text-black flex items-center justify-center font-bold">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Fractional Indexing</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Positions are calculated using midpoint floats (P_prev + P_next) / 2, eliminating cascading database locks during card reordering.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-3 hover:border-neutral-700 transition">
              <div className="h-10 w-10 rounded-xl bg-white text-black flex items-center justify-center font-bold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Server-Guarded RBAC</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Role checks happen strictly inside Server Actions (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`), preventing any unauthorized mutations.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-3 hover:border-neutral-700 transition">
              <div className="h-10 w-10 rounded-xl bg-white text-black flex items-center justify-center font-bold">
                <Terminal className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Zero-Config Turbopack</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Sub-second hot-reloads and instant server component renders powered by Next.js 16 with React 19 server transitions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION - PURE WHITE */}
      <section className="bg-white text-black px-6 py-20 border-b border-neutral-200 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h3 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
            Ready to experience high-velocity issue management?
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600">
            Create your account in seconds with Google, GitHub, or Email. Or get in touch for custom enterprise onboarding.
          </p>
          <div className="flex items-center justify-center gap-4">
            {userWorkspaceUrl ? (
              <Link
                href={userWorkspaceUrl}
                className="flex items-center gap-2 rounded-xl bg-black px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl hover:bg-neutral-800 transition"
              >
                <span>Go to Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-xl bg-black px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl hover:bg-neutral-800 transition"
              >
                <span>Create Free Account</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link
              href="/contact"
              className="rounded-xl border border-neutral-300 bg-white px-6 py-3.5 text-xs sm:text-sm font-semibold text-black hover:border-black transition"
            >
              <span>Enterprise Enquiry</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. FOOTER - PURE BLACK */}
      <footer className="border-t border-neutral-900 bg-black px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-black font-black text-xs">
              W
            </div>
            <span className="text-sm font-bold text-white">Workflow</span>
            <span className="text-xs text-neutral-500">© 2026. Built with Next.js & PostgreSQL.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-neutral-400 font-medium">
            <Link href="/" className="hover:text-white transition">
              Home
            </Link>
            <Link href="/contact" className="hover:text-white transition">
              Contact & Support
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
