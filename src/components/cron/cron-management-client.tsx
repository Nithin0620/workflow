"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Bot,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  GitBranch,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Calendar,
  Layers,
  Terminal,
  FileCode2,
  Sparkles,
  Plus,
  Settings,
} from "lucide-react";
import { RepositorySettingsDialog } from "@/components/repositories/repository-settings-dialog";
import {
  getWorkspaceRepositoriesOverview,
  getCronExecutionHistory,
  runManualBugHunt,
  runWorkspaceBugHunts,
  WorkspaceRepoOverviewItem,
  CronLogItem,
} from "@/actions/bug-hunt";
import { useRouter } from "next/navigation";

interface CronManagementClientProps {
  workspaceId: string;
  workspaceName: string;
  orgSlug: string;
  workspaceSlug: string;
  canManage: boolean;
}

export function CronManagementClient({
  workspaceId,
  workspaceName,
  orgSlug,
  workspaceSlug,
  canManage,
}: CronManagementClientProps) {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runningAll, setRunningAll] = useState(false);
  const [runningProjectId, setRunningProjectId] = useState<string | null>(null);

  const [projectsOverview, setProjectsOverview] = useState<WorkspaceRepoOverviewItem[]>([]);
  const [logs, setLogs] = useState<CronLogItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"ALL" | "SUCCESS" | "FAILED">("ALL");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [activeProjectForDialog, setActiveProjectForDialog] = useState<WorkspaceRepoOverviewItem | null>(null);

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [overviewRes, historyRes] = await Promise.all([
      getWorkspaceRepositoriesOverview(workspaceId),
      getCronExecutionHistory(workspaceId),
    ]);

    if (overviewRes.success) {
      setProjectsOverview(overviewRes.overview);
    }
    if (historyRes.success) {
      setLogs(historyRes.logs);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setNotification(null);
    await fetchData();
    setRefreshing(false);
  };

  const handleRunSingleProject = async (projectId: string) => {
    setRunningProjectId(projectId);
    setNotification(null);

    const res = await runManualBugHunt(projectId);
    setRunningProjectId(null);

    if (res.success) {
      setNotification({ type: "success", text: res.summary });
      fetchData();
      router.refresh();
    } else {
      if (res.error?.includes("GROQ_API_KEY")) {
        const key = prompt("Enter your Groq API Key (gsk_...) to run the bug hunter:");
        if (key && key.trim()) {
          setRunningProjectId(projectId);
          const r2 = await runManualBugHunt(projectId, key.trim());
          setRunningProjectId(null);
          if (r2.success) {
            setNotification({ type: "success", text: r2.summary });
            fetchData();
            router.refresh();
            return;
          }
        }
      }
      setNotification({ type: "error", text: res.error || "Execution failed." });
    }
  };

  const handleRunAllProjects = async () => {
    setRunningAll(true);
    setNotification(null);

    const res = await runWorkspaceBugHunts(workspaceId);
    setRunningAll(false);

    if (res.success) {
      setNotification({ type: "success", text: res.summary });
      fetchData();
      router.refresh();
    } else {
      setNotification({ type: "error", text: "Failed to complete all project scans." });
    }
  };

  // Filtered logs
  const filteredLogs = logs.filter((log) => {
    const matchesProject =
      selectedProjectId === "ALL" || log.projectId === selectedProjectId;
    const matchesStatus =
      selectedStatusFilter === "ALL" || log.status === selectedStatusFilter;
    return matchesProject && matchesStatus;
  });

  const activeReposCount = projectsOverview.filter(
    (p) => p.repository && p.repository.status === "ACTIVE"
  ).length;

  const totalFindingsRecorded = logs.reduce((acc, l) => acc + l.findingsCount, 0);
  const totalIssuesCreatedCount = logs.reduce((acc, l) => acc + l.issuesCreated, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-white pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Cron Jobs & AI Bug Hunter
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                  Daily 12:00 PM
                </span>
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Manage scheduled autonomous code reviews, inspect deep execution logs, and monitor repository health for <strong className="text-neutral-200">{workspaceName}</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh execution logs"
            className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-300 hover:border-neutral-700 hover:text-white transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {canManage && (
            <button
              onClick={() => {
                const unlinked = projectsOverview.find((p) => !p.repository || p.repository.status !== "ACTIVE");
                setActiveProjectForDialog(unlinked || projectsOverview[0] || null);
              }}
              title="Add or link repository cron job"
              className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-300 hover:border-neutral-700 hover:text-white transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add / Link Cron Job</span>
            </button>
          )}

          {canManage && activeReposCount > 0 && (
            <button
              onClick={handleRunAllProjects}
              disabled={runningAll}
              className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-neutral-200 transition disabled:opacity-50"
            >
              {runningAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
              <span>{runningAll ? "Scanning Workspace..." : "Run All Scans"}</span>
            </button>
          )}
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

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Connected Repos</span>
            <GitBranch className="h-4 w-4 text-white" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {activeReposCount} <span className="text-sm font-normal text-neutral-500">/ {projectsOverview.length}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Total Runs</span>
            <Clock className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">{logs.length}</div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Bugs Discovered</span>
            <ShieldAlert className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-amber-400">{totalFindingsRecorded}</div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Issues Auto-Created</span>
            <Bot className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-400">{totalIssuesCreatedCount}</div>
        </div>
      </div>

      {/* Project Repositories Overview & Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
            PROJECT REPOSITORIES & SCHEDULE CONFIG
          </h2>
          <span className="text-xs text-neutral-500">{projectsOverview.length} Projects Total</span>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectsOverview.map((item) => {
              const isRunning = runningProjectId === item.projectId;
              const hasRepo = item.repository && item.repository.status === "ACTIVE";

              return (
                <div
                  key={item.projectId}
                  className="flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-lg space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color || "#3b82f6" }}
                        />
                        <div>
                          <h3 className="font-bold text-white text-sm">{item.projectName}</h3>
                          <span className="font-mono text-[11px] text-neutral-400">
                            {item.projectKey}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          hasRepo
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-neutral-900 border border-neutral-800 text-neutral-400"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {hasRepo ? "Active" : "Not Linked"}
                      </span>
                    </div>

                    {hasRepo ? (
                      <div className="space-y-1.5 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs">
                        <div className="flex items-center justify-between text-neutral-300">
                          <span className="font-medium truncate">
                            {item.repository?.repoOwner}/{item.repository?.repoName}
                          </span>
                          <span className="font-mono text-[11px] text-emerald-400 font-bold shrink-0">
                            {item.repository?.defaultBranch}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800">
                          <span>Schedule:</span>
                          <span className="font-semibold text-neutral-200">
                            {item.repository?.cronSchedule === "0 12 * * *" ? "Daily 12:00 PM" : item.repository?.cronSchedule || "Daily 12:00 PM"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/30 p-3 text-xs text-neutral-500 italic">
                        No repository connected. Open project board to link GitHub.
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-900 pt-3 text-xs">
                    <button
                      onClick={() => setActiveProjectForDialog(item)}
                      title="Configure repository connection & schedule settings"
                      className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-white transition"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>{hasRepo ? "Configure Schedule" : "Connect & Add Job"}</span>
                    </button>

                    {hasRepo && canManage && (
                      <button
                        onClick={() => handleRunSingleProject(item.projectId)}
                        disabled={isRunning}
                        className="flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-300 hover:border-emerald-500/70 hover:bg-emerald-500/20 transition disabled:opacity-50"
                      >
                        {isRunning ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3 text-emerald-400" />
                        )}
                        <span>{isRunning ? "Scanning..." : "Run Hunt"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog for Adding / Configuring Cron Job on Project */}
      {activeProjectForDialog && (
        <RepositorySettingsDialog
          projectId={activeProjectForDialog.projectId}
          projectName={activeProjectForDialog.projectName}
          projectKey={activeProjectForDialog.projectKey}
          isOpen={true}
          onClose={() => {
            setActiveProjectForDialog(null);
            fetchData();
          }}
          canManage={canManage}
        />
      )}

      {/* Execution Logs & Deep Inspection */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
              EXECUTION LOGS & AUDIT TRAIL
            </h2>
            <p className="text-xs text-neutral-400">
              Complete history of automated cron scans and manual Groq AI bug findings.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:border-neutral-700 focus:outline-none"
            >
              <option value="ALL">All Projects</option>
              {projectsOverview.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.projectName} ({p.projectKey})
                </option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:border-neutral-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success Only</option>
              <option value="FAILED">Failed Only</option>
            </select>
          </div>
        </div>

        {/* Logs Table / Cards */}
        {loading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-12 text-center text-neutral-400 space-y-2">
            <Clock className="h-8 w-8 mx-auto text-neutral-600" />
            <p className="text-sm font-semibold text-white">No execution logs found</p>
            <p className="text-xs text-neutral-500">
              Run a scan or wait for the daily 12:00 PM automated cron job to generate logs.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              let parsedFindings: any[] = [];
              if (log.rawOutput) {
                try {
                  parsedFindings = JSON.parse(log.rawOutput);
                } catch {}
              }

              return (
                <div
                  key={log.id}
                  className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-md transition"
                >
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 cursor-pointer hover:bg-neutral-900/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                          log.status === "SUCCESS"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {log.status === "SUCCESS" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {log.projectName || "Workspace Scan"}
                          </span>
                          {log.projectKey && (
                            <span className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.2 font-mono text-[10px] text-neutral-400">
                              {log.projectKey}
                            </span>
                          )}
                          <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-300">
                            {log.triggerSource}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">{log.summary}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-neutral-400">
                      <div className="text-right">
                        <div className="text-neutral-200 font-medium">
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          • {new Date(log.createdAt).toLocaleDateString()}
                        </div>
                        <span className="text-[11px] text-neutral-500">{log.durationMs}ms</span>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-neutral-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-neutral-400" />
                      )}
                    </div>
                  </div>

                  {/* Deep Details Drawer */}
                  {isExpanded && (
                    <div className="border-t border-neutral-800 bg-neutral-900/40 p-5 space-y-4">
                      {log.error && (
                        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 font-mono">
                          <strong>Error Details:</strong> {log.error}
                        </div>
                      )}

                      {parsedFindings.length > 0 ? (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
                            DETECTED BUGS & RECOMMENDED PATCHES ({parsedFindings.length})
                          </h4>
                          {parsedFindings.map((finding, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-xs">
                                  {finding.title}
                                </span>
                                <span
                                  className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${
                                    finding.severity === "HIGH" || finding.severity === "URGENT"
                                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  }`}
                                >
                                  {finding.severity}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                                <FileCode2 className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="font-mono text-neutral-300">{finding.filePath}</span>
                              </div>

                              <p className="text-xs text-neutral-300 leading-relaxed">
                                {finding.rootCause}
                              </p>

                              {finding.proposedPatch && (
                                <pre className="rounded-lg border border-neutral-800 bg-neutral-900/90 p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                                  <code>{finding.proposedPatch}</code>
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-neutral-400 font-mono">
                          No active flaws or warnings detected during this run.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
