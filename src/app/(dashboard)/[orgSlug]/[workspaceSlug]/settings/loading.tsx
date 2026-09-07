export default function SettingsLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-pulse pb-12">
      <div className="space-y-2">
        <div className="h-6 w-48 rounded-lg bg-neutral-900" />
        <div className="h-4 w-80 rounded bg-neutral-900/60" />
      </div>
      <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-6 space-y-4">
        <div className="h-4 w-32 rounded bg-neutral-900" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-12 rounded-xl bg-neutral-900/50" />
          <div className="h-12 rounded-xl bg-neutral-900/50" />
        </div>
      </div>
    </div>
  );
}
