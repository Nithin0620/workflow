"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function JourneyFooter() {
  return (
    <section className="relative overflow-hidden border-t border-neutral-900 bg-black px-6 py-20 text-white">
      <div
        aria-hidden
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(600px at 50% 0%, hsl(262 90% 55% / 0.25), transparent 60%)" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative mx-auto max-w-3xl text-center space-y-6"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-[11px] font-mono uppercase tracking-widest text-neutral-300">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          Shape the roadmap
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent">
          Want a feature pushed up the list?
        </h2>
        <p className="mx-auto max-w-xl text-sm sm:text-base text-neutral-400 leading-relaxed">
          Tell us what matters most to your team. Every request helps us decide what ships next.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-black shadow-lg shadow-white/10 transition hover:bg-neutral-200"
          >
            <span>Request a Feature</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.06]"
          >
            <span>Back to Home</span>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
