"use client";

import { motion } from "framer-motion";
import { CheckCircle2, BarChart3, Terminal, Database, MessageSquare, Kanban } from "lucide-react";

export function AnimatedSaasObjects() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Container to restrict random floating inside the hero area */}
      <div className="absolute inset-0 max-w-6xl mx-auto h-[600px] relative">

        {/* Kanban Card */}
        <motion.div
          initial={{ opacity: 0, y: 50, rotate: -5 }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
            y: [-10, 10, -10],
            scale: [1, 1.02, 1],
            rotate: [-5, -2, -5],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[15%] left-[5%] sm:left-[10%] rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 shadow-xl backdrop-blur-md w-40"
        >
          <div className="flex items-center gap-2 mb-2">
            <Kanban className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-mono text-neutral-400 font-semibold">T-101</span>
          </div>
          <div className="h-2 w-full bg-neutral-700 rounded-full mb-1"></div>
          <motion.div animate={{ width: ["0%", "66%", "66%", "0%"] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="h-2 bg-neutral-700 rounded-full mb-2" />
          <div className="flex justify-between items-center mt-2 border-t border-neutral-800 pt-2">
            <div className="h-4 w-4 rounded-full bg-blue-500/20 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            </div>
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          </div>
        </motion.div>

        {/* Analytics Chart Box */}
        <motion.div
          initial={{ opacity: 0, y: -20, rotate: 5 }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
            y: [10, -10, 10],
            rotate: [5, 8, 5],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute top-[20%] right-[5%] sm:right-[15%] rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 shadow-xl backdrop-blur-md w-36"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-neutral-300">Velocity</span>
            <BarChart3 className="w-3 h-3 text-purple-400" />
          </div>
          <div className="flex items-end gap-1.5 h-10">
            <motion.div animate={{ height: ["20%", "40%", "30%", "20%"] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="w-full bg-purple-500/30 rounded-t-sm" />
            <motion.div animate={{ height: ["40%", "70%", "50%", "40%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} className="w-full bg-purple-500/50 rounded-t-sm" />
            <motion.div animate={{ height: ["60%", "100%", "80%", "60%"] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} className="w-full bg-purple-500/80 rounded-t-sm" />
            <motion.div animate={{ height: ["50%", "85%", "70%", "50%"] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }} className="w-full bg-purple-400 rounded-t-sm" />
          </div>
        </motion.div>

        {/* Terminal/Code Snippet */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            x: [0, 15, 0],
            y: [0, -5, 0],
            scale: [1, 1.01, 1],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute bottom-[20%] left-[2%] sm:left-[15%] rounded-lg border border-neutral-800 bg-black p-3 shadow-2xl w-48"
        >
          <div className="flex items-center gap-1.5 mb-2 border-b border-neutral-800 pb-2">
            <div className="h-2 w-2 rounded-full bg-red-500"></div>
            <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <Terminal className="w-3 h-3 text-neutral-500 ml-auto" />
          </div>
          <div className="space-y-1">
            <motion.div animate={{ opacity: [0, 1, 1, 1], display: ["none", "block", "block", "none"] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.1, 0.9, 1] }} className="text-[10px] font-mono text-pink-400">const<span className="text-neutral-300"> sprint = </span><span className="text-blue-300">useSprint();</span></motion.div>
            <motion.div animate={{ opacity: [0, 1, 1, 1], display: ["none", "none", "block", "none"] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.4, 0.5, 1] }} className="text-[10px] font-mono text-neutral-300">await sprint.ship();</motion.div>
            <motion.div animate={{ opacity: [0, 1, 1, 1], display: ["none", "none", "block", "none"] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.7, 0.8, 1] }} className="text-[10px] font-mono text-emerald-400">&gt; Deployed successfully 🚀</motion.div>
          </div>
        </motion.div>

        {/* Database Node */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0.4, 0.9, 0.4],
            scale: [0.9, 1.05, 0.9],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          className="absolute bottom-[25%] right-[8%] sm:right-[20%] flex flex-col items-center gap-1"
        >
          <div className="rounded-full border border-neutral-700 bg-neutral-900/80 p-2 shadow-lg backdrop-blur-md">
            <Database className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="rounded-full bg-emerald-500/20 px-2 py-0.5 border border-emerald-500/30">
            <span className="text-[8px] font-mono text-emerald-400 font-bold tracking-widest flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SYNCED
            </span>
          </div>
        </motion.div>

        {/* Whiteboard Node */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{
            opacity: [0.3, 0.7, 0.3],
            x: [10, -5, 10],
            rotate: [-2, 2, -2],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
          className="absolute top-[40%] right-[30%] rounded-xl border border-neutral-700 bg-neutral-900/80 p-3 shadow-lg backdrop-blur-md w-36"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-orange-400" />
            <span className="text-[10px] font-medium text-neutral-300">Whiteboard Session</span>
          </div>
          <div className="flex justify-between items-end gap-1 mt-3">
             <div className="w-6 h-6 rounded-md bg-orange-500/20 border border-orange-500/30" />
             <div className="w-8 h-8 rounded-md bg-orange-500/40 border border-orange-500/50 transform rotate-12" />
             <div className="w-5 h-5 rounded-full bg-blue-500/30 border border-blue-500/50" />
          </div>
        </motion.div>

        {/* Real-time Discussion Bubble */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: [0, 0.9, 0],
            y: [-10, -30, -50],
            scale: [0.9, 1.05, 0.95],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
          className="absolute bottom-[45%] left-[30%] rounded-2xl rounded-bl-sm border border-neutral-700 bg-neutral-800/90 px-3 py-2 shadow-xl backdrop-blur-md flex items-center gap-2 max-w-[200px]"
        >
          <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
             <span className="text-[8px] font-bold text-white">JD</span>
          </div>
          <div className="space-y-1 w-full">
            <div className="h-1.5 w-full bg-neutral-600 rounded-full" />
            <div className="h-1.5 w-2/3 bg-neutral-600 rounded-full" />
          </div>
        </motion.div>

        {/* Notification Bubble */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{
            opacity: [0, 0.8, 0],
            y: [20, -10, -30],
            scale: [0.8, 1, 0.9],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
          className="absolute top-[35%] left-[25%] rounded-full border border-neutral-700 bg-neutral-800/80 px-3 py-1.5 shadow-lg backdrop-blur-md flex items-center gap-2"
        >
          <MessageSquare className="w-3 h-3 text-neutral-300" />
          <span className="text-[10px] font-medium text-white">@jules assigned you a task</span>
        </motion.div>

      </div>
    </div>
  );
}
