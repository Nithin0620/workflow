'use client';

import packageInfo from "../../../package.json";
import { motion } from "framer-motion";

export function VersionDisplay() {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none group">
      <div className="relative overflow-hidden rounded-md bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border border-neutral-300 dark:border-neutral-700 shadow-sm opacity-50 group-hover:opacity-100 transition-opacity p-[1px]">
        {/* Animated Laser Border */}
        <motion.div
          className="absolute inset-0 z-0 bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(163,163,163,0.5)_360deg)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        {/* Content Container */}
        <div className="relative z-10 px-2 py-1 rounded-[5px] bg-white dark:bg-neutral-900 h-full w-full flex items-center justify-center">
          <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
            v{packageInfo.version}
          </span>
        </div>
      </div>
    </div>
  );
}
