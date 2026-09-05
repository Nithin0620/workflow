"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchWorkspace, SearchResultItem } from "@/actions/search";
import {
  Search,
  FolderKanban,
  CheckSquare,
  Settings,
  Sparkles,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  orgSlug: string;
  workspaceSlug: string;
  workspaceId?: string;
}

export function CommandPalette({
  isOpen,
  onClose,
  orgSlug,
  workspaceSlug,
  workspaceId = "",
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Live search debounced
  useEffect(() => {
    if (!query.trim() || !workspaceId) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await searchWorkspace(workspaceId, query);
        if (res.success) {
          setResults(res.results);
          setSelectedIndex(0);
        }
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [query, workspaceId]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    router.push(`/${orgSlug}/${workspaceSlug}${path}`);
    onClose();
  };

  const staticNavActions = [
    { label: "Go to Projects Directory", path: "/projects", icon: FolderKanban },
    { label: "Go to Velocity & Analytics", path: "/analytics", icon: Sparkles },
    { label: "Manage Workspace & Team Settings", path: "/settings", icon: Settings },
  ];

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    const totalItems = results.length > 0 ? results.length : staticNavActions.length;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results.length > 0) {
        const target = results[selectedIndex];
        if (target) navigateTo(target.href);
      } else {
        const target = staticNavActions[selectedIndex];
        if (target) navigateTo(target.path);
      }
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/80 p-4 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl overflow-hidden"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-neutral-900 px-4 py-3.5 bg-black">
          <Search className="h-4 w-4 text-neutral-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownInput}
            placeholder="Type a command, project, or issue key..."
            className="w-full bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none"
          />
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400" />}
          <kbd className="rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 text-[10px] font-bold text-neutral-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Search Results & Jump List */}
        <div className="p-2 space-y-1 bg-neutral-950 max-h-80 overflow-y-auto">
          {query.trim() && results.length > 0 ? (
            <div>
              <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-mono">
                Matching Issues & Projects
              </span>
              <div className="mt-1 space-y-1">
                {results.map((res, idx) => (
                  <button
                    key={`${res.type}-${res.id}`}
                    onClick={() => navigateTo(res.href)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition ${
                      selectedIndex === idx
                        ? "bg-white text-black font-bold shadow-md"
                        : "text-neutral-300 hover:bg-neutral-900 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {res.type === "project" ? (
                        <FolderKanban className="h-4 w-4 shrink-0" />
                      ) : (
                        <CheckSquare className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">{res.title}</span>
                    </div>
                    <span
                      className={`font-mono text-[10px] ${
                        selectedIndex === idx ? "text-neutral-600" : "text-neutral-500"
                      }`}
                    >
                      {res.subtitle}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : query.trim() && results.length === 0 && !isPending ? (
            <div className="p-6 text-center text-xs text-neutral-500">
              No matching projects or issues found for &quot;{query}&quot;.
            </div>
          ) : (
            <div>
              <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-mono">
                Quick Navigation
              </span>
              <div className="mt-1 space-y-1">
                {staticNavActions.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.path}
                      onClick={() => navigateTo(action.path)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition ${
                        selectedIndex === idx
                          ? "bg-white text-black font-bold shadow-md"
                          : "text-neutral-300 hover:bg-neutral-900 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4" />
                        <span>{action.label}</span>
                      </div>
                      <ArrowRight className="h-3 w-3 opacity-60" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-neutral-900 px-4 py-2 bg-black text-[11px] text-neutral-500">
          <span>Navigate with <kbd className="font-mono text-neutral-400">↑</kbd> <kbd className="font-mono text-neutral-400">↓</kbd></span>
          <span>Open with <kbd className="font-mono text-neutral-400">↵ Enter</kbd></span>
        </div>
      </div>
    </div>
  );
}
