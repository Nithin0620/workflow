export default function CronLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-40 rounded-lg bg-neutral-900" />
        <div className="h-4 w-72 rounded bg-neutral-900/60" />
      </div>
      <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-6 space-y-4">
        <div className="h-10 rounded-xl bg-neutral-900/60" />
        <div className="h-32 rounded-xl bg-neutral-900/30" />
      </div>
    </div>
  );
}
