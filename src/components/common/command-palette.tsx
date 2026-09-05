"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FolderKanban, CheckSquare, Plus, Settings, Sparkles } from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  orgSlug: string;
  workspaceSlug: string;
}

export function CommandPalette({ isOpen, onClose, orgSlug, workspaceSlug }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

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

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    router.push(`/${orgSlug}/${workspaceSlug}${path}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
        <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <Search className="h-4 w-4 text-neutral-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search (e.g. projects, settings)..."
            className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100"
          />
          <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-500 dark:bg-neutral-800">
            ESC
          </kbd>
        </div>

        <div className="p-2 space-y-1">
          <button
            onClick={() => navigateTo("/projects")}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <FolderKanban className="h-4 w-4 text-blue-500" />
            <span>Go to Projects</span>
          </button>

          <button
            onClick={() => navigateTo("/analytics")}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span>Open Analytics Dashboard</span>
          </button>

          <button
            onClick={() => navigateTo("/settings")}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <Settings className="h-4 w-4 text-neutral-500" />
            <span>Workspace Settings & Members</span>
          </button>
        </div>
      </div>
    </div>
  );
}
