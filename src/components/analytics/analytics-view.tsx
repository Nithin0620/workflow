"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  GitPullRequest,
  Layers,
  Users,
  Timer,
  Calendar,
  Filter,
  ArrowUpRight,
  Flame,
  Check,
  Hourglass,
} from "lucide-react";
import {
  getWorkspaceAnalytics,
  type AnalyticsSummaryData,
} from "@/actions/analytics";
import { TourReplayButton } from "@/components/onboarding/onboarding-tour";

interface AnalyticsViewProps {
  initialData: AnalyticsSummaryData;
  orgSlug: string;
  workspaceSlug: string;
}

export function AnalyticsView({
  initialData,
  orgSlug,
  workspaceSlug,
}: AnalyticsViewProps) {
  const [data, setData] = useState<AnalyticsSummaryData>(initialData);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [timeRangeDays, setTimeRangeDays] = useState<number>(30);
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (projId: string, days: number) => {
    setSelectedProjectId(projId);
    setTimeRangeDays(days);

    startTransition(async () => {
      const res = await getWorkspaceAnalytics({
        workspaceId: initialData.workspace.id,
        projectId: projId === "ALL" ? null : projId,
        timeRangeDays: days,
      });
      if (res.success && res.data) {
        setData(res.data);
      }
    });
  };

  const { kpis, charts, bottlenecks, projects } = data;

  // Max count for daily throughput chart scaling
  const maxDaily = Math.max(
    1,
    ...charts.dailyThroughput.map((d) => Math.max(d.created, d.completed))
  );

  const totalStatusCount = Math.max(
    1,
    charts.statusDistribution.reduce((acc, curr) => acc + curr.count, 0)
  );

  const totalPriorityCount = Math.max(
    1,
    charts.priorityDistribution.reduce((acc, curr) => acc + curr.count, 0)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-white pb-12">
      {/* Header & Filter Controls */}
      <div
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-800 pb-5"
        data-tour="analytics-header"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Analytics & Velocity
            </h1>
            <span className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-xs font-mono font-bold text-neutral-300">
              {data.workspace.name}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time delivery throughput, cycle time, PR merges, and team workload insights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-neutral-400" />
            <select
              value={selectedProjectId}
              onChange={(e) => handleFilterChange(e.target.value, timeRangeDays)}
              className="bg-transparent text-white focus:outline-none cursor-pointer font-medium"
            >
              <option value="ALL" className="bg-neutral-950 text-white">
                All Projects ({projects.length})
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-neutral-950 text-white">
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center rounded-xl border border-neutral-800 bg-neutral-950 p-1 text-xs">
            {[
              { label: "7D", val: 7 },
              { label: "14D", val: 14 },
              { label: "30D", val: 30 },
              { label: "90D", val: 90 },
            ].map((t) => (
              <button
                key={t.val}
                onClick={() => handleFilterChange(selectedProjectId, t.val)}
                className={`cursor-pointer rounded-lg px-2.5 py-1 font-bold transition ${
                  timeRangeDays === t.val
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <TourReplayButton tourId="analytics" />
        </div>
      </div>

      {/* KPI Hero Metric Cards */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-200 ${
          isPending ? "opacity-50 pointer-events-none" : "opacity-100"
        }`}
        data-tour="analytics-cards"
      >
        {/* Completion Rate */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-5 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-neutral-700 transition">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase font-mono">
            <span>Completion Rate</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {kpis.completionRate}%
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">
            {kpis.doneIssues} of {kpis.totalIssues} issues completed
          </p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, kpis.completionRate)}%` }}
            />
          </div>
        </div>

        {/* Avg Cycle Time */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-5 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-neutral-700 transition">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase font-mono">
            <span>Avg Cycle Time</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <Timer className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {kpis.avgCycleTimeDays}{" "}
            <span className="text-sm font-medium text-neutral-400">days</span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">
            From "In Progress" to "Done"
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
            <span>Lead Time: {kpis.avgLeadTimeDays}d</span>
          </div>
        </div>

        {/* Git Pull Requests Velocity */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-5 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-neutral-700 transition">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase font-mono">
            <span>GitHub PR Velocity</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <GitPullRequest className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {kpis.mergedPRs}{" "}
            <span className="text-sm font-medium text-purple-400 font-mono">
              / {kpis.totalPRs}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">
            Merged PRs linked to tickets
          </p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{
                width: `${
                  kpis.totalPRs > 0
                    ? Math.round((kpis.mergedPRs / kpis.totalPRs) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Story Points / Active Sprint Load */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-5 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-neutral-700 transition">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase font-mono">
            <span>Story Points Burned</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {kpis.completedStoryPoints}{" "}
            <span className="text-sm font-medium text-neutral-400">
              / {kpis.totalStoryPoints} pts
            </span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">
            {kpis.inProgressIssues} tickets actively in progress
          </p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{
                width: `${
                  kpis.totalStoryPoints > 0
                    ? Math.round((kpis.completedStoryPoints / kpis.totalStoryPoints) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Throughput Chart (2 Columns) */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Throughput & Delivery Timeline
              </h3>
              <p className="text-xs text-neutral-400">
                Created vs Completed issues over the last {timeRangeDays} days
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-blue-500" />
                <span className="text-neutral-300">Created ({charts.dailyThroughput.reduce((a, c) => a + c.created, 0)})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
                <span className="text-neutral-300">Done ({charts.dailyThroughput.reduce((a, c) => a + c.completed, 0)})</span>
              </div>
            </div>
          </div>

          {/* Chart Container with Y-Axis and Gridlines */}
          <div className="relative pt-6 pb-2">
            {/* Gridlines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 pt-6 pb-8">
              <div className="border-b border-neutral-600 w-full" />
              <div className="border-b border-neutral-600 w-full" />
              <div className="border-b border-neutral-600 w-full" />
            </div>

            {/* Bars */}
            <div className="h-60 flex items-end gap-1 sm:gap-2 px-2 overflow-x-auto border-b border-neutral-800 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
              {charts.dailyThroughput.map((d, i) => {
                const createdHeight = d.created > 0 ? Math.max(8, Math.round((d.created / maxDaily) * 100)) : 0;
                const completedHeight = d.completed > 0 ? Math.max(8, Math.round((d.completed / maxDaily) * 100)) : 0;
                const isZero = d.created === 0 && d.completed === 0;

                return (
                  <div
                    key={i}
                    className="flex-1 min-w-[16px] sm:min-w-[24px] flex flex-col items-center gap-1 group relative h-full justify-end"
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-200 items-start bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-[11px] font-mono text-white shadow-2xl z-50 whitespace-nowrap pointer-events-none -translate-x-1/2 left-1/2">
                      <span className="font-bold text-neutral-200 border-b border-neutral-800 pb-1 w-full mb-1">
                        {d.date}
                      </span>
                      <span className="text-blue-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-400" /> Created: {d.created}
                      </span>
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" /> Done: {d.completed}
                      </span>
                    </div>

                    <div className="w-full flex items-end justify-center gap-1 h-full pb-1">
                      {isZero ? (
                        <div className="h-1 w-full bg-neutral-900 rounded-full group-hover:bg-neutral-800 transition" />
                      ) : (
                        <>
                          {/* Created bar */}
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${createdHeight}%` }}
                            transition={{ duration: 0.5, delay: i * 0.02 }}
                            className="w-1/2 rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-colors"
                          />
                          {/* Completed bar */}
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${completedHeight}%` }}
                            transition={{ duration: 0.5, delay: i * 0.02 }}
                            className="w-1/2 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-colors"
                          />
                        </>
                      )}
                    </div>

                    {/* Date label */}
                    {(i === 0 ||
                      i === charts.dailyThroughput.length - 1 ||
                      i % Math.ceil(charts.dailyThroughput.length / 7) === 0) && (
                      <span className="text-[10px] font-mono text-neutral-400 select-none mt-1">
                        {d.date}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Status Breakdown
            </h3>
            <p className="text-xs text-neutral-400">
              Current state of active tickets
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {charts.statusDistribution.map((s) => {
              const pct = Math.round((s.count / totalStatusCount) * 100);
              return (
                <div key={s.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-300 flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.label}
                    </span>
                    <span className="font-mono text-neutral-400">
                      {s.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-neutral-900 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: s.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Secondary Row: Team Workload & Bottlenecks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Workload Balance */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Users className="h-4 w-4 text-neutral-300" />
                <span>Team Member Workload</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Active issues and points assigned across teammates
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {charts.memberWorkload.length > 0 ? (
              charts.memberWorkload.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center justify-between rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3"
                >
                  <div className="flex items-center gap-2.5">
                    {m.image ? (
                      <img
                        src={m.image}
                        alt={m.name}
                        className="h-8 w-8 rounded-full border border-neutral-700 object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-white">{m.name}</div>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        {m.openCount} open · {m.doneCount} resolved
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="rounded bg-neutral-800 px-2 py-0.5 font-mono text-xs font-bold text-neutral-200 border border-neutral-700">
                      {m.storyPoints} pts
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-neutral-500">
                No assigned issues found for this selection.
              </div>
            )}
          </div>
        </div>

        {/* Bottleneck Radar */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Hourglass className="h-4 w-4 text-rose-400" />
                <span>Bottleneck Radar</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Issues waiting &gt;3 days in progress or review
              </p>
            </div>
            <span className="rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-400">
              {bottlenecks.length} FLAGGED
            </span>
          </div>

          <div className="space-y-2.5 pt-1 max-h-72 overflow-y-auto pr-1">
            {bottlenecks.length > 0 ? (
              bottlenecks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-rose-950/60 bg-rose-950/10 p-3 hover:border-rose-800/80 transition"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-rose-400">
                        {b.key}
                      </span>
                      <span className="rounded bg-neutral-900 px-1.5 py-0.2 text-[9px] font-mono text-neutral-400">
                        {b.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-200 font-medium truncate">
                      {b.title}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono font-bold text-rose-400">
                      {b.daysInStatus}d in status
                    </span>
                    {b.assignee && (
                      <div className="text-[10px] text-neutral-400">
                        @{b.assignee.name || "teammate"}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-neutral-500">
                🎉 No stale tickets detected! Workflow cycle time is healthy.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
