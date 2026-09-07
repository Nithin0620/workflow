export default function BoardLoading() {
  return (
    <div className="flex h-full flex-col space-y-4 animate-pulse">
      {/* Top Toolbar Skeleton */}
      <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-4 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-36 rounded-lg bg-neutral-900" />
            <div className="h-5 w-14 rounded-md bg-neutral-900/80" />
            <div className="h-5 w-20 rounded-full bg-neutral-900/60" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 rounded-xl bg-neutral-900" />
            <div className="h-8 w-24 rounded-xl bg-neutral-900" />
          </div>
        </div>

        {/* Filter buttons skeleton */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="h-8 w-44 rounded-xl bg-neutral-900" />
          <div className="h-8 w-32 rounded-xl bg-neutral-900" />
          <div className="h-8 w-28 rounded-xl bg-neutral-900" />
          <div className="ml-auto flex gap-2">
            <div className="h-8 w-24 rounded-xl bg-neutral-900" />
            <div className="h-8 w-28 rounded-xl bg-white/20" />
          </div>
        </div>
      </div>

      {/* Kanban Columns Skeleton */}
      <div className="flex flex-1 gap-4 overflow-x-auto pb-4 items-start">
        {[1, 2, 3, 4, 5].map((col) => (
          <div
            key={col}
            className="flex w-72 shrink-0 flex-col rounded-2xl border border-neutral-900 bg-neutral-950/60 p-3 space-y-3"
          >
            <div className="flex items-center justify-between pb-1 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-neutral-800" />
                <div className="h-4 w-20 rounded bg-neutral-900" />
              </div>
              <div className="h-4 w-6 rounded bg-neutral-900" />
            </div>

            {/* Cards in column */}
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="rounded-xl border border-neutral-900 bg-neutral-900/40 p-3 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 rounded bg-neutral-800" />
                  <div className="h-3 w-3 rounded-full bg-neutral-800" />
                </div>
                <div className="h-4 w-44 rounded bg-neutral-800" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-5 w-5 rounded-full bg-neutral-800" />
                  <div className="h-3 w-10 rounded bg-neutral-800/60" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
