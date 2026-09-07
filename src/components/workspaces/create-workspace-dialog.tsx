"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkspace } from "@/actions/workspaces";
import { slugify } from "@/lib/utils";
import { Building2, X, Loader2 } from "lucide-react";

interface CreateWorkspaceDialogProps {
  orgId?: string;
  orgSlug: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWorkspaceDialog({
  orgId,
  orgSlug,
  isOpen,
  onClose,
}: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    const suggestedSlug = slugify(val);
    if (!slug || slug === suggestedSlug.slice(0, slug.length)) {
      setSlug(suggestedSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Find org id or pass slug
      const res = await createWorkspace(orgId || orgSlug, {
        name,
        slug: slug.toLowerCase(),
        description,
      });

      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      setName("");
      setSlug("");
      setDescription("");
      onClose();
      router.push(`/${res.orgSlug}/${slug.toLowerCase()}`);
      router.refresh();
    } catch {
      setError("Failed to create workspace. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black dark:bg-white/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-6 shadow-2xl text-white dark:text-black">
        <div className="flex items-center justify-between border-b border-neutral-900 dark:border-neutral-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-black text-black font-bold">
              <Building2 className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-white dark:text-black">
              Create New Workspace
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 dark:text-neutral-600 hover:bg-neutral-900 hover:text-white dark:text-black transition"
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
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-600 font-mono">
              Workspace Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Mobile Engineering or DevOps"
              className="mt-1 w-full rounded-xl border border-neutral-800 dark:border-neutral-200 bg-black dark:bg-white px-3.5 py-2.5 text-xs text-white dark:text-black placeholder:text-neutral-500 focus:border-neutral-600 dark:focus:border-neutral-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-600 font-mono">
              Workspace Slug * (URL path)
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="e.g. mobile-engineering"
              className="mt-1 w-full font-mono rounded-xl border border-neutral-800 dark:border-neutral-200 bg-black dark:bg-white px-3.5 py-2.5 text-xs text-white dark:text-black placeholder:text-neutral-500 focus:border-neutral-600 dark:focus:border-neutral-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-600 font-mono">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What team or initiative is this workspace for?"
              className="mt-1 w-full rounded-xl border border-neutral-800 dark:border-neutral-200 bg-black dark:bg-white p-3 text-xs text-white placeholder:text-neutral-500 focus:border-neutral-600 dark:focus:border-neutral-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-900 dark:border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-400 dark:text-neutral-600 hover:bg-neutral-900 hover:text-white dark:text-black transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-white dark:bg-black px-5 py-2.5 text-xs font-bold text-black dark:text-white shadow-lg hover:bg-neutral-200 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create Workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
