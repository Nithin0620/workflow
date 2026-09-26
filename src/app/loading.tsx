export default function RootLoading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-white/5 animate-ping" />
          <div className="h-10 w-10 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white font-mono font-bold text-sm shadow-2xl">
            W
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
            Loading Workflow...
          </span>
        </div>
      </div>
    </div>
  );
}
