export default function DiscussionsLoading() {
  return (
    <div className="flex h-full flex-col animate-pulse">
      <div className="flex h-14 items-center justify-between border-b border-neutral-900 px-6">
        <div className="h-5 w-36 rounded bg-neutral-900" />
        <div className="h-8 w-24 rounded-xl bg-neutral-900" />
      </div>
      <div className="flex-1 p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-neutral-900" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-32 rounded bg-neutral-900" />
              <div className="h-8 w-3/4 rounded-xl bg-neutral-900/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
