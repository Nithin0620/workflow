"use client";

import { useState, type CSSProperties } from "react";
import {
  motion,
} from "framer-motion";
import {
  Sparkles,
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
  Smartphone,
  HardDrive,
  KeyRound,
  PenTool,
  MessagesSquare,
  Users,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { MobileAppModal } from "./mobile-app-modal";

type Journey = {
  icon: LucideIcon;
  name: string;
  tag: string;
  desc: string;
  hue: number;
  actionText?: string;
  isModalTrigger?: boolean;
};

const categories: { name: string; blurb: string; items: Journey[] }[] = [
  {
    name: "AI & Intelligence",
    blurb: "Copilots and signals that do the thinking for you.",
    items: [
      { icon: Sparkles, name: "AI Workspace Assistant", tag: "Ask · Summarize · Generate", desc: "Context-aware copilot that surfaces blockers and drafts tasks.", hue: 262 },
      { icon: ClipboardCheck, name: "Decision Log", tag: "Decisions · Context", desc: "Capture the why behind every big call.", hue: 315 },
      { icon: Clock, name: "Time Tracking", tag: "Work logs · Estimates", desc: "Activity-based logs with zero manual timing.", hue: 25 },
    ],
  },
  {
    name: "Integrations & Automation",
    blurb: "Connect your tools and let the busywork run itself.",
    items: [
      { icon: Webhook, name: "Webhooks & API", tag: "Integrate · Extend", desc: "Wire Workflow into any external service.", hue: 280 },
      { icon: Workflow, name: "Workflow Automation", tag: "Triggers · Conditions · Actions", desc: "Automate the busywork across your whole workspace.", hue: 160 },
      { icon: Calendar, name: "Calendar & Scheduling", tag: "Deadlines · Meetings", desc: "Sync every milestone with your calendar.", hue: 130 },
    ],
  },
  {
    name: "Planning & Knowledge",
    blurb: "See the long game and keep the context beside the code.",
    items: [
      { icon: Map, name: "Roadmaps", tag: "Milestones · Initiatives", desc: "Plot the long game, then zoom into the week.", hue: 190 },
      { icon: BookOpen, name: "Knowledge Base", tag: "Docs · Guides · Context", desc: "Docs that live beside the work they describe.", hue: 48 },
    ],
  },
  {
    name: "Infrastructure & Security",
    blurb: "The secure plumbing your workspace runs on.",
    items: [
      { icon: HardDrive, name: "Storage Services", tag: "Files · Assets · Backups", desc: "Versioned object storage with shared links.", hue: 10 },
      { icon: KeyRound, name: "Secret Services", tag: "Keys · Tokens · Vault", desc: "Encrypted credentials shared safely.", hue: 350 },
      { icon: Shield, name: "Audit & Security", tag: "Activity · Permissions", desc: "Full visibility into who touched what.", hue: 200 },
    ],
  },
];

const total = categories.reduce((n, c) => n + c.items.length, 0);

const active: Journey[] = [
  {
    icon: Smartphone,
    name: "Mobile Native App",
    tag: "iOS · Android · Active",
    desc: "Your full workspace in your pocket with real-time discussions, kanban boards, whiteboards & push alerts.",
    hue: 142,
    actionText: "Click to know more for now",
    isModalTrigger: true,
  },
  { icon: MessagesSquare, name: "Discussions", tag: "Channels · Threads · Live Sync", desc: "Real-time threads with connected servers, team members, and all workspaces.", hue: 28 },
  { icon: Users, name: "Workspace Collaboration", tag: "Boards · Live Cursors · Roles", desc: "Shared boards, live cursors, and roles for seamless team collaboration.", hue: 250 },
  { icon: PenTool, name: "Collaborative Whiteboards", tag: "Excalidraw · Multi-cursor · Diagrams", desc: "Infinite canvas for real-time architecture, flowcharts, and visual brainstorming.", hue: 170 },
  { icon: Clock, name: "Scheduled Automation & Cron", tag: "Cron · AI Scans · Run Logs", desc: "Automate recurring AI codebase audits, scheduled endpoint scans, and maintenance jobs.", hue: 45 },
  { icon: GitBranch, name: "Git Integrations", tag: "Commits · PRs · Branches", desc: "Link every push straight to issues and projects.", hue: 210 },
  { icon: BarChart3, name: "Analytics & Insights", tag: "Velocity · Cycle · Bottlenecks", desc: "See where time goes and where flow breaks.", hue: 330 },
];

function GlowOrb({ hue, size, delay, style }: { hue: number; size: number; delay: number; style?: CSSProperties }) {
  return (
    <motion.div
      aria-hidden
      animate={{ y: [-30, 30, -30], x: [-15, 15, -15], opacity: [0.25, 0.45, 0.25] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay }}
      className="absolute rounded-full pointer-events-none blur-[90px]"
      style={{
        ...style,
        width: size,
        height: size,
        background: `radial-gradient(circle, hsl(${hue} 90% 60% / 0.5), transparent 70%)`,
      }}
    />
  );
}

function JourneyCard({ j, i, onClick }: { j: Journey; i: number; onClick?: () => void }) {
  const Icon = j.icon;
  const isClickable = !!onClick || !!j.isModalTrigger;

  return (
    <motion.div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (isClickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
      animate={{ y: [0, -10, 0] }}
      whileHover={{ y: 0, scale: 1.04, transition: { duration: 0.3 } }}
      className={`group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 overflow-hidden transition-colors duration-300 hover:border-transparent ${
        isClickable ? "cursor-pointer select-none" : ""
      }`}
      style={{ boxShadow: `0 0 0 1px hsl(${j.hue} 80% 60% / 0) inset` }}
    >
      {/* colored border glow on hover */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px hsl(${j.hue} 85% 65% / 0.5), 0 20px 60px -20px hsl(${j.hue} 90% 60% / 0.4)` }}
      />
      {/* hover radial glow */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"
        style={{ background: `radial-gradient(200px at 50% 0%, hsl(${j.hue} 90% 60% / 0.22), transparent 70%)` }}
      />

      <div className="relative flex items-start justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={{
            background: `linear-gradient(135deg, hsl(${j.hue} 80% 55% / 0.25), hsl(${j.hue} 80% 55% / 0.08))`,
            borderColor: `hsl(${j.hue} 75% 60% / 0.35)`,
            color: `hsl(${j.hue} 90% 78%)`,
            boxShadow: `0 8px 24px -12px hsl(${j.hue} 90% 60% / 0.6)`,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider"
          style={{ background: `hsl(${j.hue} 70% 50% / 0.1)`, color: `hsl(${j.hue} 75% 80%)` }}
        >
          {j.tag}
        </span>
      </div>

      <h3 className="relative mt-4 text-[15px] font-bold text-white flex items-center justify-between">
        <span>{j.name}</span>
        {j.isModalTrigger && (
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
        )}
      </h3>
      <p className="relative mt-1.5 text-xs text-neutral-400 leading-relaxed">{j.desc}</p>

      {/* Action Prompt Pill if specified */}
      {j.actionText && (
        <div className="relative mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>{j.actionText}</span>
          </span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      )}

      {/* shimmer bar on hover */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full"
        style={{ background: `linear-gradient(90deg, transparent, hsl(${j.hue} 85% 65%), transparent)` }}
      />
    </motion.div>
  );
}

export function PlannedJourneys() {
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  return (
    <section id="planned-journeys" className="relative overflow-hidden bg-black text-white">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 h-full w-full object-cover opacity-40 pointer-events-none"
      >
        <source src="/tech-bg.mp4" type="video/mp4" />
      </video>

      <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-5"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-[11px] font-mono uppercase tracking-widest text-neutral-300">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            The Road Ahead
          </span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] bg-gradient-to-b from-white via-white to-neutral-600 bg-clip-text text-transparent">
            Planned Journeys
          </h1>
          <p className="mx-auto max-w-2xl text-sm sm:text-lg text-neutral-400 leading-relaxed">
            Every capability we&apos;re engineering next — the full roadmap of what&apos;s coming
            to Workflow. Hover a card to explore.
          </p>

          {/* stats */}
          <div className="flex items-center justify-center gap-8 pt-2 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{total}</div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Capabilities</div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{categories.length}</div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Categories</div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{active.length}</div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Shipped</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Active / Shipped section */}
      <div className="relative mx-auto max-w-6xl px-6 pb-16 space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4"
        >
          <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400">Active</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/40 to-transparent" />
          <span className="text-[11px] font-mono text-neutral-500">Live in your workspace now</span>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {active.map((j, i) => (
            <JourneyCard
              key={j.name}
              j={j}
              i={i}
              onClick={j.isModalTrigger ? () => setIsMobileModalOpen(true) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Category sections */}
      <div className="relative mx-auto max-w-6xl px-6 pb-24 space-y-16">
        {categories.map((cat) => (
          <div key={cat.name} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-4"
            >
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-200">{cat.name}</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
              <span className="text-[11px] font-mono text-neutral-500">{cat.blurb}</span>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cat.items.map((j, i) => (
                <JourneyCard key={j.name} j={j} i={i} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Demonstrative Modal for Mobile App */}
      <MobileAppModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
      />
    </section>
  );
}
