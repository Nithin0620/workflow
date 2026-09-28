"use client";

import { useState, useEffect } from "react";
import { Zap, X, ExternalLink } from "lucide-react";
import Link from "next/link";

export function BenchleyLaunchBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed
    const dismissedAt = localStorage.getItem("benchley-banner-dismissed");
    const now = Date.now();
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    // Show if never dismissed or dismissed more than a week ago
    if (!dismissedAt || (now - parseInt(dismissedAt)) > ONE_WEEK) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("benchley-banner-dismissed", Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-black border-2 border-yellow-400 rounded-2xl shadow-[0_0_60px_rgba(250,204,21,0.3)] overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-yellow-400/5 pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/20 transition-colors z-10"
          aria-label="Close banner"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="relative p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-yellow-400 border-2 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]">
              <Zap className="w-8 h-8 text-black" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold text-white">
              We've Launched <span className="text-yellow-400">Benchley</span>
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              High-performance API load testing platform powered by k6. Test your application's performance under real-world conditions with load, stress, spike, and soak testing.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              <span>k6 Powered</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              <span>Real-time Telemetry</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              <span>Performance Thresholds</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              <span>Report Download</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href="https://benchley.ssh.net.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-yellow-400 text-black font-bold text-sm hover:bg-yellow-300 transition-all shadow-glow-sm"
            >
              <span>Open Benchley</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <Link
              href="/planned-journey"
              onClick={handleDismiss}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-yellow-400/30 text-yellow-400 font-semibold text-sm hover:bg-yellow-400/10 transition-all"
            >
              <span>Learn More</span>
            </Link>
          </div>

          {/* Dismiss hint */}
          <p className="text-center text-[10px] text-zinc-600 font-mono">
            This announcement will be shown for  week
          </p>
        </div>
      </div>
    </div>
  );
}
