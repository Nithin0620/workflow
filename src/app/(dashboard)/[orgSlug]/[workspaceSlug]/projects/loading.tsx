export default function ProjectsLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
        <div className="space-y-2">
          <div className="h-6 w-32 rounded-lg bg-neutral-900" />
          <div className="h-4 w-60 rounded bg-neutral-900/60" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border border-neutral-900 bg-neutral-950 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-neutral-900" />
              <div className="space-y-1 flex-1">
                <div className="h-4 w-28 rounded bg-neutral-900" />
                <div className="h-3 w-12 rounded bg-neutral-900/60" />
              </div>
            </div>
            <div className="h-8 rounded bg-neutral-900/40" />
            <div className="h-6 rounded bg-neutral-900/20" />
          </div>
        ))}
      </div>
    </div>
  );
}
