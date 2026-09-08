import { Loader2 } from "lucide-react";

export default function InviteLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-black animate-pulse">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-neutral-200" />
          <div className="h-5 w-24 rounded bg-neutral-200" />
        </div>
        <div className="space-y-3">
          <div className="h-6 w-3/4 rounded bg-neutral-200" />
          <div className="h-4 w-full rounded bg-neutral-100" />
          <div className="h-4 w-5/6 rounded bg-neutral-100" />
        </div>
        <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="h-3 w-24 rounded bg-neutral-200 mb-2" />
          <div className="h-4 w-48 rounded bg-neutral-200" />
        </div>
        <div className="mt-6 h-10 w-full rounded-xl bg-neutral-200" />
        <div className="mt-6 flex justify-center">
          <div className="h-3 w-48 rounded bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}
