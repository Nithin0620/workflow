"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock,
  Bot,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  GitBranch,
  ChevronRight,
  Calendar,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import {
  getWorkspaceCronJobs,
  getCronRunHistory,
  runCronJobNow,
  deleteCronJob,
  toggleCronJob,
  CronJobItem,
  CronRunItem,
} from "@/actions/cron-jobs";
import { CreateCronJobDialog } from "./create-cron-job-dialog";
import { useRouter } from "next/navigation";
import { OnboardingTour, TourReplayButton } from "@/components/onboarding/onboarding-tour";

interface CronManagementClientProps {
  workspaceId: string;
  workspaceName: string;
  orgSlug: string;
  workspaceSlug: string;
  canManage: boolean;
  initialJobs?: CronJobItem[];
  initialLogs?: CronRunItem[];
}

const fmtDate = (d: Date | null | undefined) =>
  d ? new Date(d).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export function CronManagementClient({
  workspaceId,
  workspaceName,
  orgSlug,
  workspaceSlug,
  canManage,
  initialJobs = [],
  initialLogs = [],
}: CronManagementClientProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(initialJobs.length === 0 && initialLogs.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [runningAll, setRunningAll] = useState(false);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [jobs, setJobs] = useState<CronJobItem[]>(initialJobs);
  const [logs, setLogs] = useState<CronRunItem[]>(initialLogs);
  const [createOpen, setCreateOpen] = useState(false);

  // History filters
  const [filterJobId, setFilterJobId] = useState("ALL");
  const [filterProjectId, setFilterProjectId] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterSince, setFilterSince] = useState("ALL");

  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [jobsRes, historyRes] = await Promise.all([
      getWorkspaceCronJobs(workspaceId),
      getCronRunHistory(workspaceId),
    ]);
    if (jobsRes.success) setJobs(jobsRes.jobs);
    if (historyRes.success) setLogs(historyRes.logs);
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadAll();
    });
  }, [loadAll]);

  const refresh = async () => {
    setRefreshing(true);
    setNotification(null);
    await loadAll(true);
    setRefreshing(false);
  };

  const handleRunJob = async (jobId: string) => {
    setRunningJobId(jobId);
    const res = await runCronJobNow(jobId);
    setRunningJobId(null);
    if (res.success) {
      setNotification({ type: "success", text: res.summary });
    } else {
      setNotification({ type: "error", text: res.error || "Execution failed." });
    }
    loadAll(true);
    router.refresh();
  };

  const handleRunAll = async () => {
    setRunningAll(true);
    setNotification(null);
    let ok = 0;
    let fail = 0;
    for (const j of jobs.filter((j) => j.enabled)) {
      const res = await runCronJobNow(j.id);
      if (res.success) ok++;
      else fail++;
    }
    setRunningAll(false);
    setNotification({
      type: fail > 0 ? "error" : "success",
      text: `Ran ${ok} job(s). ${fail > 0 ? `${fail} failed.` : "All succeeded."}`,
    });
    loadAll(true);
    router.refresh();
  };

  const handleDelete = async (job: CronJobItem) => {
    if (!confirm(`Delete cron job "${job.name}"? Its run history will be kept.`)) return;
    const res = await deleteCronJob(job.id);
    setNotification(res.success
      ? { type: "success", text: "Cron job deleted." }
      : { type: "error", text: res.error || "Delete failed." });
    loadAll(true);
  };

  const handleToggle = async (job: CronJobItem) => {
    const res = await toggleCronJob(job.id);
    if (res.success) setNotification({ type: "success", text: res.enabled ? "Job enabled." : "Job paused." });
    else setNotification({ type: "error", text: res.error || "Failed to update job." });
    loadAll(true);
  };

  const latestLogMs = logs.reduce((max, l) => Math.max(max, new Date(l.createdAt).getTime()), 0);

  const filteredLogs = logs.filter((l) => {
    const mJob = filterJobId === "ALL" || l.cronJobId === filterJobId || (!l.cronJobId && filterJobId === "NONE");
    const mProj = filterProjectId === "ALL" || l.projectId === filterProjectId;
    const mStatus = filterStatus === "ALL" || l.status === filterStatus;
    const mSince =
      filterSince === "ALL" ||
      new Date(l.createdAt).getTime() >= latestLogMs - Number(filterSince) * 24 * 60 * 60 * 1000;
    return mJob && mProj && mStatus && mSince;
  });

  const totalRuns = logs.length;
  const totalFailed = logs.filter((l) => l.status === "FAILED").length;
  const enabledCount = jobs.filter((j) => j.enabled).length;
  const totalFindings = jobs.reduce((a, j) => a + j.totalFindings, 0);

  const projects = useMemo(() => {
    const map = new Map<string, { id: string; name: string; key: string }>();
    jobs.forEach((j) => map.set(j.projectId, { id: j.projectId, name: j.projectName, key: j.projectKey }));
    logs.forEach((l) => {
      if (l.projectId && l.projectName && !map.has(l.projectId))
        map.set(l.projectId, { id: l.projectId, name: l.projectName, key: l.projectKey || "" });
    });
    return [...map.values()];
  }, [jobs, logs]);

  const nextRun = jobs
    .map((j) => j.nextRunAt)
    .filter((d): d is Date => !!d)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-white pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-6" data-tour="cron-header">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Cron Jobs & Automation
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Schedule configurable AI jobs, link any repository, and inspect every run for{" "}
                <strong className="text-neutral-200">{workspaceName}</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-300 hover:border-neutral-700 hover:text-white transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setCreateOpen(true)}
            data-tour="create-cron-btn"
            className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-300 hover:border-neutral-700 hover:text-white transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Cron Job</span>
          </button>

          {enabledCount > 0 && (
            <button
              onClick={handleRunAll}
              disabled={runningAll}
              className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-neutral-200 transition disabled:opacity-50"
            >
              {runningAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
              <span>{runningAll ? "Running Jobs..." : "Run All Jobs"}</span>
            </button>
          )}

          <TourReplayButton tourId="cron" />
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border p-4 text-xs font-medium ${
            notification.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/30 bg-rose-500/10 text-rose-400"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Active Jobs</span>
            <Bot className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            {enabledCount}
            <span className="text-xs font-normal text-neutral-500"> / {jobs.length}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Total Runs</span>
            <Clock className="h-4 w-4 text-neutral-300" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">{totalRuns}</div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Failed Runs</span>
            <AlertCircle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-rose-400">{totalFailed}</div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Findings</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-400">{totalFindings}</div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Next Run</span>
            <Calendar className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-sm font-bold text-emerald-300">{fmtDate(nextRun)}</div>
        </div>
      </div>

      {/* Cron Jobs */}
      <div className="space-y-4" data-tour="cron-jobs-list">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
            CRON JOBS
          </h2>
          <span className="text-xs text-neutral-500">{jobs.length} job(s)</span>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-12 text-center text-neutral-400">
            <Clock className="h-8 w-8 mx-auto text-neutral-600" />
            <p className="text-sm font-semibold text-white mt-2">No cron jobs yet</p>
            <p className="text-xs text-neutral-500 mt-1">
              Create a job to schedule an AI scan against any project & repository in this workspace.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => {
              const isRunning = runningJobId === job.id;
              return (
                <div
                  key={job.id}
                  className="flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-lg space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300">
                          <Bot className="h-4 w-4" />
                        </span>
                        <div>
                          <h3 className="font-bold text-white text-sm">{job.name}</h3>
                          <span className="font-mono text-[11px] text-neutral-400">{job.projectName} ({job.projectKey})</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle(job)}
                        title={job.enabled ? "Pause job" : "Resume job"}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition ${
                          job.enabled
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-neutral-900 border border-neutral-800 text-neutral-500"
                        }`}
                      >
                        {job.enabled ? "Active" : "Paused"}
                      </button>
                    </div>

                    {job.description && (
                      <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">{job.description}</p>
                    )}

                    <div className="space-y-1.5 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs">
                      <div className="flex items-center justify-between text-neutral-300">
                        <span className="flex items-center gap-1.5 truncate">
                          <GitBranch className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                          <span className="font-medium truncate">{job.repoOwner}/{job.repoName}</span>
                        </span>
                        <span className="font-mono text-[11px] text-emerald-400 font-bold shrink-0">{job.defaultBranch}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800">
                        <span>Next run:</span>
                        <span className="font-semibold text-neutral-200">{fmtDate(job.nextRunAt)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] pt-1 border-t border-neutral-800 text-neutral-400">
                        <span>Ran: <strong className={job.failedCount > 0 ? "text-rose-400" : "text-neutral-200"}>{job.runCount}</strong></span>
                        <span>Failed: <strong className={job.failedCount > 0 ? "text-rose-400" : "text-neutral-200"}>{job.failedCount}</strong></span>
                        <span>Last: <strong className={job.lastStatus === "FAILED" ? "text-rose-400" : "text-neutral-200"}>{job.lastStatus || "—"}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-neutral-900 pt-3 text-xs">
                    <button
                      onClick={() => {
                        setFilterJobId(job.id);
                        setFilterProjectId("ALL");
                        setFilterStatus("ALL");
                      }}
                      className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-white transition"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                      <span>History</span>
                    </button>

                    {canManage && (
                      <button
                        onClick={() => handleDelete(job)}
                        title="Delete this cron job"
                        className="flex items-center gap-1 text-[11px] font-semibold text-neutral-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    )}

                    {canManage && (
                      <button
                        onClick={() => handleRunJob(job.id)}
                        disabled={isRunning}
                        className="ml-auto flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-300 hover:border-emerald-500/70 hover:bg-emerald-500/20 transition disabled:opacity-50"
                      >
                        {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
                        <span>{isRunning ? "Running..." : "Run Now"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Combined Run History */}
      <div className="space-y-4" data-tour="cron-history">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
              RUN HISTORY
            </h2>
            <p className="text-xs text-neutral-400">
              Combined history across every cron job. Click any run for full details.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterJobId}
              onChange={(e) => setFilterJobId(e.target.value)}
              className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:border-neutral-700 focus:outline-none"
            >
              <option value="ALL">All Jobs</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.name}</option>
              ))}
              <option value="NONE">Manual / Unlinked</option>
            </select>

            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:border-neutral-700 focus:outline-none"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.key})</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:border-neutral-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </select>

            <select
              value={filterSince}
              onChange={(e) => setFilterSince(e.target.value)}
              className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:border-neutral-700 focus:outline-none"
            >
              <option value="ALL">Any Time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-12 text-center text-neutral-400">
            <Clock className="h-8 w-8 mx-auto text-neutral-600" />
            <p className="text-sm font-semibold text-white mt-2">No execution logs recorded yet.</p>
            <p className="text-xs text-neutral-500 mt-1">
              Runs will appear here automatically when triggered.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <button
                key={log.id}
                onClick={() => router.push(`/${orgSlug}/${workspaceSlug}/cron/${log.id}`)}
                className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-left hover:bg-neutral-900/60 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border shrink-0 ${
                      log.status === "SUCCESS"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {log.status === "SUCCESS" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate">{log.cronJobName || log.projectName || "Manual Run"}</span>
                      {log.projectKey && (
                        <span className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.2 font-mono text-[10px] text-neutral-400 shrink-0">{log.projectKey}</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 truncate">{log.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-neutral-400 shrink-0">
                  <div className="text-right">
                    <div className="text-neutral-200 font-medium">{fmtDate(log.createdAt)}</div>
                    <span className="text-[11px] text-neutral-500">{log.durationMs}ms · {log.findingsCount} finding(s)</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-500" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <CreateCronJobDialog
        workspaceId={workspaceId}
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setNotification({ type: "success", text: "Cron job created." });
          loadAll(true);
        }}
      />

      <OnboardingTour tourId="cron" />
    </div>
  );
}