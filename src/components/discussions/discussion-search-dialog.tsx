"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchDiscussions } from "@/actions/discussions";
import { Search, Hash, MessageSquare, X, Loader2, ArrowRight } from "lucide-react";

interface DiscussionSearchDialogProps {
  workspaceId: string;
  orgSlug: string;
  workspaceSlug: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DiscussionSearchDialog({
  workspaceId,
  orgSlug,
  workspaceSlug,
  isOpen,
  onClose,
}: DiscussionSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await searchDiscussions(workspaceId, query);
        setResults(res.messages || []);
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [query, workspaceId]);

  if (!isOpen) return null;

  const handleSelectMessage = (channelId: string) => {
    onClose();
    router.push(`/${orgSlug}/${workspaceSlug}/discussions/${channelId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black dark:bg-white/80 backdrop-blur-sm p-4 pt-20">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-neutral-800 dark:border-neutral-200 pb-3">
          <Search className="absolute left-3 h-4 w-4 text-neutral-400 dark:text-neutral-600" />
          <input
            type="text"
            placeholder="Search all discussion messages, threads, topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full rounded-xl bg-neutral-900/60 dark:bg-neutral-100/60 pl-9 pr-8 py-2.5 text-xs text-white dark:text-black placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white transition"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 text-neutral-500 dark:text-neutral-500 hover:text-white dark:text-black"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results Stream */}
        <div className="mt-3 max-h-80 overflow-y-auto space-y-1.5 pr-1">
          {isPending ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-500 dark:text-neutral-500" />
            </div>
          ) : results.length > 0 ? (
            results.map((msg) => (
              <button
                key={msg.id}
                onClick={() => handleSelectMessage(msg.channel.id)}
                className="w-full text-left flex items-start justify-between gap-3 rounded-xl border border-neutral-800/60 dark:border-neutral-200/60 bg-neutral-900/40 dark:bg-neutral-100/40 p-3 hover:border-neutral-700 hover:bg-neutral-900 dark:hover:bg-neutral-100 transition group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400">
                      <Hash className="h-3 w-3" />
                      {msg.channel.name}
                    </span>
                    {msg.channel.project && (
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-500 font-mono">
                        ({msg.channel.project.name})
                      </span>
                    )}
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-500">•</span>
                    <span className="text-[11px] font-semibold text-neutral-300 dark:text-neutral-700 truncate">
                      {msg.author.name || "User"}
                    </span>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-500 ml-auto font-mono">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 dark:text-neutral-700 line-clamp-2 leading-relaxed">
                    {msg.content}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-500 dark:text-neutral-500 group-hover:text-white dark:text-black group-hover:translate-x-0.5 transition shrink-0 mt-2" />
              </button>
            ))
          ) : query ? (
            <div className="py-8 text-center text-xs text-neutral-500 dark:text-neutral-500">
              No matching discussions found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-neutral-500 dark:text-neutral-500">
              Type keywords to search across channels and project threads.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-neutral-800/60 dark:border-neutral-200/60 pt-2.5 mt-3 text-[11px] text-neutral-500 dark:text-neutral-500">
          <span>Search entire workspace discussions</span>
          <button
            onClick={onClose}
            className="rounded px-2 py-0.5 hover:bg-neutral-900 dark:hover:bg-neutral-100 text-neutral-400 dark:text-neutral-600 hover:text-white dark:text-black"
          >
            Esc to close
          </button>
        </div>
      </div>
    </div>
  );
}
