"use client";

import { motion } from "framer-motion";
import { CheckCircle2, MousePointer2 } from "lucide-react";

export function MacKanbanMockup() {
  return (
    <section className="bg-black dark:bg-white px-6 pb-32 pt-10 overflow-hidden">
      <div className="mx-auto max-w-6xl relative">

        {/* Main Mac Window Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 shadow-2xl shadow-white/5 overflow-hidden ring-1 ring-white/10"
        >
          {/* Mac Window Title Bar */}
          <div className="h-10 bg-neutral-900 dark:bg-neutral-100 border-b border-neutral-800 flex items-center px-4 justify-between">
            {/* Traffic Lights */}
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
              <div className="h-3 w-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
              <div className="h-3 w-3 rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
            </div>

            {/* Window Title */}
            <div className="text-[11px] font-medium text-neutral-400 dark:text-neutral-600 flex items-center gap-2">
              <span className="font-mono bg-neutral-800/50 dark:bg-neutral-200/50 px-2 py-0.5 rounded border border-neutral-700/50 dark:border-neutral-300/50">TripTally [TRIP]</span>
              <span>— Sprint 12</span>
            </div>

            <div className="w-12"></div> {/* Spacer for symmetry */}
          </div>

          {/* App Content */}
          <div className="p-6 bg-[#0a0a0a]">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-neutral-900 dark:border-neutral-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold text-white dark:text-black ml-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync Active
                </span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="h-6 w-6 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center text-[10px] text-blue-400 font-bold">J</div>
                 <div className="h-6 w-6 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center text-[10px] text-purple-400 font-bold -ml-2">A</div>
                 <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-[10px] text-emerald-400 font-bold -ml-2">S</div>
              </div>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">

              {/* Column 1: Backlog */}
              <div className="rounded-xl border border-neutral-900 dark:border-neutral-100 bg-neutral-900/40 dark:bg-neutral-100/40 p-3 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-600">Backlog</span>
                  <span className="rounded-full bg-neutral-800 dark:bg-neutral-200 px-2 py-0.5 text-[10px] font-mono">1</span>
                </div>
                <div className="rounded-lg border border-neutral-800 dark:border-neutral-200 bg-black dark:bg-white p-3 space-y-2 opacity-60">
                  <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-500">TRIP-103</span>
                  <p className="text-xs font-medium text-neutral-400 dark:text-neutral-600">Improve dashboard performance</p>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-900 dark:border-neutral-100 text-[10px] text-neutral-500 dark:text-neutral-500">
                    <span>5 pts</span>
                  </div>
                </div>
              </div>

              {/* Column 2: To Do */}
              <div className="rounded-xl border border-neutral-900 dark:border-neutral-100 bg-neutral-900/40 dark:bg-neutral-100/40 p-3 space-y-3 relative">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-600">To Do</span>
                  <span className="rounded-full bg-neutral-800 dark:bg-neutral-200 px-2 py-0.5 text-[10px] font-mono">1</span>
                </div>

                {/* Empty Drop Zone visually */}
                <div className="h-[90px] rounded-lg border border-dashed border-neutral-800 dark:border-neutral-200 bg-neutral-900/20 dark:bg-neutral-100/20"></div>

              </div>

              {/* Column 3: In Progress */}
              <div className="rounded-xl border border-white dark:border-black/10 bg-neutral-900/60 p-3 space-y-3 ring-1 ring-white/5 relative">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-white dark:text-black flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-black animate-pulse" />
                    In Progress
                  </span>
                  <span className="rounded-full bg-white dark:bg-black text-black font-bold px-2 py-0.5 text-[10px] font-mono">2</span>
                </div>
                <div className="rounded-lg border border-neutral-700 dark:border-neutral-300 bg-black dark:bg-white p-3 space-y-2 shadow-lg">
                  <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-600 font-bold">TRIP-102</span>
                  <p className="text-xs font-semibold text-white dark:text-black">Add payment gateway & webhooks</p>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800 dark:border-neutral-200 text-[10px] text-neutral-400 dark:text-neutral-600">
                    <span className="rounded bg-neutral-800 dark:bg-neutral-200 px-1.5 py-0.5 font-bold text-white dark:text-black">8 pts</span>
                    <span className="h-4 w-4 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center text-[8px] text-purple-400 font-bold">A</span>
                  </div>
                </div>

                {/* Animated Moving Card */}
                <motion.div
                  initial={{ x: "-108%", y: -90, rotate: -2, scale: 1.05 }}
                  animate={{ x: 0, y: 0, rotate: 0, scale: 1 }}
                  transition={{
                    duration: 2,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "reverse",
                    repeatDelay: 1
                  }}
                  whileHover={{ scale: 1.05, boxShadow: "0px 0px 15px rgba(59, 130, 246, 0.5)" }}
                  className="absolute bottom-3 left-3 right-3 rounded-lg border border-blue-500/50 bg-black dark:bg-white p-3 space-y-2 shadow-xl z-10 ring-2 ring-blue-500/20 cursor-grab active:cursor-grabbing"
                >
                  <span className="font-mono text-[10px] text-blue-400 font-bold">TRIP-101</span>
                  <p className="text-xs font-medium text-white dark:text-black">Fix OAuth session refresh on mobile browser</p>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800 dark:border-neutral-200 text-[10px] text-neutral-400 dark:text-neutral-600">
                    <span className="rounded bg-neutral-800 dark:bg-neutral-200 px-1.5 py-0.5 font-bold text-white dark:text-black">3 pts</span>
                    <div className="h-4 w-4 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center text-[8px] text-blue-400 font-bold">J</div>
                  </div>
                </motion.div>

                {/* Animated Cursor */}
                <motion.div
                  initial={{ x: -280, y: -40, opacity: 0 }}
                  animate={{ x: [20, 40, 20], y: [60, 20, 60], opacity: [0, 1, 1, 0] }}
                  transition={{
                    duration: 2,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "reverse",
                    repeatDelay: 1
                  }}
                  className="absolute z-20 top-0 left-0"
                >
                  <MousePointer2 className="w-5 h-5 text-white dark:text-black drop-shadow-md fill-white" />
                  <div className="mt-1 ml-3 px-2 py-0.5 bg-blue-500 text-white dark:text-black text-[9px] font-bold rounded shadow-sm">Jules</div>
                </motion.div>
              </div>

              {/* Column 4: Done */}
              <div className="rounded-xl border border-neutral-900 dark:border-neutral-100 bg-neutral-900/40 dark:bg-neutral-100/40 p-3 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-600">Done</span>
                  <span className="rounded-full bg-neutral-800 dark:bg-neutral-200 px-2 py-0.5 text-[10px] font-mono">1</span>
                </div>
                <div className="rounded-lg border border-neutral-800 dark:border-neutral-200 bg-black dark:bg-white p-3 space-y-2 opacity-50">
                  <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-500">TRIP-99</span>
                  <p className="text-xs font-medium text-neutral-300 dark:text-neutral-700 line-through">Set up PostgreSQL schema</p>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-900 dark:border-neutral-100 text-[10px] text-neutral-500 dark:text-neutral-500">
                    <span>Resolved</span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-white dark:text-black" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>

        {/* Guided Notes Overlays */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="absolute -left-12 top-32 max-w-[200px] hidden lg:block z-30"
        >
          <div className="bg-white dark:bg-black text-black p-3 rounded-lg shadow-xl relative">
            <h4 className="font-bold text-xs mb-1">Instant Drag & Drop</h4>
            <p className="text-[10px] text-neutral-600 dark:text-neutral-400 leading-tight">Fractional indexing updates DB instantly without reordering arrays.</p>
            <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-4 h-4 bg-white dark:bg-black rotate-45"></div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="absolute -right-8 top-16 max-w-[180px] hidden lg:block z-30"
        >
          <div className="bg-blue-500 text-white dark:text-black p-3 rounded-lg shadow-xl relative">
            <h4 className="font-bold text-xs mb-1 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-black animate-pulse" />
              Multiplayer Presence
            </h4>
            <p className="text-[10px] text-blue-100 leading-tight">See exactly who is moving what in real-time via WebSockets.</p>
            <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rotate-45"></div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="absolute right-12 -bottom-6 max-w-[220px] hidden md:block z-30"
        >
          <div className="bg-neutral-800 dark:bg-neutral-200 border border-neutral-700 text-white dark:text-black p-3 rounded-lg shadow-2xl relative">
            <h4 className="font-bold text-xs mb-1">Keyboard First (⌘K)</h4>
            <p className="text-[10px] text-neutral-300 dark:text-neutral-700 leading-tight">Navigate columns, assign users, or log points without touching the mouse.</p>
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-neutral-800 dark:bg-neutral-200 border-t border-l border-neutral-700 dark:border-neutral-300 rotate-45"></div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}