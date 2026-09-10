"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Smartphone,
  MessagesSquare,
  Kanban,
  PenTool,
  BarChart3,
  Bell,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Radio,
  Send,
  SlidersHorizontal,
} from "lucide-react";

interface MobileAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "discussions" | "kanban" | "whiteboards" | "analytics" | "notifications";

export function MobileAppModal({ isOpen, onClose }: MobileAppModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("discussions");

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabs: { id: TabType; label: string; icon: typeof MessagesSquare; hue: number }[] = [
    { id: "discussions", label: "Discussions", icon: MessagesSquare, hue: 28 },
    { id: "kanban", label: "Kanban & Issues", icon: Kanban, hue: 250 },
    { id: "whiteboards", label: "Whiteboards", icon: PenTool, hue: 170 },
    { id: "analytics", label: "Analytics", icon: BarChart3, hue: 330 },
    { id: "notifications", label: "Push Alerts", icon: Bell, hue: 142 },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
          className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/15 bg-neutral-950 text-white shadow-2xl z-10 my-auto flex flex-col max-h-[90vh]"
        >
          {/* Top ambient glow */}
          <div
            aria-hidden
            className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-emerald-500/20 blur-[90px] pointer-events-none"
          />

          {/* Modal Header */}
          <div className="relative flex items-center justify-between border-b border-white/10 px-6 py-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                    Workflow Mobile Native App
                  </h2>
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                    Live & Active
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Full-fidelity iOS & Android native experience with real-time synchronization.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 p-2 text-neutral-400 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="overflow-y-auto px-6 py-6 space-y-6 flex-1">
            {/* Feature Navigator Bar */}
            <div className="flex flex-wrap gap-2 rounded-2xl bg-white/[0.03] border border-white/10 p-1.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-white text-black shadow-md font-bold"
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-black" : "text-neutral-400"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Demonstrative Showcase Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Interactive Mobile Device Frame Mockup */}
              <div className="lg:col-span-6 flex justify-center">
                <div className="w-full max-w-[310px] rounded-[38px] border-4 border-neutral-700/80 bg-neutral-900 p-2.5 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                  {/* Speaker notch / dynamic island */}
                  <div className="mx-auto h-4 w-28 rounded-full bg-black/90 mb-2 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-neutral-800 mr-2" />
                    <div className="h-1.5 w-6 rounded-full bg-neutral-800" />
                  </div>

                  {/* Phone Screen Screen Area */}
                  <div className="rounded-[28px] bg-black border border-white/5 p-4 min-h-[360px] flex flex-col justify-between overflow-hidden relative">
                    {/* Screen Top Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-bold font-mono tracking-tight text-white">
                          Acme Engineering
                        </span>
                      </div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                        {activeTab}
                      </span>
                    </div>

                    {/* Screen Dynamic Content by Tab */}
                    <div className="py-3 flex-1 flex flex-col justify-center">
                      {activeTab === "discussions" && (
                        <motion.div
                          key="discussions-demo"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2.5 text-left"
                        >
                          <div className="rounded-xl border border-white/10 bg-neutral-900/90 p-2.5 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-neutral-400">
                              <span className="font-semibold text-emerald-400"># general-eng</span>
                              <span>2m ago</span>
                            </div>
                            <p className="text-[11px] text-neutral-200">
                              🚀 Sprint 44 deployed to staging. Ready for smoke tests!
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-neutral-900/90 p-2.5 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-neutral-400">
                              <span className="font-semibold text-sky-400"># mobile-sync</span>
                              <span>Just now</span>
                            </div>
                            <p className="text-[11px] text-neutral-200">
                              Native WebPush & live channel websockets active.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 mt-2">
                            <span className="text-[10px] text-neutral-500 flex-1">Type a message...</span>
                            <Send className="h-3 w-3 text-neutral-400" />
                          </div>
                        </motion.div>
                      )}

                      {activeTab === "kanban" && (
                        <motion.div
                          key="kanban-demo"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2 text-left"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                            <span className="uppercase text-amber-400 font-bold">In Progress (3)</span>
                            <span>Filter ▾</span>
                          </div>

                          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-bold text-amber-300">TRIP-104</span>
                              <span className="text-[9px] bg-black/40 px-1.5 py-0.5 rounded text-neutral-300">High</span>
                            </div>
                            <p className="text-[11px] font-medium text-white">Optimize float re-indexing</p>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-neutral-900/90 p-2.5 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-bold text-neutral-400">DEV-89</span>
                              <span className="text-[9px] bg-black/40 px-1.5 py-0.5 rounded text-neutral-300">Medium</span>
                            </div>
                            <p className="text-[11px] font-medium text-white">Dark mode contrast tokens</p>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === "whiteboards" && (
                        <motion.div
                          key="whiteboards-demo"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2 text-left"
                        >
                          <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 text-center space-y-2">
                            <PenTool className="h-6 w-6 text-purple-400 mx-auto" />
                            <p className="text-[11px] font-bold text-white">Architecture Canvas</p>
                            <div className="flex justify-center gap-1.5">
                              <span className="h-4 w-8 rounded bg-purple-500/20 border border-purple-500/40 text-[8px] flex items-center justify-center font-mono">API</span>
                              <span className="text-[10px] text-neutral-400">→</span>
                              <span className="h-4 w-8 rounded bg-emerald-500/20 border border-emerald-500/40 text-[8px] flex items-center justify-center font-mono">WS</span>
                              <span className="text-[10px] text-neutral-400">→</span>
                              <span className="h-4 w-8 rounded bg-sky-500/20 border border-sky-500/40 text-[8px] flex items-center justify-center font-mono">APP</span>
                            </div>
                            <span className="text-[9px] font-mono text-neutral-400 block">Touch & gesture enabled</span>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === "analytics" && (
                        <motion.div
                          key="analytics-demo"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2 text-left"
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-xl border border-white/10 bg-neutral-900/80 p-2 text-center">
                              <div className="text-sm font-extrabold text-white">98.4%</div>
                              <div className="text-[8px] font-mono text-neutral-400 uppercase">On-Time Sprint</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-neutral-900/80 p-2 text-center">
                              <div className="text-sm font-extrabold text-emerald-400">2.1d</div>
                              <div className="text-[8px] font-mono text-neutral-400 uppercase">Cycle Time</div>
                            </div>
                          </div>
                          <div className="h-16 rounded-xl border border-white/10 bg-white/[0.02] flex items-end justify-between px-3 pb-2 pt-4 gap-1">
                            <div className="h-6 w-3 bg-white/20 rounded-t" />
                            <div className="h-8 w-3 bg-white/30 rounded-t" />
                            <div className="h-12 w-3 bg-emerald-400 rounded-t" />
                            <div className="h-9 w-3 bg-white/40 rounded-t" />
                            <div className="h-11 w-3 bg-emerald-300 rounded-t" />
                          </div>
                        </motion.div>
                      )}

                      {activeTab === "notifications" && (
                        <motion.div
                          key="notifications-demo"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2 text-left"
                        >
                          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-2.5 space-y-1">
                            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-semibold">
                              <Bell className="h-3 w-3" />
                              <span>Instant Push Notification</span>
                            </div>
                            <p className="text-[11px] text-white">
                              Alex assigned <span className="font-mono text-emerald-300">TRIP-104</span> to you
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-neutral-900/90 p-2.5 space-y-1">
                            <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-semibold">
                              <MessagesSquare className="h-3 w-3" />
                              <span>Mention in #general</span>
                            </div>
                            <p className="text-[11px] text-neutral-300">
                              &quot;@you could you review the PR?&quot;
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Simulated Bottom Navigation */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-around text-neutral-500">
                      <MessagesSquare className={`h-4 w-4 ${activeTab === "discussions" ? "text-white" : ""}`} />
                      <Kanban className={`h-4 w-4 ${activeTab === "kanban" ? "text-white" : ""}`} />
                      <PenTool className={`h-4 w-4 ${activeTab === "whiteboards" ? "text-white" : ""}`} />
                      <BarChart3 className={`h-4 w-4 ${activeTab === "analytics" ? "text-white" : ""}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Feature Details & Capabilities */}
              <div className="lg:col-span-6 space-y-4 text-left">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                    Engineered for Production
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                    Native Performance & Instant Sync
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
                    The Workflow mobile app brings the speed, responsiveness, and keyboard-grade efficiency of the web platform straight to your phone.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Sub-100ms Live Sync</h4>
                      <p className="text-[11px] text-neutral-400">
                        Discussions, kanban moves, and issue status changes reflect instantly across both web and mobile.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <Bell className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Native WebPush & APNs Support</h4>
                      <p className="text-[11px] text-neutral-400">
                        Never miss an urgent @mention, issue assignment, or deployment status update.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <Shield className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Enterprise Security & RBAC</h4>
                      <p className="text-[11px] text-neutral-400">
                        Secure session tokens, biometric unlock support, and strict workspace boundary protection.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tech Stack Badges */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] font-mono text-neutral-300">
                    React Native & Expo
                  </span>
                  <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] font-mono text-neutral-300">
                    iOS / Android
                  </span>
                  <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] font-mono text-neutral-300">
                    VAPID Push Service
                  </span>
                  <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] font-mono text-neutral-300">
                    Full Offline Cache
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-white/10 px-6 py-4 bg-neutral-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Available on your mobile device & Expo environment</span>
            </div>
            <button
              onClick={onClose}
              className="w-full sm:w-auto rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-black transition hover:bg-neutral-200 cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
