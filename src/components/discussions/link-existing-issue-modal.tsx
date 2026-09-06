"use client";

import { useState } from "react";
import { linkDiscussionToIssue } from "@/actions/discussions";
import { Link2, Search, X, Loader2, Sparkles, Check } from "lucide-react";

interface LinkExistingIssueModalProps {
  message: {
    id: string;
    content: string;
  };
  channel: {
    id: string;
    name: string;
  };
  projects: Array<{
    id: string;
    name: string;
    key: string;
  }>;
  isOpen: boolean;
  onClose: () => void;
  onLinked?: (link: any) => void;
}

export function LinkExistingIssueModal({
  message,
  channel,
  projects,
  isOpen,
  onClose,
  onLinked,
}: LinkExistingIssueModalProps) {
  const [issueKeyInput, setIssueKeyInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueKeyInput.trim()) return;

    setLoading(true);
    setError(null);

    // If input is an issue ID or Key like DEMO-1
    const trimmed = issueKeyInput.trim().toUpperCase();

    // Call server action
    const res = await linkDiscussionToIssue(message.id, trimmed);

    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    if (res.link) {
      onClose();
      if (onLinked) {
        onLinked(res.link);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Link2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Link to Existing Issue
              </h2>
              <p className="text-xs text-neutral-400">
                Connect message in #{channel.name} to a project ticket
              </p>
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

        <form onSubmit={handleLink} className="mt-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono mb-1.5">
              Issue Identifier (ID or Key)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
              <input
                type="text"
                placeholder="e.g. cm123... or issue ID"
                value={issueKeyInput}
                onChange={(e) => setIssueKeyInput(e.target.value)}
                required
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition font-mono"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-neutral-500">
              Paste the target Issue ID to create an instant 2-way relationship.
            </p>
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
              disabled={loading || !issueKeyInput.trim()}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-neutral-200 disabled:opacity-50 transition shadow"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Link Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
