import packageInfo from "../../../package.json";

export function VersionDisplay() {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none text-xs font-mono text-neutral-500 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-neutral-200 dark:border-neutral-800 opacity-50 hover:opacity-100 transition-opacity">
      v{packageInfo.version}
    </div>
  );
}
