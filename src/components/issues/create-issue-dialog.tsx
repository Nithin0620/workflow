"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createIssue } from "@/actions/issues";
import { ISSUE_STATUSES, ISSUE_PRIORITIES } from "@/lib/constants";
import { PlusCircle, X, Loader2 } from "lucide-react";

interface CreateIssueDialogProps {
  projectId: string;
  projectKey: string;
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: string;
}

export function CreateIssueDialog({
  projectId,
  projectKey,
  isOpen,
  onClose,
  defaultStatus = "TODO",
}: CreateIssueDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState<"NO_PRIORITY" | "LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [estimate, setEstimate] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await createIssue(projectId, {
        title,
        description,
        status: status as "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELED",
        priority,
        estimate: estimate ? Number(estimate) : undefined,
      });

      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      setTitle("");
      setDescription("");
      onClose();
      router.refresh();
    } catch {
      setError("Failed to create issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <PlusCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                New Issue
              </h3>
              <span className="text-xs text-neutral-500 font-mono">in {projectKey}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Issue title (e.g. Add Razorpay payment gateway)"
              className="w-full rounded-lg border border-neutral-300 bg-transparent px-3.5 py-2.5 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:text-neutral-100"
            />
          </div>

          <div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description, acceptance criteria, or context (Markdown supported)..."
              className="w-full rounded-lg border border-neutral-300 bg-transparent p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:text-neutral-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Status Picker */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-transparent px-2.5 py-1.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 focus:outline-none"
              >
                {ISSUE_STATUSES.map((s) => (
                  <option key={s.id} value={s.id} className="dark:bg-neutral-800">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Picker */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                className="w-full rounded-lg border border-neutral-300 bg-transparent px-2.5 py-1.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 focus:outline-none"
              >
                {ISSUE_PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id} className="dark:bg-neutral-800">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Story Points / Estimate */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                Story Points
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={estimate}
                onChange={(e) => setEstimate(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Pts (e.g. 5)"
                className="w-full rounded-lg border border-neutral-300 bg-transparent px-2.5 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:text-neutral-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
