"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { CommandPalette } from "./command-palette";
import { NotificationCenter } from "../notifications/notification-center";
import { Search, LogOut } from "lucide-react";

interface HeaderProps {
  orgSlug: string;
  workspaceSlug: string;
  workspaceId?: string;
}

export function Header({
  orgSlug,
  workspaceSlug,
  workspaceId = "",
}: HeaderProps) {
  const { data: session } = useSession();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        e.stopPropagation();
        setCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="flex h-14 items-center justify-between border-b border-neutral-900 dark:border-neutral-100 bg-black dark:bg-white px-4 sm:px-6 text-white">
      {/* Search Bar / Command Palette Trigger */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 px-3 py-1.5 text-xs text-neutral-400 dark:text-neutral-600 transition hover:border-neutral-700 dark:hover:border-neutral-300 hover:bg-neutral-900 dark:hover:bg-neutral-100 hover:text-white dark:text-black"
        >
          <Search className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-500" />
          <span className="hidden sm:inline">Search or jump to...</span>
          <span className="sm:hidden">Search...</span>
          <kbd className="ml-2 sm:ml-4 rounded border border-neutral-800 dark:border-neutral-200 bg-neutral-900 dark:bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-300 dark:text-neutral-700 font-mono">
            Ctrl+K / ⌘K
          </kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Real-time Notifications */}
        <NotificationCenter />

        <div className="mr-2 border-r border-neutral-800 dark:border-neutral-200 pr-2">
            <ThemeToggle />
          </div>
          <div className="mr-2 border-r border-neutral-800 dark:border-neutral-200 pr-2">
            <ThemeToggle />
          </div>
          {/* User profile & Logout */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-neutral-800 dark:border-neutral-200">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-black text-xs font-bold text-black dark:text-white shadow-sm">
            {(session?.user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-neutral-200 dark:text-neutral-800">
            {session?.user?.name || session?.user?.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="rounded p-1 text-neutral-400 dark:text-neutral-600 hover:text-white dark:text-black transition"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
      />
    </header>
  );
}
