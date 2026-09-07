"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";

interface HeroContentProps {
  user: any;
}

export function HeroContent({ user }: any) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-4xl text-center relative z-10 space-y-6"
    >
      <motion.div variants={item}>
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 px-3.5 py-1.5 text-xs text-neutral-400 dark:text-neutral-600">
          <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-black animate-pulse" />
          <span>Workflow — Built for High-Velocity Product Teams</span>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] text-white dark:text-black">
          The real-time workspace for modern engineering.
        </h1>
      </motion.div>

      <motion.div variants={item}>
        <p className="mx-auto max-w-2xl text-base sm:text-lg text-neutral-400 dark:text-neutral-600 leading-relaxed">
          Manage issues, sprint cycles, and cross-team roadmaps with keyboard-first speed,
          instant drag-and-drop Kanban, and real-time collaboration.
        </p>
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-3 pt-4">
        {user ? (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl bg-white dark:bg-black px-6 py-3.5 text-sm font-bold text-black dark:text-white shadow-lg shadow-white/10 transition hover:bg-neutral-200 dark:hover:bg-neutral-800"
          >
            <span>Go to Dashboard & Workspaces</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-xl bg-white dark:bg-black px-6 py-3.5 text-sm font-bold text-black dark:text-white shadow-lg shadow-white/10 transition hover:bg-neutral-200 dark:hover:bg-neutral-800"
          >
            <span>Create Free Workspace</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}

        <Link
          href="/how-it-works"
          className="flex items-center gap-2 rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 px-6 py-3.5 text-sm font-semibold text-white dark:text-black transition hover:border-neutral-700 hover:bg-neutral-900 dark:hover:bg-neutral-100"
        >
          <span>See How It Works</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </motion.div>

      {/* Quick Workspaces Section for logged in users */}
      {user && user.workspaceMembers.length > 0 && (
        <motion.div variants={item} className="pt-6">
          <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-500 font-bold mb-3">
            Your Active Workspaces
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {user.workspaceMembers.map((m: any) => {
              const wsUrl = `/${m.workspace.organization.slug}/${m.workspace.slug}`;
              return (
                <Link
                  key={m.id}
                  href={wsUrl}
                  className="flex items-center gap-2 rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950/80 dark:bg-neutral-50/80 px-4 py-2 text-xs font-semibold text-white dark:text-black hover:border-neutral-600 hover:bg-neutral-900 dark:hover:bg-neutral-100 transition"
                >
                  <div className="h-4 w-4 rounded bg-neutral-800 dark:bg-neutral-200 text-[9px] flex items-center justify-center font-bold">
                    {m.workspace.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{m.workspace.name}</span>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
