"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

export function AnimatedFooter() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.5, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [100, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);

  return (
    <footer
      ref={containerRef}
      className="relative bg-black text-white pt-32 pb-12 overflow-hidden w-full border-t border-neutral-900 mt-auto"
    >
      {/* Background glowing effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[50%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[40%] bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/20 rounded-full"
            style={{
              width: "2px",
              height: "2px",
              top: "50%",
              left: "50%",
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-6 relative z-10 flex flex-col items-center">
        {/* Animated WORKFLOW text */}
        <motion.div
          style={{ opacity, y, scale }}
          className="w-full flex justify-center items-center mb-16 relative"
        >
          <h1 className="text-[12vw] sm:text-[14vw] md:text-[16vw] font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-neutral-800 uppercase select-none drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            Workflow
          </h1>

          {/* Animated orbit around the text */}
          <motion.div
            className="absolute w-[110%] h-[110%] border border-white/5 rounded-[100%] pointer-events-none"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute top-0 left-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]" />
            <div className="absolute bottom-0 right-1/4 w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_10px_2px_rgba(96,165,250,0.8)]" />
          </motion.div>
        </motion.div>

        <div className="w-full mt-10 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/10 pt-8 relative z-20 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-black font-black text-sm shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              W
            </div>
            <span className="text-base font-bold text-white tracking-wide">
              Workflow
            </span>
            <span className="text-sm text-neutral-500 hidden sm:inline-block ml-2 border-l border-neutral-800 pl-4">
              © 2026. Built with Next.js & PostgreSQL.
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm font-medium text-neutral-400">
            <Link
              href="/how-it-works"
              className="hover:text-white transition-colors relative group"
            >
              How It Works
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/contact"
              className="hover:text-white transition-colors relative group"
            >
              Contact & Enquiry
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/login"
              className="hover:text-white transition-colors relative group"
            >
              Sign In
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/register"
              className="hover:text-white transition-colors font-bold text-white px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
