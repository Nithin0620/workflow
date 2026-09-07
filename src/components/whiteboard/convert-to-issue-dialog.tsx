"use client";

import React, { useState } from "react";
import { FolderKanban, CheckSquare, X, Plus } from "lucide-react";
import { createIssue } from "@/actions/issues";

interface ConvertToIssueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle: string;
  whiteboardId: string;
  whiteboardTitle: string;
  projects: Array<{ id: string; name: string; key: string; color?: string | null }>;
  onCreated?: (issue: any) => void;
}

export function ConvertToIssueDialog({
  isOpen,
  onClose,
  initialTitle,
  whiteboardId,
  whiteboardTitle,
  projects,
  onCreated,
}: ConvertToIssueDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || ""
  );
  const [title, setTitle] = useState(initialTitle);
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError("Please select a project to create this issue in.");
      return;
    }
    if (!title.trim()) {
      setError("Issue title is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const description = `Originated from Whiteboard: **${whiteboardTitle}**`;

      const res = await createIssue(selectedProjectId, {
        title: title.trim(),
        description,
        status: "TODO",
        priority,
      });

      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      onCreated?.(res.issue);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create issue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl text-white">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-900 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Convert to Kanban Issue</h3>
            <p className="text-xs text-neutral-400">Turn this sticky note or idea into an actionable task</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleConvert} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-neutral-300">Target Project</label>
            <div className="mt-1.5 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {projects.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                    selectedProjectId === p.id
                      ? "border-purple-500 bg-purple-500/20 text-purple-300"
                      : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                  }`}
                >
                  <FolderKanban className="h-3.5 w-3.5" style={{ color: p.color || "#3b82f6" }} />
                  {p.name} ({p.key})
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300">Issue Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300">Priority</label>
            <div className="mt-1.5 flex gap-2">
              {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-all ${
                    priority === p
                      ? "border-purple-500 bg-purple-500/20 text-purple-300"
                      : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-900 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-medium text-white shadow hover:bg-purple-500 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {loading ? "Creating..." : "Create Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
