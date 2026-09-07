"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { searchWorkspace, SearchResultItem } from "@/actions/search";
import { nlSearch } from "@/actions/nl-search";
import { isNLQuery, type NLSearchResponse } from "@/lib/nl-search/types";
import {
  Search,
  FolderKanban,
  CheckSquare,
  Settings,
  Sparkles,
  Loader2,
  ArrowRight,
  X,
  Zap,
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isKeywordPending, setIsKeywordPending] = useState(false);
  const [isNLPending, setIsNLPending] = useState(false);
  const [nlResponse, setNlResponse] = useState<NLSearchResponse | null>(null);
  const [hasActiveFilter, setHasActiveFilter] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when palette opens/closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setNlResponse(null);
      setHasActiveFilter(false);
      setIsNLPending(false);
      setIsKeywordPending(false);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Search logic with dual routing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim() || !workspaceId) {
      setResults([]);
      setNlResponse(null);
      setHasActiveFilter(false);
      setSelectedIndex(0);
      return;
    }

    const nl = isNLQuery(query);
    const debounceMs = nl ? 400 : 200;

    debounceRef.current = setTimeout(async () => {
      if (nl) {
        // NL path
        setIsNLPending(true);
        try {
          const res = await nlSearch(workspaceId, query);
          setNlResponse(res);
          setResults(res.results);
          setHasActiveFilter(res.mode === "nl" && !!res.filterSummary);
        } catch {
          // Hard error: fall back to keyword silently
          setIsNLPending(false);
          setIsKeywordPending(true);
          try {
            const res = await searchWorkspace(workspaceId, query);
            if (res.success) setResults(res.results);
          } finally {
            setIsKeywordPending(false);
          }
          return;
        } finally {
          setIsNLPending(false);
        }
      } else {
        // Keyword path
        setNlResponse(null);
        setHasActiveFilter(false);
        setIsKeywordPending(true);
        try {
          const res = await searchWorkspace(workspaceId, query);
          if (res.success) {
            setResults(res.results);
          }
        } finally {
          setIsKeywordPending(false);
        }
      }
      setSelectedIndex(0);
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, workspaceId]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    router.push(`/${orgSlug}/${workspaceSlug}${path}`);
    onClose();
  };

  const clearFilter = () => {
    setNlResponse(null);
    setHasActiveFilter(false);
    // Re-run as keyword search
    if (query.trim() && workspaceId) {
      setIsKeywordPending(true);
      searchWorkspace(workspaceId, query).then((res) => {
        if (res.success) setResults(res.results);
        setIsKeywordPending(false);
      });
    }
  };

  const staticNavActions = [
    { label: "Go to Projects Directory", path: "/projects", icon: FolderKanban },
    { label: "Go to Velocity & Analytics", path: "/analytics", icon: Sparkles },
    { label: "Manage Workspace & Team Settings", path: "/settings", icon: Settings },
  ];

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (hasActiveFilter) {
        // First Escape: clear filter, keep palette open
        clearFilter();
      } else {
        // Second Escape (or no active filter): close palette
        onClose();
      }
      return;
    }

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

  const isSmartSearch = nlResponse?.mode === "nl";
  const sectionLabel = isSmartSearch ? "Smart Search" : "Matching Issues & Projects";

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
          <Search className="h-4 w-4 text-neutral-400 shrink-0" />
          <input
            ref={searchInputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownInput}
            placeholder="Type a command, project, or issue key..."
            className="w-full bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none pr-8"
          />
          <AnimatePresence>
            {query.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={() => {
                  setQuery("");
                  searchInputRef.current?.focus();
                }}
                className="text-neutral-500 hover:text-white shrink-0 -ml-8 mr-2"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
          {/* AI processing indicator */}
          {isNLPending && (
            <div className="flex items-center gap-1 shrink-0">
              <Zap className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
              <span className="text-[10px] text-violet-400 font-mono font-bold">AI</span>
            </div>
          )}
          {/* Keyword search spinner */}
          {isKeywordPending && !isNLPending && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400 shrink-0" />
          )}
          <kbd className="rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 text-[10px] font-bold text-neutral-400 font-mono shrink-0">
            ESC
          </kbd>
        </div>

        {/* Filter Summary Bar */}
        {nlResponse?.filterSummary && (
          <div className="flex items-center justify-between gap-2 border-b border-neutral-900 px-4 py-2 bg-black/50">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="h-3 w-3 text-violet-400 shrink-0" />
              <span className="text-[11px] text-neutral-300 truncate">
                {nlResponse.filterSummary}
              </span>
            </div>
            <button
              onClick={clearFilter}
              className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-white transition shrink-0"
              aria-label="Clear filters"
            >
              <X className="h-3 w-3" />
              <span>Clear</span>
            </button>
          </div>
        )}

        {/* Fallback / notice message */}
        {nlResponse?.fallbackMessage && (
          <div className="px-4 py-2 bg-black/30 border-b border-neutral-900">
            <p className="text-[11px] text-amber-400/80">{nlResponse.fallbackMessage}</p>
          </div>
        )}

        {/* Search Results & Jump List */}
        <div className="p-2 space-y-1 bg-neutral-950 max-h-80 overflow-y-auto">
          {query.trim() && results.length > 0 ? (
            <div>
              <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-mono flex items-center gap-1.5">
                {isSmartSearch && (
                  <Sparkles className="h-3 w-3 text-violet-400" />
                )}
                {sectionLabel}
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
          ) : query.trim() && results.length === 0 && !isNLPending && !isKeywordPending ? (
            <div className="p-6 text-center space-y-1">
              <p className="text-xs text-neutral-500">
                No{isSmartSearch ? " matching issues for these filters" : " matching projects or issues found for"}{" "}
                {!isSmartSearch && <>&quot;{query}&quot;</>}.
              </p>
              {nlResponse?.filterSummary && (
                <p className="text-[11px] text-neutral-600">
                  Filters: {nlResponse.filterSummary}
                </p>
              )}
            </div>
          ) : (
            !query.trim() && (
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
            )
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-neutral-900 px-4 py-2 bg-black text-[11px] text-neutral-500">
          <span>
            Navigate with{" "}
            <kbd className="font-mono text-neutral-400">↑</kbd>{" "}
            <kbd className="font-mono text-neutral-400">↓</kbd>
          </span>
          <span className="flex items-center gap-1.5">
            {isSmartSearch && (
              <>
                <Sparkles className="h-3 w-3 text-violet-400" />
                <span className="text-violet-400">AI Search</span>
                <span className="text-neutral-700">·</span>
              </>
            )}
            Open with{" "}
            <kbd className="font-mono text-neutral-400">↵ Enter</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
