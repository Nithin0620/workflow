"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, GitBranch, Workflow, Map, KeyRound, ArrowRight, ClipboardCheck } from "lucide-react";

const showcase = [
  { icon: Sparkles, name: "AI Assistant", hue: 262 },
  { icon: GitBranch, name: "Git Integrations", hue: 210 },
  { icon: Workflow, name: "Automation", hue: 160 },
  { icon: Map, name: "Roadmaps", hue: 190 },
  { icon: ClipboardCheck, name: "Decision Log", hue: 315 },
  { icon: KeyRound, name: "Secret Vault", hue: 350 },
];

export function PlannedJourneysShowcase() {
  return (
    <section id="planned-journeys" className="relative overflow-hidden bg-black dark:bg-white text-white px-6 py-24 border-t border-neutral-900 dark:border-neutral-100">
      {/* ambient glow */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(700px at 80% 0%, hsl(262 90% 55% / 0.25), transparent 60%)" }}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-10">
          {/* Left: copy + CTA */}
          <div className="max-w-md space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-white dark:border-black/15 bg-white dark:bg-black/[0.03] px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
              <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-black animate-pulse" />
              The Road Ahead
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent">
              Planned Journeys
            </h2>
            <p className="text-sm sm:text-base text-neutral-400 dark:text-neutral-600 leading-relaxed">
              A glimpse of everything we&apos;re engineering next — AI, automation, roadmaps,
              and secure infrastructure.
            </p>
            <Link
              href="/planned-journey"
              className="group inline-flex items-center gap-2 rounded-xl bg-white dark:bg-black px-6 py-3.5 text-sm font-bold text-black dark:text-white shadow-lg shadow-white/10 transition hover:bg-neutral-200 dark:hover:bg-neutral-800"
            >
              <span>Explore All Journeys</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Right: floating mini cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1 max-w-2xl">
            {showcase.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.name}
                  animate={{ x: [0, 6, -6, 0], y: [0, -8, 8, 0] }}
                  transition={{ duration: 6 + (i % 3) * 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                  whileHover={{ x: 0, y: 0, scale: 1.05, transition: { duration: 0.3 } }}
                  className="group cursor-pointer rounded-2xl border border-white dark:border-black/10 bg-white dark:bg-black/[0.04] p-4 backdrop-blur-sm"
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white dark:border-black/10"
                    style={{ background: `hsl(${s.hue} 70% 50% / 0.12)`, color: `hsl(${s.hue} 85% 70%)` }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-2.5 text-xs font-bold text-white dark:text-black">{s.name}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
