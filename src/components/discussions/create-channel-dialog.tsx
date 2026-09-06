"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDiscussionChannel } from "@/actions/discussions";
import { Hash, Megaphone, Lock, FolderKanban, Loader2, X } from "lucide-react";

interface CreateChannelDialogProps {
  workspaceId: string;
  orgSlug: string;
  workspaceSlug: string;
  isOpen: boolean;
  onClose: () => void;
  projects?: Array<{ id: string; name: string; key: string }>;
  defaultProjectId?: string | null;
  onChannelCreated?: (channel: any) => void;
}

export function CreateChannelDialog({
  workspaceId,
  orgSlug,
  workspaceSlug,
  isOpen,
  onClose,
  projects = [],
  defaultProjectId = null,
  onChannelCreated,
}: CreateChannelDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [type, setType] = useState<"TEXT" | "ANNOUNCEMENT">("TEXT");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    defaultProjectId || "WORKSPACE"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    const formattedName = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_]/g, "");

    const projectId = selectedProjectId === "WORKSPACE" ? null : selectedProjectId;

    const res = await createDiscussionChannel(workspaceId, {
      name: formattedName,
      topic: topic.trim() || undefined,
      type,
      isPrivate: false,
      projectId,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    if (res.channel) {
      setName("");
      setTopic("");
      setType("TEXT");
      onClose();
      if (onChannelCreated) {
        onChannelCreated(res.channel);
      }
      router.push(`/${orgSlug}/${workspaceSlug}/discussions/${res.channel.id}`);
      router.refresh();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-white">
              <Hash className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Create Discussion Channel</h2>
              <p className="text-xs text-neutral-400">Add a chat channel to collaborate in real-time</p>
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
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Scope Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono mb-1.5">
              Channel Scope & Category
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition"
            >
              <option value="WORKSPACE">🌐 General / Workspace Channel</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  📁 Project: {p.name} ({p.key})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-neutral-500">
              {selectedProjectId === "WORKSPACE"
                ? "Visible to the entire workspace across all projects."
                : "Organized under the selected project for focused engineering discussions."}
            </p>
          </div>

          {/* Channel Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono mb-1.5">
              Channel Name
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-neutral-500 font-mono text-xs">#</span>
              <input
                type="text"
                placeholder="e.g. backend, ui-redesign, triage"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 pl-8 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition font-mono"
              />
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono mb-1.5">
              Topic / Purpose (Optional)
            </label>
            <input
              type="text"
              placeholder="What is this channel about?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={300}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition"
            />
          </div>

          {/* Channel Type */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono mb-1.5">
              Channel Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("TEXT")}
                className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs transition ${
                  type === "TEXT"
                    ? "border-white bg-neutral-900 text-white font-semibold"
                    : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <Hash className="h-4 w-4 shrink-0 text-neutral-300" />
                <div>
                  <div className="text-white">Text Chat</div>
                  <div className="text-[10px] text-neutral-500 font-normal">All members can post</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType("ANNOUNCEMENT")}
                className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs transition ${
                  type === "ANNOUNCEMENT"
                    ? "border-white bg-neutral-900 text-white font-semibold"
                    : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <Megaphone className="h-4 w-4 shrink-0 text-amber-400" />
                <div>
                  <div className="text-white">Announcements</div>
                  <div className="text-[10px] text-neutral-500 font-normal">Only Admins post</div>
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800/60">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-neutral-200 disabled:opacity-50 transition shadow"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
