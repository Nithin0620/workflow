"use client";

import { useState } from "react";
import { createBoardColumn } from "@/actions/columns";
import { PlusCircle, X, Loader2 } from "lucide-react";

interface CreateColumnDialogProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onColumnCreated?: (newColumn: { id: string; name: string; key: string; color: string; order: number }) => void;
}

const PRESET_COLORS = [
  "#737373", // Slate/Zinc
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#f43f5e", // Rose
];

export function CreateColumnDialog({
  projectId,
  isOpen,
  onClose,
  onColumnCreated,
}: CreateColumnDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#737373");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await createBoardColumn(projectId, {
        name: name.trim(),
        color,
      });

      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      if (res.column) {
        onColumnCreated?.(res.column);
      }

      setName("");
      setColor("#737373");
      onClose();
    } catch {
      setError("Failed to create list column.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black dark:bg-white/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-6 shadow-2xl text-white dark:text-black">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-900 dark:border-neutral-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-black text-black font-bold">
              <PlusCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white dark:text-black">New List / Column</h3>
              <p className="text-xs text-neutral-400 dark:text-neutral-600">Add a custom workflow stage to this board</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-neutral-400 dark:text-neutral-600 hover:bg-neutral-900 hover:text-white dark:text-black transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-950/50 border border-rose-900 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-600 font-mono mb-1.5">
              List Name
            </label>
            <input
              type="text"
              required
              autoFocus
              maxLength={30}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. QA Testing, In Review, Ready to Deploy"
              className="w-full rounded-xl border border-neutral-800 dark:border-neutral-200 bg-black dark:bg-white px-3.5 py-2.5 text-sm font-medium text-white dark:text-black placeholder:text-neutral-500 focus:border-neutral-600 dark:focus:border-neutral-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-600 font-mono mb-2">
              Color Tag
            </label>
            <div className="flex items-center gap-2.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`cursor-pointer h-7 w-7 rounded-full border-2 transition transform active:scale-95 ${
                    color === c ? "border-white dark:border-black scale-110 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-900 dark:border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold text-neutral-400 dark:text-neutral-600 hover:bg-neutral-900 hover:text-white dark:text-black transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="cursor-pointer flex items-center gap-2 rounded-xl bg-white dark:bg-black px-5 py-2.5 text-xs font-bold text-black dark:text-white shadow-lg hover:bg-neutral-200 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create Column"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
