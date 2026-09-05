"use client";

import { useState } from "react";
import { updateBoardColumn, deleteBoardColumn } from "@/actions/columns";
import { Settings, Trash2, X, Loader2 } from "lucide-react";

interface EditColumnDialogProps {
  column: {
    id: string;
    name: string;
    key: string;
    color: string;
    order: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onColumnUpdated?: (updated: { id: string; name: string; key: string; color: string; order: number }) => void;
  onColumnDeleted?: (columnId: string) => void;
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

export function EditColumnDialog({
  column,
  isOpen,
  onClose,
  onColumnUpdated,
  onColumnDeleted,
}: EditColumnDialogProps) {
  const [name, setName] = useState(column.name);
  const [color, setColor] = useState(column.color || "#737373");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await updateBoardColumn(column.id, {
        name: name.trim(),
        color,
      });

      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      if (res.column) {
        onColumnUpdated?.(res.column);
      }
      onClose();
    } catch {
      setError("Failed to update column.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${column.name}"? Any remaining cards will be safely moved to your primary column.`)) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const res = await deleteBoardColumn(column.id);
      if (res.error) {
        setError(res.error);
        setDeleting(false);
        return;
      }

      onColumnDeleted?.(column.id);
      onClose();
    } catch {
      setError("Failed to delete column.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white font-bold border border-neutral-800">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Edit Column</h3>
              <p className="text-xs text-neutral-400 font-mono">{column.key}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-950/50 border border-rose-900 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdate} className="mt-4 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono mb-1.5">
              Column Title
            </label>
            <input
              type="text"
              required
              maxLength={30}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-sm font-medium text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono mb-2">
              Color Tag
            </label>
            <div className="flex items-center gap-2.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition transform active:scale-95 ${
                    color === c ? "border-white scale-110 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-900">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || loading}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete List</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || deleting || !name.trim()}
                className="flex items-center gap-2 rounded-xl bg-white px-5 py-2 text-xs font-bold text-black shadow-lg hover:bg-neutral-200 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
