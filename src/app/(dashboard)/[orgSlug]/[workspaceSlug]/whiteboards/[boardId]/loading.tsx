import { Loader2 } from "lucide-react";

export default function WhiteboardDetailLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-black text-neutral-400">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm">Loading canvas...</p>
      </div>
    </div>
  );
}
