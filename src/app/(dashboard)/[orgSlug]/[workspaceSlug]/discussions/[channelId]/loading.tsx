import { Hash } from "lucide-react";

export default function ChannelLoading() {
  return (
    <div className="-m-6 h-[calc(100vh-3.5rem)] flex flex-col bg-[#0f0f11] animate-pulse">
      {/* Header Skeleton */}
      <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-neutral-900 bg-black/40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-neutral-900 flex items-center justify-center">
            <Hash className="h-5 w-5 text-neutral-700" />
          </div>
          <div className="space-y-1.5">
            <div className="h-5 w-32 rounded bg-neutral-800" />
            <div className="h-3 w-48 rounded bg-neutral-900" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded-lg bg-neutral-900" />
          <div className="h-8 w-8 rounded-lg bg-neutral-900" />
        </div>
      </div>

      {/* Messages Skeleton List */}
      <div className="flex-1 p-6 space-y-6 overflow-hidden flex flex-col-reverse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`flex gap-4 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
            <div className="h-10 w-10 rounded-full bg-neutral-900 shrink-0" />
            <div className={`space-y-2 max-w-[70%] ${i % 2 === 0 ? 'items-end flex flex-col' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="h-4 w-24 rounded bg-neutral-900" />
                <div className="h-3 w-12 rounded bg-neutral-900/50" />
              </div>
              <div className={`h-16 w-64 rounded-2xl bg-neutral-900 ${i % 2 === 0 ? 'rounded-tr-sm' : 'rounded-tl-sm'}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Input Area Skeleton */}
      <div className="flex-none p-4">
        <div className="max-w-4xl mx-auto rounded-xl border border-neutral-800 bg-neutral-950 p-3 h-24 relative">
          <div className="absolute top-4 left-4 h-4 w-32 rounded bg-neutral-900" />
          <div className="absolute bottom-3 left-3 flex gap-2">
            <div className="h-8 w-8 rounded-lg bg-neutral-900" />
            <div className="h-8 w-8 rounded-lg bg-neutral-900" />
          </div>
          <div className="absolute bottom-3 right-3 h-8 w-24 rounded-lg bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}
