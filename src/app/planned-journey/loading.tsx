import { Loader2 } from "lucide-react";

export default function PlannedJourneyLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col animate-pulse">
      {/* Navbar skeleton */}
      <div className="h-16 border-b border-neutral-900 bg-black px-6 flex items-center justify-between">
        <div className="h-6 w-24 bg-neutral-900 rounded" />
        <div className="flex gap-4">
          <div className="h-4 w-16 bg-neutral-900 rounded hidden sm:block" />
          <div className="h-4 w-16 bg-neutral-900 rounded hidden sm:block" />
          <div className="h-8 w-24 bg-neutral-800 rounded-full" />
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-20 space-y-16">
        {/* Hero section skeleton */}
        <div className="space-y-6 max-w-2xl">
          <div className="h-10 w-3/4 bg-neutral-900 rounded-lg" />
          <div className="h-10 w-1/2 bg-neutral-900 rounded-lg" />
          <div className="space-y-3 pt-4">
            <div className="h-4 w-full bg-neutral-900 rounded" />
            <div className="h-4 w-5/6 bg-neutral-900 rounded" />
          </div>
        </div>

        {/* Timeline/Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-neutral-900 bg-neutral-950/50 p-8 space-y-4">
              <div className="h-8 w-8 rounded bg-neutral-900 mb-6" />
              <div className="h-6 w-1/2 bg-neutral-900 rounded" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-neutral-900 rounded" />
                <div className="h-3 w-4/5 bg-neutral-900 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
