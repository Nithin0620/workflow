"use client";

import { useCallback, useEffect, useState } from "react";
import {
  X,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bot,
  GitBranch,
  Plus,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { getProjectCronRuns, runCronJobNow, CronJobItem, CronRunItem } from "@/actions/cron-jobs";
import { CreateCronJobDialog } from "./create-cron-job-dialog";
import { useRouter } from "next/navigation";

interface ProjectCronDialogProps {
  projectId: string;
  projectKey: string;
  projectName: string;
  orgSlug: string;
  workspaceSlug: string;
  isOpen: boolean;
  onClose: () => void;
  canManage: boolean;
}

const fmtDate = (d: Date | null | undefined) =>
  d ? new Date(d).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export function ProjectCronDialog({
  projectId,
  projectKey,
  projectName,
  orgSlug,
  workspaceSlug,
  isOpen,
  onClose,
  canManage,
}: ProjectCronDialogProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<CronJobItem[]>([]);
  const [logs, setLogs] = useState<CronRunItem[]>([]);
  const [workspaceIdForCreate, setWorkspaceIdForCreate] = useState("");
  const [loading, setLoading] = useState(true);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getProjectCronRuns(projectId);
    if (res.success) {
      setJobs(res.jobs);
      setLogs(res.logs);
      if (res.workspaceId) setWorkspaceIdForCreate(res.workspaceId);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      void load();
    });
  }, [isOpen, load]);

  if (!isOpen) return null;

  const runJob = async (jobId: string) => {
    setRunningJobId(jobId);
    setNotification(null);
    const res = await runCronJobNow(jobId);
    setRunningJobId(null);
    setNotification(res.success
      ? { type: "success", text: res.summary }
      : { type: "error", text: res.error || "Execution failed." });
    load();
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black dark:bg-white/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 dark:border-neutral-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white dark:text-black flex items-center gap-2">
                Cron Jobs
                <span className="rounded-md border border-neutral-800 dark:border-neutral-200 bg-neutral-900 dark:bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-neutral-300 dark:text-neutral-700">{projectKey}</span>
              </h2>
              <p className="text-xs text-neutral-400 dark:text-neutral-600">Scheduled automation for {projectName}.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canManage && (
              <button
                onClick={() => setCreateOpen(true)}
                className="cursor-pointer flex items-center gap-1.5 rounded-xl bg-white dark:bg-black px-3 py-1.5 text-xs font-bold text-black dark:text-white hover:bg-neutral-200 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Cron Job</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg p-1.5 text-neutral-400 dark:text-neutral-600 hover:bg-neutral-900 hover:text-white dark:text-black transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-5">
          {notification && (
            <div
              className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-medium ${
                notification.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-400"
              }`}
            >
              {notification.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span>{notification.text}</span>
            </div>
          )}

          {/* Jobs */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-600 font-mono">
              Jobs ({jobs.length})
            </h3>
            {loading ? (
              <div className="flex h-24 items-center justify-center rounded-2xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50">
                <Loader2 className="h-5 w-5 animate-spin text-neutral-500 dark:text-neutral-500" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="rounded-2xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-6 text-center text-neutral-500 dark:text-neutral-500 text-xs">
                <Bot className="h-6 w-6 mx-auto text-neutral-600 dark:text-neutral-400 mb-1" />
                No cron jobs yet. Create one to schedule AI scans for this project.
              </div>
            ) : (
              jobs.map((job) => {
                const isRunning = runningJobId === job.id;
                return (
                  <div key={job.id} className="rounded-2xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white dark:text-black text-sm truncate">{job.name}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              job.enabled
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-neutral-900 dark:bg-neutral-100 border border-neutral-800 text-neutral-500 dark:text-neutral-500"
                            }`}
                          >
                            {job.enabled ? "Active" : "Paused"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-600 mt-0.5">
                          <GitBranch className="h-3 w-3 text-neutral-500 dark:text-neutral-500" />
                          <span className="font-mono">{job.repoOwner}/{job.repoName} @ {job.defaultBranch}</span>
                        </div>
                        {job.description && (
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-500 mt-1 line-clamp-2">{job.description}</p>
                        )}
                      </div>
                      {canManage && (
                        <button
                          onClick={() => runJob(job.id)}
                          disabled={isRunning}
                          className="cursor-pointer flex shrink-0 items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition disabled:opacity-50"
                        >
                          {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
                          <span>{isRunning ? "Running..." : "Run"}</span>
                        </button>
                      )}
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-3 text-[11px] text-neutral-400 dark:text-neutral-600 pt-2 border-t border-neutral-900 dark:border-neutral-100">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-emerald-400" /> Next: <strong className="text-neutral-200 dark:text-neutral-800">{fmtDate(job.nextRunAt)}</strong></span>
                      <span>Ran: <strong className={job.failedCount > 0 ? "text-rose-400" : "text-neutral-200 dark:text-neutral-800"}>{job.runCount}</strong></span>
                      <span>Failed: <strong className={job.failedCount > 0 ? "text-rose-400" : "text-neutral-200 dark:text-neutral-800"}>{job.failedCount}</strong></span>
                      <span>Last: <strong className={job.lastStatus === "FAILED" ? "text-rose-400" : "text-neutral-200 dark:text-neutral-800"}>{job.lastStatus || "—"}</strong></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Recent runs */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-600 font-mono">
              Recent Runs ({logs.length})
            </h3>
            {loading ? (
              <div className="flex h-20 items-center justify-center rounded-2xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50">
                <Loader2 className="h-5 w-5 animate-spin text-neutral-500 dark:text-neutral-500" />
              </div>
            ) : logs.length === 0 ? (
              <div className="rounded-2xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-6 text-center text-neutral-500 dark:text-neutral-500 text-xs">
                No runs yet. Run a job or wait for the next schedule.
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => router.push(`/${orgSlug}/${workspaceSlug}/cron/${log.id}`)}
                    className="cursor-pointer w-full flex items-center justify-between gap-3 rounded-2xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-3.5 text-left hover:bg-neutral-900/60 dark:hover:bg-neutral-100/60 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                          log.status === "SUCCESS"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {log.status === "SUCCESS" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white dark:text-black truncate">{log.cronJobName || "Manual Run"}</div>
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-600 truncate">{log.summary}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-[11px] text-neutral-500 dark:text-neutral-500">
                      <span>{fmtDate(log.createdAt)} · {log.durationMs}ms</span>
                      <ChevronRight className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-500" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateCronJobDialog
        workspaceId={workspaceIdForCreate}
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => load()}
        defaultProjectId={projectId}
      />
    </div>
  );
}