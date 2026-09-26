export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col animate-pulse">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center space-y-8 relative overflow-hidden">
        <div className="h-6 w-48 bg-neutral-900 rounded-full" />

        <div className="space-y-4 w-full max-w-4xl">
          <div className="h-14 w-full bg-neutral-900 rounded-lg" />
          <div className="h-14 w-5/6 bg-neutral-900 rounded-lg mx-auto" />
        </div>

        <div className="space-y-2 w-full max-w-2xl">
          <div className="h-5 w-full bg-neutral-900 rounded" />
          <div className="h-5 w-3/4 bg-neutral-900 rounded mx-auto" />
        </div>

        <div className="flex items-center justify-center gap-4 pt-4">
          <div className="h-12 w-40 bg-white/20 rounded-xl" />
          <div className="h-12 w-32 bg-neutral-900 rounded-xl" />
        </div>

        <div className="mt-16 w-full max-w-5xl rounded-2xl border border-neutral-800 bg-neutral-950/50 h-96" />
      </div>
    </div>
  );
}
