"use client";

import { useEffect, useState } from "react";
import {
  X,
  GitBranch,
  Lock,
  Globe,
  Bot,
  Sparkles,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Key,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getProjectRepository,
  connectProjectRepository,
  updateRepositorySettings,
  disconnectProjectRepository,
  testRepositoryConnection,
  ProjectRepoDetails,
} from "@/actions/repositories";
import { runManualBugHunt } from "@/actions/bug-hunt";
import { BranchInfo, RepoMetadata } from "@/lib/github/client";
import { useRouter } from "next/navigation";

interface RepositorySettingsDialogProps {
  projectId: string;
  projectName: string;
  projectKey: string;
  isOpen: boolean;
  onClose: () => void;
  canManage?: boolean;
}

export function RepositorySettingsDialog({
  projectId,
  projectName,
  projectKey,
  isOpen,
  onClose,
  canManage = true,
}: RepositorySettingsDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [repo, setRepo] = useState<ProjectRepoDetails | null>(null);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [metadata, setMetadata] = useState<RepoMetadata | null>(null);

  // Form State
  const [repoUrl, setRepoUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [aiScanEnabled, setAiScanEnabled] = useState(true);
  const [cronSchedule, setCronSchedule] = useState("0 12 * * *");
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // Action states
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [hunting, setHunting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    setStatusMessage(null);
    const res = await getProjectRepository(projectId);
    if (res.success && res.repository) {
      setRepo(res.repository);
      setRepoUrl(res.repository.repoUrl);
      setDefaultBranch(res.repository.defaultBranch);
      setAiScanEnabled(res.repository.aiScanEnabled);
      setCronSchedule(res.repository.cronSchedule || "0 12 * * *");
    } else {
      setRepo(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, projectId]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setSubmitting(true);
    setStatusMessage(null);

    const res = await connectProjectRepository({
      projectId,
      repoUrl: repoUrl.trim(),
      defaultBranch: defaultBranch.trim() || "main",
      accessToken: accessToken.trim() || null,
      aiScanEnabled,
      cronSchedule,
    });

    setSubmitting(false);

    if (res.success && res.repository) {
      setRepo(res.repository);
      setMetadata(res.metadata || null);
      setAccessToken("");
      setStatusMessage({ type: "success", text: "GitHub repository authorized and linked successfully!" });
      router.refresh();
    } else {
      setStatusMessage({ type: "error", text: res.error || "Failed to link repository." });
    }
  };

  const handleUpdate = async () => {
    setSubmitting(true);
    setStatusMessage(null);

    const res = await updateRepositorySettings({
      projectId,
      defaultBranch,
      accessToken: accessToken.trim() || undefined,
      aiScanEnabled,
      cronSchedule,
    });

    setSubmitting(false);

    if (res.success && res.repository) {
      setRepo(res.repository);
      setAccessToken("");
      setStatusMessage({ type: "success", text: "Repository settings updated." });
      router.refresh();
    } else {
      setStatusMessage({ type: "error", text: res.error || "Failed to update settings." });
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setStatusMessage(null);

    const res = await testRepositoryConnection(projectId, accessToken.trim() || undefined);
    setTesting(false);

    if (res.success) {
      setMetadata(res.metadata || null);
      if (res.branches) setBranches(res.branches);
      setStatusMessage({ type: "success", text: "GitHub API connection active and verified!" });
    } else {
      setStatusMessage({ type: "error", text: res.error || "Connection test failed." });
    }
  };

  const handleRunBugHunt = async () => {
    setHunting(true);
    setStatusMessage(null);

    const res = await runManualBugHunt(projectId);
    setHunting(false);

    if (res.success) {
      setStatusMessage({
        type: "success",
        text: res.summary,
      });
      loadData();
      router.refresh();
    } else {
      if (res.error && res.error.includes("GROQ_API_KEY")) {
        const key = prompt("Enter your Groq API Key (gsk_...) to run the autonomous bug hunt:");
        if (key && key.trim()) {
          setHunting(true);
          const r2 = await runManualBugHunt(projectId, key.trim());
          setHunting(false);
          if (r2.success) {
            setStatusMessage({ type: "success", text: r2.summary });
            loadData();
            router.refresh();
            return;
          }
        }
      }
      setStatusMessage({ type: "error", text: res.error || "Bug hunt scan failed." });
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect this repository from the project?")) return;
    setSubmitting(true);
    const res = await disconnectProjectRepository(projectId);
    setSubmitting(false);

    if (res.success) {
      setRepo(null);
      setMetadata(null);
      setBranches([]);
      setRepoUrl("");
      setAccessToken("");
      setStatusMessage({ type: "success", text: "Repository disconnected." });
      router.refresh();
    } else {
      setStatusMessage({ type: "error", text: res.error || "Failed to disconnect." });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-white">
              <Bot className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Repository & AI Agent Authorization</h2>
                <span className="rounded-md border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 font-mono text-[11px] font-bold text-neutral-300">
                  {projectKey}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Link your GitHub repository to enable autonomous code scanning and AI issue fix suggestions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 max-h-[75vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Alert Status Banner */}
              {statusMessage && (
                <div
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-medium ${
                    statusMessage.type === "success"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {statusMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* Connected Repository View */}
              {repo ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">
                            {repo.repoOwner}/{repo.repoName}
                          </span>
                          <span
                            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              repo.status === "ACTIVE"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {repo.status === "ACTIVE" ? "Connected" : "Error"}
                          </span>
                        </div>
                        <a
                          href={repo.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition"
                        >
                          <span>{repo.repoUrl}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleRunBugHunt}
                          disabled={hunting || !repo.aiScanEnabled}
                          title="Run autonomous codebase scan now via Groq AI"
                          className="flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-300 hover:border-emerald-500/60 hover:bg-emerald-500/20 transition disabled:opacity-50"
                        >
                          {hunting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                          )}
                          <span>{hunting ? "Scanning Code..." : "Run Bug Hunt"}</span>
                        </button>
                        <button
                          onClick={handleTestConnection}
                          disabled={testing}
                          title="Verify live GitHub connection"
                          className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${testing ? "animate-spin" : ""}`} />
                          <span>Test Sync</span>
                        </button>
                        {canManage && (
                          <button
                            onClick={handleDisconnect}
                            disabled={submitting}
                            title="Disconnect repository"
                            className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500 hover:text-white transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Unlink</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Meta Stats */}
                    <div className="mt-3 flex flex-wrap gap-4 border-t border-neutral-800/80 pt-3 text-xs text-neutral-400">
                      <div className="flex items-center gap-1.5">
                        <GitBranch className="h-3.5 w-3.5 text-neutral-400" />
                        <span>Branch: <strong className="text-neutral-200">{repo.defaultBranch}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5 text-neutral-400" />
                        <span>Token: <strong className="text-neutral-200">{repo.hasToken ? repo.maskedToken : "Public Only"}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                        <span>Scheduled Scan: <strong className="text-neutral-200">Daily 12:00 PM</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Always Visible Core AI & Schedule Controls */}
                  {canManage && (
                    <div className="space-y-4">
                      {/* AI Scan Toggle */}
                      <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 text-emerald-400" />
                            <span className="text-xs font-bold text-white">AI Autonomous Codebase Fixes & Triage</span>
                          </div>
                          <p className="text-[11px] text-neutral-400">
                            Allow AI to scan repository files and recommend code solutions when issues are opened.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={aiScanEnabled}
                          onChange={(e) => setAiScanEnabled(e.target.checked)}
                          className="h-4 w-4 rounded border-neutral-800 bg-neutral-950 text-white accent-white cursor-pointer"
                        />
                      </div>

                      {/* Scheduled Cron Job Configuration */}
                      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-emerald-400" />
                            <span className="text-xs font-bold text-white">Autonomous Scheduled Bug Hunter</span>
                          </div>
                          <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                            ACTIVE
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          Automatically audits repository code, detects vulnerabilities & bugs, and creates tracked issues on this board.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-neutral-300">Run Schedule</label>
                            <select
                              value={cronSchedule}
                              onChange={(e) => setCronSchedule(e.target.value)}
                              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-neutral-600 focus:outline-none"
                            >
                              <option value="0 12 * * *">Every Day at 12:00 PM (Default)</option>
                              <option value="0 0 * * *">Every Day at Midnight (12:00 AM)</option>
                              <option value="0 */6 * * *">Every 6 Hours</option>
                              <option value="0 */12 * * *">Every 12 Hours</option>
                              <option value="0 9 * * 1">Every Monday at 9:00 AM</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-neutral-300">Cron Webhook Endpoint</label>
                            <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-[11px] font-mono text-neutral-400">
                              <span className="truncate">/api/cron/bug-hunt</span>
                              <span className="text-[10px] text-neutral-500 shrink-0">GET/POST</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Collapsible Branch & PAT Token Preferences */}
                      <div className="rounded-xl border border-neutral-800/80 bg-neutral-950 overflow-hidden shadow-sm transition">
                        <button
                          type="button"
                          onClick={() => setIsPreferencesOpen((prev) => !prev)}
                          className="w-full flex items-center justify-between p-3.5 bg-neutral-900/40 hover:bg-neutral-900/70 transition cursor-pointer text-left"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">Target Scanning Branch & PAT Token</span>
                              <span className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">
                                {repo.defaultBranch}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400">
                              Customize default branch selection and update personal access credentials.
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                            <span className="text-[11px]">{isPreferencesOpen ? "Hide" : "Expand"}</span>
                            {isPreferencesOpen ? (
                              <ChevronUp className="h-4 w-4 text-neutral-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-neutral-400" />
                            )}
                          </div>
                        </button>

                        {isPreferencesOpen && (
                          <div className="p-4 border-t border-neutral-800/80 space-y-4">
                            {/* Default Branch */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-neutral-300">Target Scanning Branch</label>
                              {branches.length > 0 ? (
                                <select
                                  value={defaultBranch}
                                  onChange={(e) => setDefaultBranch(e.target.value)}
                                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-neutral-600 focus:outline-none"
                                >
                                  {branches.map((b) => (
                                    <option key={b.name} value={b.name}>
                                      {b.name} {b.isDefault ? "(default)" : ""}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={defaultBranch}
                                  onChange={(e) => setDefaultBranch(e.target.value)}
                                  placeholder="main"
                                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-neutral-600 focus:outline-none"
                                />
                              )}
                            </div>

                            {/* Access Token Update */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-neutral-300">
                                Update Personal Access Token (PAT)
                              </label>
                              <input
                                type="password"
                                value={accessToken}
                                onChange={(e) => setAccessToken(e.target.value)}
                                placeholder="Leave empty to keep current token, or paste new ghp_..."
                                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleUpdate}
                        disabled={submitting}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black hover:bg-neutral-200 transition disabled:opacity-50 w-full"
                      >
                        {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        <span>Save Settings & Schedule</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Connect New Repository Form */
                <form onSubmit={handleConnect} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300">
                      GitHub Repository URL or Shorthand <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="e.g. facebook/react or https://github.com/vercel/next.js"
                      required
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-300">Default Branch</label>
                      <input
                        type="text"
                        value={defaultBranch}
                        onChange={(e) => setDefaultBranch(e.target.value)}
                        placeholder="main"
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-300">
                        Personal Access Token (PAT)
                      </label>
                      <input
                        type="password"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="ghp_... (required for private repos)"
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* AI Toggles & Schedule */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">Enable AI Code Scanner & Auto-Triage</span>
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          Allows AI agent to read repository code structure, triage incoming bugs, and suggest diffs.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={aiScanEnabled}
                        onChange={(e) => setAiScanEnabled(e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-800 bg-neutral-950 text-white accent-white cursor-pointer"
                      />
                    </div>

                    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">Scheduled Daily Bug Hunter (Cron)</span>
                      </div>
                      <select
                        value={cronSchedule}
                        onChange={(e) => setCronSchedule(e.target.value)}
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-neutral-600 focus:outline-none"
                      >
                        <option value="0 12 * * *">Every Day at 12:00 PM (Default)</option>
                        <option value="0 0 * * *">Every Day at Midnight (12:00 AM)</option>
                        <option value="0 */6 * * *">Every 6 Hours</option>
                        <option value="0 */12 * * *">Every 12 Hours</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-900 hover:text-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !repoUrl.trim()}
                      className="flex items-center gap-1.5 rounded-xl bg-white px-5 py-2 text-xs font-bold text-black hover:bg-neutral-200 transition disabled:opacity-50"
                    >
                      {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>Authorize & Link Repository</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
