"use client";

import { useEffect, useState } from "react";
import { getProjectSprints, createSprint, setSprintActive, updateSprint, deleteSprint } from "@/actions/sprints";
import { updateIssueDetails, type UpdateIssueInput } from "@/actions/issues";
import { formatIssueKey, formatDate } from "@/lib/utils";
import { X, Loader2, Play, CheckCircle2, Trash2, Flag, Plus, Layers } from "lucide-react";

interface SprintSummary {
  id: string;
  name: string;
  number: number;
  goal?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;
  openIssueCount: number;
  openEstimate: number;
}

interface BacklogIssue {
  id: string;
  projectKey: string;
  issueNumber: number;
  title: string;
  status: string;
  estimate?: number | null;
}

interface SprintManagementDialogProps {
  projectId: string;
  projectKey: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SprintManagementDialog({
  projectId,
  projectKey,
  isOpen,
  onClose,
}: SprintManagementDialogProps) {
  const [sprints, setSprints] = useState<SprintSummary[]>([]);
  const [backlog, setBacklog] = useState<BacklogIssue[]>([]);
  const [totalIssueCount, setTotalIssueCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newStart, setNewStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [newEnd, setNewEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });

  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    getProjectSprints(projectId)
      .then((data) => {
        setSprints(data.sprints as SprintSummary[]);
        setBacklog(data.backlogIssues as BacklogIssue[]);
        setTotalIssueCount(data.totalIssueCount);
        setDoneCount(data.doneCount);
      })
      .finally(() => setLoading(false));
  }, [projectId, isOpen]);

  if (!isOpen) return null;

  const refresh = async () => {
    const data = await getProjectSprints(projectId);
    setSprints(data.sprints as SprintSummary[]);
    setBacklog(data.backlogIssues as BacklogIssue[]);
    setTotalIssueCount(data.totalIssueCount);
    setDoneCount(data.doneCount);
  };

  const run = async (fn: () => Promise<unknown>) => {
    setWorking(true);
    try {
      await fn();
      await refresh();
    } finally {
      setWorking(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await run(async () => {
      await createSprint(projectId, {
        name: newName.trim(),
        goal: newGoal.trim() || undefined,
        startDate: new Date(`${newStart}T00:00:00`).toISOString(),
        endDate: new Date(`${newEnd}T00:00:00`).toISOString(),
      });
    });
    setNewName("");
    setNewGoal("");
    setShowCreate(false);
  };

  const handleAssign = async (issueId: string, sprintId: string) => {
    const res = await updateIssueDetails(issueId, { sprintId: sprintId || null } as UpdateIssueInput);
    if (res.success) await refresh();
  };

  const activeSprint = sprints.find((s) => s.isActive);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-neutral-800 bg-[#0a0a0a] text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-3.5 bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <Flag className="h-4 w-4 text-neutral-300" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Sprint Planning</h3>
            <span className="font-mono text-[10px] text-neutral-500 bg-neutral-950 border border-neutral-800 px-1.5 py-0.5 rounded">{projectKey}</span>
          </div>
          <div className="flex items-center gap-3">
            {totalIssueCount > 0 && (
              <span className="text-[11px] text-neutral-400">
                {Math.round((doneCount / totalIssueCount) * 100)}% done ({doneCount}/{totalIssueCount})
              </span>
            )}
            <button onClick={onClose} className="cursor-pointer rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
          ) : (
            <>
              {/* Sprint List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                    Sprints ({sprints.length})
                  </h4>
                  <button
                    onClick={() => setShowCreate((v) => !v)}
                    className="cursor-pointer flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-neutral-300 hover:border-neutral-600 hover:text-white transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Sprint
                  </button>
                </div>

                {showCreate && (
                  <form onSubmit={handleCreate} className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                    <input
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Sprint name (e.g. Checkout Redesign)"
                      className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
                    />
                    <input
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="Sprint goal (optional)"
                      className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Start</span>
                        <input
                          type="date"
                          value={newStart}
                          onChange={(e) => setNewStart(e.target.value)}
                          className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:border-neutral-600 focus:outline-none"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">End</span>
                        <input
                          type="date"
                          value={newEnd}
                          onChange={(e) => setNewEnd(e.target.value)}
                          className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:border-neutral-600 focus:outline-none"
                        />
                      </label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setShowCreate(false)} className="cursor-pointer rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition">
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={working}
                        className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-black hover:bg-neutral-200 transition disabled:opacity-50"
                      >
                        {working ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Create
                      </button>
                    </div>
                  </form>
                )}

                {sprints.map((s) => (
                  <div
                    key={s.id}
                    className={`rounded-xl border p-4 transition ${
                      s.isActive ? "border-white/40 bg-neutral-900" : "border-neutral-800 bg-neutral-900/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        {renameId === s.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              value={renameName}
                              onChange={(e) => setRenameName(e.target.value)}
                              className="w-full sm:w-48 rounded-lg border border-neutral-800 bg-black px-2.5 py-1 text-xs text-white focus:border-neutral-600 focus:outline-none"
                            />
                            <button
                              onClick={async () => {
                                if (!renameName.trim()) return;
                                await run(async () => {
                                  await updateSprint(s.id, { name: renameName.trim() });
                                });
                                setRenameId(null);
                              }}
                              className="cursor-pointer rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-black"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <p className="flex items-center gap-2 text-sm font-bold text-white">
                            {s.isActive && (
                              <span className="flex h-2 w-2 items-center justify-center">
                                <span className="absolute h-2 w-2 animate-ping rounded-full bg-emerald-400/70" />
                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                              </span>
                            )}
                            <span onClick={() => { setRenameId(s.id); setRenameName(s.name); }} className="cursor-pointer hover:underline">
                              Sprint {s.number} — {s.name}
                            </span>
                          </p>
                        )}
                        {s.goal && <p className="mt-0.5 text-xs text-neutral-400">{s.goal}</p>}
                        <p className="mt-1 text-[11px] text-neutral-500">
                          {formatDate(s.startDate)} → {formatDate(s.endDate)}
                          {" · "}
                          <Layers className="inline h-3 w-3" /> {s.openIssueCount} open · {s.openEstimate} pts
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {s.isActive ? (
                          <button
                            onClick={() => run(() => setSprintActive(s.id, false))}
                            disabled={working}
                            className="cursor-pointer flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-xs font-bold text-neutral-200 hover:border-neutral-600 transition disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            Complete
                          </button>
                        ) : (
                          <button
                            onClick={() => run(() => setSprintActive(s.id, true))}
                            disabled={working || !!activeSprint}
                            title={activeSprint ? `Sprint ${activeSprint.number} is already active` : "Start sprint"}
                            className="cursor-pointer flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-black hover:bg-neutral-200 transition disabled:opacity-50"
                          >
                            <Play className="h-3.5 w-3.5" />
                            Start
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (!window.confirm(`Delete Sprint ${s.number} and move its issues to the backlog?`)) return;
                            run(() => deleteSprint(s.id));
                          }}
                          disabled={working}
                          className="cursor-pointer rounded-lg p-1.5 text-neutral-500 hover:bg-rose-950/50 hover:text-rose-400 transition disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {sprints.length === 0 && (
                  <div className="rounded-xl border border-dashed border-neutral-800 p-6 text-center text-xs text-neutral-500">
                    No sprints yet — create one to start planning.
                  </div>
                )}
              </div>

              {/* Backlog Drawer */}
              <div className="space-y-2 border-t border-neutral-800 pt-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                  Backlog ({backlog.length} unassigned)
                </h4>
                {backlog.length === 0 && (
                  <p className="py-4 text-center text-xs text-neutral-500">Backlog is empty. All issues are in a sprint.</p>
                )}
                <div className="space-y-2">
                  {backlog.map((issue) => (
                    <div key={issue.id} className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2">
                      <span className="font-mono text-[10px] font-bold text-neutral-400">
                        {formatIssueKey(issue.projectKey, issue.issueNumber)}
                      </span>
                      <p className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-200">{issue.title}</p>
                      <select
                        value=""
                        onChange={(e) => e.target.value && handleAssign(issue.id, e.target.value)}
                        className="rounded-lg border border-neutral-800 bg-black px-2 py-1 text-[11px] font-semibold text-neutral-300 focus:border-neutral-600 focus:outline-none"
                      >
                        <option value="">Assign →</option>
                        {sprints.map((s) => (
                          <option key={s.id} value={s.id} className="bg-black text-white">
                            Sprint {s.number} — {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}