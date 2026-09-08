import { Loader2 } from "lucide-react";

export default function LoginLoading() {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-white animate-pulse">
      {/* Left Column Skeleton */}
      <div className="flex flex-col justify-between bg-black p-8 sm:p-12 text-white border-b lg:border-b-0 lg:border-r border-neutral-800 lg:w-1/2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-neutral-800" />
            <div className="h-5 w-24 bg-neutral-800 rounded" />
          </div>
          <div className="h-8 w-32 rounded-full bg-neutral-900" />
        </div>

        <div className="my-10 lg:my-auto space-y-6 max-w-md">
          <div className="h-6 w-32 rounded-full bg-neutral-900" />
          <div className="space-y-3">
            <div className="h-10 w-full bg-neutral-800 rounded-lg" />
            <div className="h-10 w-3/4 bg-neutral-800 rounded-lg" />
          </div>
          <div className="space-y-4 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-4 bg-neutral-800 rounded-full" />
                <div className="h-4 w-56 bg-neutral-900 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:block h-4 w-64 bg-neutral-900 rounded" />
      </div>

      {/* Right Column Skeleton */}
      <div className="flex flex-1 items-center justify-center bg-white p-6 sm:p-12 text-black">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-3">
            <div className="h-8 w-56 bg-neutral-200 rounded" />
            <div className="h-4 w-64 bg-neutral-100 rounded" />
          </div>

          <div className="space-y-3">
            <div className="h-11 w-full bg-neutral-100 rounded-lg" />
            <div className="h-11 w-full bg-neutral-100 rounded-lg" />
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-neutral-100" />
            <div className="bg-white px-3">
              <div className="h-3 w-20 bg-neutral-200 rounded" />
            </div>
            <div className="w-full border-t border-neutral-100" />
          </div>

          <div className="space-y-5">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 bg-neutral-200 rounded" />
                <div className="h-11 w-full bg-neutral-50 border border-neutral-200 rounded-lg" />
              </div>
            ))}
            <div className="h-11 w-full bg-neutral-200 rounded-lg mt-6" />
          </div>

          <div className="flex justify-center pt-2">
            <div className="h-4 w-48 bg-neutral-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
