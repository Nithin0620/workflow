import { PenTool } from "lucide-react";

export default function WhiteboardsLoading() {
  return (
    <div className="flex h-screen flex-1 flex-col bg-black text-white overflow-y-auto animate-pulse">
      {/* Page Header Skeleton */}
      <header className="border-b border-neutral-900 px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-4 w-24 rounded bg-neutral-900" />
              <div className="text-neutral-900">/</div>
              <div className="h-4 w-40 rounded bg-neutral-800" />
            </div>
            <div className="flex items-center gap-2.5 mt-1">
              <div className="h-6 w-6 rounded-md bg-neutral-900" />
              <div className="h-7 w-56 rounded-lg bg-neutral-800" />
            </div>
            <div className="h-3 w-80 rounded bg-neutral-900 mt-2" />
          </div>

          <div className="h-9 w-32 rounded-lg bg-neutral-900" />
        </div>
      </header>

      {/* Whiteboards Grid Skeleton */}
      <main className="flex-1 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-2xl border border-neutral-900 bg-neutral-950 p-5 shadow-lg h-[160px]"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-8 w-8 rounded-lg bg-neutral-900" />
                  <div className="h-3 w-16 rounded bg-neutral-900" />
                </div>
                <div className="h-5 w-3/4 rounded bg-neutral-800 mb-2" />
                <div className="space-y-1.5 mt-2">
                  <div className="h-3 w-full rounded bg-neutral-900" />
                  <div className="h-3 w-2/3 rounded bg-neutral-900" />
                </div>
              </div>
              <div className="mt-5 border-t border-neutral-900 pt-3 flex gap-1.5">
                <div className="h-5 w-16 rounded-md bg-neutral-900" />
                <div className="h-5 w-12 rounded-md bg-neutral-900" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
