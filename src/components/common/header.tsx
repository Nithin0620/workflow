"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { CommandPalette } from "./command-palette";
import { Search, Bell, LogOut } from "lucide-react";

interface HeaderProps {
  orgSlug: string;
  workspaceSlug: string;
}

export function Header({ orgSlug, workspaceSlug }: HeaderProps) {
  const { data: session } = useSession();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-6 text-black">
      {/* Command Palette Trigger */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-600 transition hover:border-neutral-400 hover:bg-neutral-100"
      >
        <Search className="h-3.5 w-3.5 text-neutral-400" />
        <span>Search or jump to...</span>
        <kbd className="ml-4 rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-[10px] font-bold text-black font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-black transition">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-black ring-2 ring-white" />
        </button>

        {/* User profile & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
            {(session?.user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-neutral-800">
            {session?.user?.name || session?.user?.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="rounded p-1 text-neutral-400 hover:text-black transition"
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
      />
    </header>
  );
}
