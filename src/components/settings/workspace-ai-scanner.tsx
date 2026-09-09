"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bot,
  Sparkles,
  GitBranch,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
  Play,
} from "lucide-react";
import {
  getWorkspaceRepositoriesOverview,
  runWorkspaceBugHunts,
  WorkspaceRepoOverviewItem,
} from "@/actions/bug-hunt";
import { useRouter } from "next/navigation";

interface WorkspaceAiScannerProps {
  workspaceId: string;
  canManage?: boolean;
}

export function WorkspaceAiScanner({
  workspaceId,
  canManage = true,
}: WorkspaceAiScannerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [runningAll, setRunningAll] = useState(false);
  const [items, setItems] = useState<WorkspaceRepoOverviewItem[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchOverview = useCallback(async () => {
    const res = await getWorkspaceRepositoriesOverview(workspaceId);
    return res;
  }, [workspaceId]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      const res = await fetchOverview();
      if (mounted) {
        if (res.success) {
          setItems(res.overview);
        }
        setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [fetchOverview]);

  const handleRunAllScans = async () => {
    setRunningAll(true);
    setMessage(null);

    const res = await runWorkspaceBugHunts(workspaceId);
    setRunningAll(false);

    if (res.success) {
      setMessage({ type: "success", text: res.summary });
      const refreshedRes = await fetchOverview();
      if (refreshedRes.success) {
        setItems(refreshedRes.overview);
      }
      router.refresh();
    } else {
      setMessage({ type: "error", text: "Failed to complete workspace bug hunts." });
    }
  };

  const connectedCount = items.filter((i) => i.repository && i.repository.status === "ACTIVE").length;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Autonomous AI Codebase Scanners</h2>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                Daily 12:00 PM
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Proactive static code review & bug detection powered by Groq AI across all workspace project repositories.
            </p>
          </div>
        </div>

        {canManage && connectedCount > 0 && (
          <button
            onClick={handleRunAllScans}
            disabled={runningAll}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:border-emerald-500/70 hover:bg-emerald-500/20 transition disabled:opacity-50 shrink-0"
          >
            {runningAll ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            ) : (
              <Play className="h-4 w-4 text-emerald-400" />
            )}
            <span>{runningAll ? "Scanning Workspace..." : "Run All Scans Now"}</span>
          </button>
        )}
      </div>

      {/* Automated Cron Schedule Info Card */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">Scheduled Automation Info (Daily 12:00 PM)</span>
          </div>
          <span className="rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 font-mono text-[10px] text-neutral-400">
            0 12 * * *
          </span>
        </div>
        <p className="text-[11px] text-neutral-400">
          The autonomous bug hunter runs daily across all repositories with AI scan enabled. You can also trigger it from Vercel Cron, GitHub Actions, or webhook via:
        </p>
        <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 font-mono text-[11px] text-neutral-300">
          <code>curl -X POST https://your-domain.com/api/cron/bug-hunt</code>
          <span className="text-[10px] text-emerald-400 font-semibold">GET / POST</span>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-medium ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/30 bg-rose-500/10 text-rose-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-6 text-center text-xs text-neutral-500">
          No projects found in this workspace.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.projectId}
              className="flex flex-col justify-between rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color || "#3b82f6" }}
                    />
                    <h3 className="font-bold text-white text-sm">{item.projectName}</h3>
                    <span className="font-mono text-[11px] text-neutral-400 bg-neutral-950 border border-neutral-800 px-1.5 py-0.5 rounded">
                      {item.projectKey}
                    </span>
                  </div>

                  {item.repository ? (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <GitBranch className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-neutral-200 font-semibold">
                        {item.repository.repoOwner}/{item.repository.repoName}
                      </span>
                      <span className="text-[11px] text-neutral-400">({item.repository.defaultBranch})</span>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-500 italic">No repository linked yet</p>
                  )}
                </div>

                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    item.repository?.status === "ACTIVE"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {item.repository?.status === "ACTIVE" ? "AI Enabled" : "Not Linked"}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-neutral-800/60 pt-2.5 text-xs text-neutral-400">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-neutral-400" />
                  <span>
                    Last scanned:{" "}
                    <strong className="text-neutral-300">
                      {item.repository?.lastScannedAt
                        ? new Date(item.repository.lastScannedAt).toLocaleDateString()
                        : "Never"}
                    </strong>
                  </span>
                </div>

                {item.aiBugReportCount > 0 && (
                  <span className="flex items-center gap-1 font-semibold text-amber-400">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {item.aiBugReportCount} bug report(s)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
