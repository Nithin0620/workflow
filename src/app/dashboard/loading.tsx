export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-10 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-900 pb-6">
          <div className="space-y-2">
            <div className="h-8 w-48 rounded-xl bg-neutral-900" />
            <div className="h-4 w-72 rounded bg-neutral-900/60" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-28 rounded-xl bg-neutral-900" />
            <div className="h-9 w-32 rounded-xl bg-neutral-900" />
          </div>
        </div>

        {/* Workspaces Grid Skeleton */}
        <div className="space-y-4">
          <div className="h-4 w-32 rounded bg-neutral-900" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-3xl border border-neutral-900 bg-neutral-950 p-6 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-neutral-900" />
                    <div className="space-y-1">
                      <div className="h-4 w-28 rounded bg-neutral-900" />
                      <div className="h-3 w-16 rounded bg-neutral-900/60" />
                    </div>
                  </div>
                  <div className="h-5 w-14 rounded-full bg-neutral-900" />
                </div>
                <div className="h-10 rounded-xl bg-neutral-900/40" />
                <div className="flex justify-between items-center pt-2 border-t border-neutral-900">
                  <div className="h-3 w-20 rounded bg-neutral-900/60" />
                  <div className="h-4 w-24 rounded bg-neutral-900" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discussions Hub Skeleton */}
        <div className="rounded-3xl border border-neutral-900 bg-neutral-950 p-6 space-y-4 shadow-xl">
          <div className="h-5 w-40 rounded bg-neutral-900" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-neutral-900/40" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
