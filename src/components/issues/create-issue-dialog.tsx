"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createIssue } from "@/actions/issues";
import { ISSUE_STATUSES, ISSUE_PRIORITIES } from "@/lib/constants";
import { PlusCircle, X, Loader2 } from "lucide-react";

interface ColumnOption {
  id: string;
  name: string;
  key: string;
  color?: string;
}

interface CreateIssueDialogProps {
  projectId: string;
  projectKey: string;
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: string;
  columns?: ColumnOption[];
}

export function CreateIssueDialog({
  projectId,
  projectKey,
  isOpen,
  onClose,
  defaultStatus = "TODO",
  columns = [],
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

  const statusOptions =
    columns.length > 0
      ? columns.map((c) => ({ id: c.key, label: c.name }))
      : ISSUE_STATUSES.map((s) => ({ id: s.id, label: s.label }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await createIssue(projectId, {
        title,
        description,
        status: status as any,
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
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("workflow_notification_updated"));
      }
      onClose();
      router.refresh();
    } catch {
      setError("Failed to create issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black font-bold">
              <PlusCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                New Issue
              </h3>
              <span className="text-xs text-neutral-400 font-mono">in {projectKey}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-950/50 border border-rose-900 p-3 text-xs text-rose-300">
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
              className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-sm font-medium text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
            />
          </div>

          <div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description, acceptance criteria, or context (Markdown supported)..."
              className="w-full rounded-xl border border-neutral-800 bg-black p-3 text-xs text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Status Picker */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono mb-1">
                List / Column
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:border-neutral-600 focus:outline-none"
              >
                {statusOptions.map((s) => (
                  <option key={s.id} value={s.id} className="bg-black text-white">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Picker */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:border-neutral-600 focus:outline-none"
              >
                {ISSUE_PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id} className="bg-black text-white">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Story Points / Estimate */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono mb-1">
                Story Points
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={estimate}
                onChange={(e) => setEstimate(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Pts (e.g. 5)"
                className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-900">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-black shadow-lg hover:bg-neutral-200 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
