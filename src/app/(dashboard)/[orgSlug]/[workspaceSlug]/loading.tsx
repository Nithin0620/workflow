export default function WorkspaceOverviewLoading() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-neutral-900" />
          <div className="h-4 w-72 rounded-lg bg-neutral-900/60" />
        </div>
        <div className="h-8 w-20 rounded-xl bg-neutral-900" />
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-neutral-900 bg-neutral-950 p-5 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 rounded bg-neutral-900" />
              <div className="h-4 w-4 rounded bg-neutral-900" />
            </div>
            <div className="h-8 w-16 rounded-lg bg-neutral-900" />
          </div>
        ))}
      </div>

      {/* Projects Grid Skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 w-28 rounded bg-neutral-900" />
          <div className="h-3 w-24 rounded bg-neutral-900" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-neutral-900 bg-neutral-950 p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-neutral-900" />
                <div className="space-y-1 flex-1">
                  <div className="h-4 w-28 rounded bg-neutral-900" />
                  <div className="h-3 w-12 rounded bg-neutral-900/60" />
                </div>
              </div>
              <div className="h-10 rounded-lg bg-neutral-900/40" />
              <div className="h-8 rounded-lg bg-neutral-900/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
