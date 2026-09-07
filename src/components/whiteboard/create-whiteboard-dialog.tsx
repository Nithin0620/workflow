"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PenTool, Plus, X, FolderKanban } from "lucide-react";
import { createWhiteboard } from "@/actions/whiteboards";

interface CreateWhiteboardDialogProps {
  workspaceId: string;
  orgSlug: string;
  workspaceSlug: string;
  projects: Array<{ id: string; name: string; key: string; color?: string | null }>;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWhiteboardDialog({
  workspaceId,
  orgSlug,
  workspaceSlug,
  projects,
  isOpen,
  onClose,
}: CreateWhiteboardDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createWhiteboard(workspaceId, {
        title: title.trim(),
        description: description.trim() || undefined,
        projectIds: selectedProjectIds,
      });

      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      onClose();
      router.push(`/${orgSlug}/${workspaceSlug}/whiteboards/${res.data?.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to create whiteboard");
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <PenTool className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">New Whiteboard</h3>
            <p className="text-xs text-neutral-400">Create an infinite collaborative canvas</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-neutral-300">Whiteboard Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Microservices Auth Flow, Q3 Retrospective"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Brief context on this design board..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full resize-none rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {projects.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">
                Link to Projects (2-Way Connection)
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                {projects.map((proj) => {
                  const isSelected = selectedProjectIds.includes(proj.id);
                  return (
                    <button
                      type="button"
                      key={proj.id}
                      onClick={() => toggleProject(proj.id)}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-500/20 text-blue-300"
                          : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                      }`}
                    >
                      <FolderKanban className="h-3.5 w-3.5" style={{ color: proj.color || "#3b82f6" }} />
                      {proj.name} ({proj.key})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow hover:bg-blue-500 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {loading ? "Creating..." : "Create Canvas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
