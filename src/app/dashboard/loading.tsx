export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Top Navbar Skeleton */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-neutral-900 bg-black/90 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-neutral-800 animate-pulse" />
            <div className="h-5 w-24 rounded-lg bg-neutral-800/80 animate-pulse" />
          </div>
          <div className="h-4 w-px bg-neutral-800" />
          <div className="h-6 w-32 rounded-lg bg-neutral-900 border border-neutral-800 animate-pulse" />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-8 w-28 rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse hidden sm:block" />
          <div className="h-8 w-8 rounded-full bg-neutral-800 animate-pulse" />
          <div className="h-8 w-8 rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse" />
        </div>
      </header>

      {/* Main Hub Content */}
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {/* Welcome Banner Skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-900 pb-8">
          <div className="space-y-2">
            <div className="h-8 w-56 rounded-xl bg-neutral-800 animate-pulse" />
            <div className="h-4 w-80 rounded-lg bg-neutral-900 animate-pulse" />
          </div>

          <div className="flex items-center gap-2">
            <div className="h-9 w-36 rounded-xl bg-neutral-800 animate-pulse" />
            <div className="h-9 w-9 rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse" />
          </div>
        </div>

        {/* Overview Stats 4 Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-2"
            >
              <div className="h-3 w-20 rounded bg-neutral-900 animate-pulse" />
              <div className="h-7 w-12 rounded-lg bg-neutral-800 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Section 1: Workspaces Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-36 rounded bg-neutral-900 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-950 p-5 space-y-4 shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse" />
                    <div className="h-5 w-16 rounded-full bg-neutral-900 border border-neutral-800 animate-pulse" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 rounded bg-neutral-800 animate-pulse" />
                    <div className="h-3 w-20 rounded bg-neutral-900 animate-pulse" />
                  </div>
                  <div className="h-12 w-full rounded-xl bg-neutral-900/60 animate-pulse" />
                </div>

                <div className="flex items-center justify-between border-t border-neutral-900 pt-3">
                  <div className="h-3 w-28 rounded bg-neutral-900 animate-pulse" />
                  <div className="h-4 w-16 rounded bg-neutral-800 animate-pulse" />
                </div>
              </div>
            ))}

            {/* Create New Workspace placeholder */}
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 p-6 text-center space-y-2">
              <div className="h-10 w-10 rounded-xl bg-neutral-900 animate-pulse" />
              <div className="h-4 w-32 rounded bg-neutral-800 animate-pulse" />
              <div className="h-3 w-48 rounded bg-neutral-900 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Section 2: Active Discussion Groups Skeleton */}
        <div className="space-y-4 pt-6 border-t border-neutral-900">
          <div className="flex items-center justify-between">
            <div className="h-4 w-44 rounded bg-neutral-900 animate-pulse" />
            <div className="h-4 w-28 rounded bg-neutral-900 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-950 p-5 space-y-4 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse" />
                  <div className="h-4 w-16 rounded bg-neutral-900 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-4 w-28 rounded bg-neutral-800 animate-pulse" />
                  <div className="h-3 w-44 rounded bg-neutral-900 animate-pulse" />
                </div>
                <div className="h-8 rounded-xl bg-neutral-900/40 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
