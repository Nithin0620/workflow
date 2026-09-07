"use client";

import { useState } from "react";
import { createIssueFromDiscussion } from "@/actions/discussions";
import { Sparkles, X, Loader2, FolderKanban } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateIssueFromDiscussionModalProps {
  message: {
    id: string;
    content: string;
    author: { name?: string | null; email?: string | null };
  };
  channel: {
    id: string;
    name: string;
    projectId?: string | null;
  };
  projects: Array<{ id: string; name: string; key: string }>;
  isOpen: boolean;
  onClose: () => void;
  onIssueCreated?: (issue: any, link: any) => void;
}

export function CreateIssueFromDiscussionModal({
  message,
  channel,
  projects,
  isOpen,
  onClose,
  onIssueCreated,
}: CreateIssueFromDiscussionModalProps) {
  const router = useRouter();

  // Extract a sensible default title from the message (first sentence or first 60 chars)
  const defaultTitle =
    message.content
      .split("\n")[0]
      .replace(/[#*`>_]/g, "")
      .trim()
      .slice(0, 80) || "Follow up on discussion";

  const defaultDescription = `### Context from #${channel.name}\n\n*Original discussion by @${
    message.author.name || message.author.email?.split("@")[0] || "team member"
  }*:\n\n> ${message.content.replace(/\n/g, "\n> ")}`;

  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    channel.projectId || (projects[0]?.id ?? "")
  );
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [status, setStatus] = useState<"BACKLOG" | "TODO" | "IN_PROGRESS">("TODO");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedProjectId) return;

    setLoading(true);
    setError(null);

    const res = await createIssueFromDiscussion(message.id, selectedProjectId, {
      title: title.trim(),
      description: description.trim(),
      priority,
      status: status as any,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    if (res.issue) {
      onClose();
      if (onIssueCreated) {
        onIssueCreated(res.issue, res.link);
      }
      router.refresh();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black dark:bg-white/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800/60 dark:border-neutral-200/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white dark:text-black tracking-tight">
                Create Tracked Issue
              </h2>
              <p className="text-xs text-neutral-400 dark:text-neutral-600">
                Turn discussion from #{channel.name} into an actionable ticket
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 dark:text-neutral-600 hover:bg-neutral-900 hover:text-white dark:text-black transition"
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
          {/* Target Project */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-600 font-mono mb-1.5">
              Target Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              required
              className="w-full rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-900 dark:bg-neutral-100 px-3 py-2 text-xs text-white dark:text-black focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
          </div>

          {/* Issue Title */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-600 font-mono mb-1.5">
              Issue Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-900 dark:bg-neutral-100 px-3 py-2 text-xs text-white dark:text-black placeholder-neutral-500 focus:border-white dark:border-black focus:outline-none focus:ring-1 focus:ring-white transition"
            />
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-600 font-mono mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-900 dark:bg-neutral-100 px-3 py-2 text-xs text-white dark:text-black focus:border-white focus:outline-none transition"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent ⚡</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-600 font-mono mb-1.5">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-900 dark:bg-neutral-100 px-3 py-2 text-xs text-white dark:text-black focus:border-white focus:outline-none transition"
              >
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-600 font-mono mb-1.5">
              Description & Discussion Excerpt
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-900 dark:bg-neutral-100 p-3 font-mono text-xs text-neutral-200 dark:text-neutral-800 placeholder-neutral-500 focus:border-white dark:border-black focus:outline-none transition leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800/60 dark:border-neutral-200/60">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-neutral-400 dark:text-neutral-600 hover:bg-neutral-900 hover:text-white dark:text-black transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !selectedProjectId}
              className="flex items-center gap-2 rounded-xl bg-white dark:bg-black px-4 py-2 text-xs font-bold text-black dark:text-white hover:bg-neutral-200 disabled:opacity-50 transition shadow"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create & Link Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
