"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-800 bg-neutral-950 p-2.5 text-left text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-900"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white font-black text-black text-xs">
            {currentWorkspace.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col truncate">
            <span className="truncate text-xs font-bold leading-tight text-white">
              {currentWorkspace.organization.name}
            </span>
            <span className="truncate text-[11px] font-normal text-neutral-400">
              {currentWorkspace.name}
            </span>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-neutral-800 bg-neutral-950 p-1.5 shadow-2xl text-white">
            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-mono">
              WORKSPACES
            </div>

            <div className="space-y-0.5">
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
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                      isActive
                        ? "bg-white text-black font-bold"
                        : "text-neutral-300 hover:bg-neutral-900 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{w.name}</span>
                    </div>
                    {isActive && <Check className="h-3.5 w-3.5 text-black shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
