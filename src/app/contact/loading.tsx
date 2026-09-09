import { Loader2 } from "lucide-react";

export default function ContactLoading() {
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

      <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">

          {/* Left Column Skeleton */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-6">
              <div className="h-6 w-48 bg-neutral-900 rounded-full" />
              <div className="space-y-3">
                <div className="h-12 w-full bg-neutral-900 rounded-lg" />
                <div className="h-12 w-3/4 bg-neutral-900 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-neutral-900 rounded" />
                <div className="h-4 w-5/6 bg-neutral-900 rounded" />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-neutral-900 bg-neutral-950 p-4">
                  <div className="h-5 w-5 rounded bg-neutral-800 shrink-0 mt-0.5" />
                  <div className="space-y-2 w-full">
                    <div className="h-4 w-48 bg-neutral-800 rounded" />
                    <div className="h-3 w-full bg-neutral-900 rounded" />
                    <div className="h-3 w-3/4 bg-neutral-900 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="lg:col-span-7 rounded-3xl border border-neutral-800 bg-white p-6 sm:p-10 text-black shadow-2xl">
            <div className="space-y-5">
              <div className="space-y-3 border-b border-neutral-200 pb-4">
                <div className="h-7 w-64 bg-neutral-200 rounded" />
                <div className="h-4 w-48 bg-neutral-100 rounded" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={`row1-${i}`} className="space-y-2">
                    <div className="h-3 w-24 bg-neutral-200 rounded" />
                    <div className="h-10 w-full bg-neutral-100 rounded-lg" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={`row2-${i}`} className="space-y-2">
                    <div className="h-3 w-32 bg-neutral-200 rounded" />
                    <div className="h-10 w-full bg-neutral-100 rounded-lg" />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="h-3 w-48 bg-neutral-200 rounded" />
                <div className="h-24 w-full bg-neutral-100 rounded-lg" />
              </div>

              <div className="h-12 w-full bg-neutral-200 rounded-xl mt-4" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
