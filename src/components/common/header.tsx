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
    <header className="flex h-14 items-center justify-between border-b border-neutral-900 bg-black px-4 sm:px-6 text-white">
      {/* Search Bar / Command Palette Trigger */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-neutral-700 hover:bg-neutral-900 hover:text-white"
        >
          <Search className="h-3.5 w-3.5 text-neutral-500" />
          <span className="hidden sm:inline">Search or jump to...</span>
          <span className="sm:hidden">Search...</span>
          <kbd className="ml-2 sm:ml-4 rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 text-[10px] font-bold text-neutral-300 font-mono">
            Ctrl+K / ⌘K
          </kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Real-time Notifications */}
        <NotificationCenter />

        {/* User profile & Logout */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-neutral-800">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-black shadow-sm">
            {(session?.user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-neutral-200">
            {session?.user?.name || session?.user?.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="rounded p-1 text-neutral-400 hover:text-white transition"
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
