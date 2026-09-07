export default function AnalyticsLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-44 rounded-lg bg-neutral-900" />
        <div className="h-4 w-64 rounded bg-neutral-900/60" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-neutral-900 bg-neutral-950 p-6 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 rounded bg-neutral-900" />
              <div className="h-4 w-4 rounded bg-neutral-900" />
            </div>
            <div className="h-9 w-20 rounded-lg bg-neutral-900" />
          </div>
        ))}
      </div>
    </div>
  );
}
