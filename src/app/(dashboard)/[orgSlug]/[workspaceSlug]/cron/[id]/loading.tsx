import { ArrowLeft, Clock, Calendar, FileCode2, Bot } from "lucide-react";

export default function CronRunDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 text-white pb-16 animate-pulse">
      {/* Back link skeleton */}
      <div className="inline-flex items-center gap-1.5 text-xs text-neutral-800">
        <ArrowLeft className="h-3.5 w-3.5" />
        <div className="h-3 w-24 bg-neutral-900 rounded" />
      </div>

      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-neutral-900" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-48 bg-neutral-900 rounded" />
              <div className="h-5 w-16 bg-neutral-900 rounded-full" />
            </div>
            <div className="h-3 w-32 bg-neutral-900 rounded" />
          </div>
        </div>
        <div className="hidden md:block h-9 w-36 rounded-xl bg-neutral-900" />
      </div>

      {/* Meta stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-3.5 w-3.5 bg-neutral-900 rounded" />
              <div className="h-2 w-16 bg-neutral-900 rounded" />
            </div>
            <div className="h-4 w-24 bg-neutral-800 rounded" />
          </div>
        ))}
      </div>

      {/* Summary skeleton */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
        <div className="h-2 w-20 bg-neutral-900 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-neutral-900 rounded" />
          <div className="h-3 w-3/4 bg-neutral-900 rounded" />
        </div>
      </div>

      {/* Findings skeleton */}
      <div className="space-y-3">
        <div className="h-2 w-48 bg-neutral-900 rounded mb-4" />
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-64 bg-neutral-800 rounded" />
              <div className="h-4 w-16 bg-neutral-900 rounded" />
            </div>
            <div className="h-3 w-48 bg-neutral-900 rounded" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-neutral-900 rounded" />
              <div className="h-3 w-5/6 bg-neutral-900 rounded" />
            </div>
            <div className="h-24 w-full bg-neutral-900 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
