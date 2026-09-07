"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { Building2, ChevronDown, Plus, Check } from "lucide-react";

interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  organization: {
    name: string;
    slug: string;
  };
  role: string;
}

interface WorkspaceSwitcherProps {
  currentOrgSlug: string;
  currentWorkspaceSlug: string;
  workspaces?: WorkspaceItem[];
}

export function WorkspaceSwitcher({
  currentOrgSlug,
  currentWorkspaceSlug,
  workspaces = [],
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const currentWorkspace = workspaces.find(
    (w) => w.organization.slug === currentOrgSlug && w.slug === currentWorkspaceSlug
  ) || {
    name: "General Workspace",
    organization: { name: "My Organization", slug: currentOrgSlug },
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-2.5 text-left text-sm font-semibold text-white dark:text-black shadow-sm transition hover:bg-neutral-900 dark:hover:bg-neutral-100"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-black font-black text-black text-xs">
            {currentWorkspace.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col truncate">
            <span className="truncate text-xs font-bold leading-tight text-white dark:text-black">
              {currentWorkspace.organization.name}
            </span>
            <span className="truncate text-[11px] font-normal text-neutral-400 dark:text-neutral-600">
              {currentWorkspace.name}
            </span>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-500" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 min-w-[240px] rounded-2xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-1.5 shadow-2xl text-white dark:text-black animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-500 font-mono">
              WORKSPACES ({workspaces.length})
            </div>

            <div className="space-y-0.5 max-h-56 overflow-y-auto">
              {workspaces.map((w) => {
                const isActive =
                  w.organization.slug === currentOrgSlug && w.slug === currentWorkspaceSlug;
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      setOpen(false);
                      router.push(`/${w.organization.slug}/${w.slug}`);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition ${
                      isActive
                        ? "bg-white dark:bg-black text-black font-bold"
                        : "text-neutral-300 dark:text-neutral-700 hover:bg-neutral-900 hover:text-white dark:text-black"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{w.name}</span>
                    </div>
                    {isActive && <Check className="h-3.5 w-3.5 text-black dark:text-white shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Create Workspace Action */}
            <div className="mt-1.5 pt-1.5 border-t border-neutral-900 dark:border-neutral-100">
              <button
                onClick={() => {
                  setOpen(false);
                  setCreateDialogOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-neutral-300 dark:text-neutral-700 hover:bg-neutral-900 hover:text-white dark:text-black transition"
              >
                <Plus className="h-4 w-4 text-white dark:text-black" />
                <span>Create New Workspace</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create Workspace Modal */}
      <CreateWorkspaceDialog
        orgSlug={currentOrgSlug}
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </div>
  );
}
