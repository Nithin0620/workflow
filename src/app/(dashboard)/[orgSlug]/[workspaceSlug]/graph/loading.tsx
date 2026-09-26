import { Network, RefreshCw } from "lucide-react";

export default function GraphLoading() {
  return (
    <div className="flex h-screen flex-1 flex-col items-center justify-center bg-black text-white">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 mb-4 animate-pulse">
        <Network className="h-6 w-6" />
      </div>
      <p className="text-xs font-semibold text-neutral-300">Loading Codebase Knowledge Graph...</p>
      <p className="mt-1 text-[11px] text-neutral-500">Preparing workspace modules and repository architecture</p>
    </div>
  );
}
