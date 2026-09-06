"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Clock, Bot, GitBranch, ChevronDown, ChevronUp } from "lucide-react";
import {
  createCronJob,
  getCronProjectOptions,
} from "@/actions/cron-jobs";

interface CreateCronJobDialogProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultProjectId?: string;
}

const SCHEDULE_PRESETS = [
  { value: "0 * * * *", label: "Every Hour" },
  { value: "0 */6 * * *", label: "Every 6 Hours" },
  { value: "0 */12 * * *", label: "Every 12 Hours" },
  { value: "0 0 * * *", label: "Every Day at Midnight" },
  { value: "0 12 * * *", label: "Every Day at 12:00 PM" },
  { value: "0 9 * * 1", label: "Every Monday at 9:00 AM" },
  { value: "0 9 * * 1-5", label: "Weekdays at 9:00 AM" },
];

export function CreateCronJobDialog({
  workspaceId,
  isOpen,
  onClose,
  onCreated,
  defaultProjectId,
}: CreateCronJobDialogProps) {
  const [projects, setProjects] = useState<{ id: string; name: string; key: string; repo?: { owner: string; name: string; branch: string } | null }[]>([]);
  const [projectId, setProjectId] = useState(defaultProjectId || "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState("0 12 * * *");
  const [repoMode, setRepoMode] = useState<"PROJECT" | "OTHER" | "CUSTOM">("PROJECT");
  const [otherProjectId, setOtherProjectId] = useState("");
  const [customRepo, setCustomRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [accessToken, setAccessToken] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setLoading(true);
      setError(null);
      setSubmitting(false);
      setProjects([]);
      if (defaultProjectId) setProjectId(defaultProjectId);
    });
    getCronProjectOptions(workspaceId).then((res) => {
      if (res.success) setProjects(res.projects);
      setLoading(false);
    });
  }, [isOpen, workspaceId, defaultProjectId]);

  const selectedProject = projects.find((p) => p.id === projectId);
  const otherProject = projects.find((p) => p.id === otherProjectId);
  const targetRepo =
    repoMode === "PROJECT"
      ? selectedProject?.repo
      : repoMode === "OTHER"
      ? otherProject?.repo
      : null;

  const resolveRepo = (): { owner: string; name: string; branch: string } | { error: string } => {
    if (repoMode !== "CUSTOM") {
      if (!targetRepo) return { error: "Selected project has no linked repository. Choose another project's repo or paste a custom GitHub URL." };
      return { owner: targetRepo.owner, name: targetRepo.name, branch: branch.trim() || targetRepo.branch };
    }
    const clean = customRepo.trim().replace(/\.git$/, "").replace(/\/$/, "");
    const match = clean.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/(.+?)\/(.+?)$/i) || clean.match(/^(.+?)\/(.+?)$/);
    if (!match) return { error: "Invalid GitHub repository. Use owner/repo or a full GitHub URL." };
    return { owner: match[1], name: match[2], branch: branch.trim() || "main" };
  };

  const handleSubmit = async () => {
    if (!projectId) {
      setError("Select a project for this cron job.");
      return;
    }
    if (!name.trim()) {
      setError("Give this cron job a name.");
      return;
    }
    const repo = resolveRepo();
    if ("error" in repo) {
      setError(repo.error);
      return;
    }

    setSubmitting(true);
    setError(null);
    const res = await createCronJob({
      workspaceId,
      projectId,
      name,
      description: description || null,
      schedule,
      repoOwner: repo.owner,
      repoName: repo.name,
      defaultBranch: repo.branch,
      accessToken: accessToken.trim() || null,
    });
    setSubmitting(false);

    if (res.success) {
      onCreated();
      onClose();
    } else {
      setError(res.error || "Failed to create cron job.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">New Cron Job</h2>
              <p className="text-xs text-neutral-400">
                Schedule an automated AI scan with a custom description & target repository.
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

        <div className="mt-4 max-h-[75vh] overflow-y-auto pr-1 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
            </div>
          ) : (
            <>
              {/* Project link */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  Linked Project <span className="text-rose-400">*</span>
                </label>
                <select
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    if (repoMode === "PROJECT" && !branch) setBranch("main");
                  }}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-xs text-white focus:border-neutral-600 focus:outline-none"
                >
                  <option value="">Select a project in this workspace...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key}){p.repo ? ` — ${p.repo.owner}/${p.repo.name}` : " — no repo"}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-500">
                  Issues created by this job land on this project&apos;s board.
                </p>
              </div>

              {/* Name & description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nightly security sweep on payments"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  What should this job do?
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. Focus on authentication flows, race conditions and unhandled promises. Skip the frontend styling code."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
                />
                <p className="text-[11px] text-neutral-500">
                  Sent to the AI agent as an instruction — this is what makes each job unique.
                </p>
              </div>

              {/* Schedule */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Schedule</label>
                <select
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-xs text-white focus:border-neutral-600 focus:outline-none"
                >
                  {SCHEDULE_PRESETS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <input
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  spellCheck={false}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-[11px] font-mono text-emerald-300 focus:border-neutral-600 focus:outline-none"
                />
              </div>

              {/* Repository target */}
              <div className="space-y-2.5 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3.5">
                <div className="flex items-center gap-1.5">
                  <GitBranch className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Target Repository</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { mode: "PROJECT" as const, label: "Project&apos;s repo" },
                    { mode: "OTHER" as const, label: "Another project&apos;s repo" },
                    { mode: "CUSTOM" as const, label: "Custom GitHub URL" },
                  ].map((opt) => (
                    <button
                      key={opt.mode}
                      type="button"
                      onClick={() => setRepoMode(opt.mode)}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                        repoMode === opt.mode
                          ? "border-white bg-white text-black"
                          : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {repoMode !== "CUSTOM" ? (
                  <>
                    {repoMode === "OTHER" && (
                      <select
                        value={otherProjectId}
                        onChange={(e) => setOtherProjectId(e.target.value)}
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-neutral-600 focus:outline-none"
                      >
                        <option value="">Pick a project whose repo to scan...</option>
                        {projects
                          .filter((p) => p.id !== projectId && p.repo)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.key}) — {p.repo?.owner}/{p.repo?.name}
                            </option>
                          ))}
                      </select>
                    )}
                    {targetRepo ? (
                      <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-300 font-mono">
                        {targetRepo.owner}/{targetRepo.name}
                        <span className="text-emerald-400"> @ {branch.trim() || targetRepo.branch}</span>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-[11px] text-neutral-500">
                        {repoMode === "PROJECT"
                          ? "The selected project has no linked repository. Use another project&apos;s repo or a custom URL."
                          : "No repositories found for other projects."}
                      </div>
                    )}
                  </>
                ) : (
                  <input
                    value={customRepo}
                    onChange={(e) => setCustomRepo(e.target.value)}
                    placeholder="Use owner/repo or https://github.com/owner/repo"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
                  />
                )}

                <button
                  type="button"
                  onClick={() => setAdvancedOpen((v) => !v)}
                  className="flex w-full items-center justify-between text-[11px] font-semibold text-neutral-400 hover:text-white transition"
                >
                  <span>Branch & access token</span>
                  {advancedOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                {advancedOpen && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-neutral-300">Branch</label>
                      <input
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="main"
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-neutral-600 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-neutral-300">
                        Access Token (ghp_...)
                      </label>
                      <input
                        type="password"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="Required for private repos"
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-900 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-white px-5 py-2 text-xs font-bold text-black hover:bg-neutral-200 transition disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <Bot className="h-4 w-4" />
                  <span>Create Cron Job</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}