"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Pencil, X, Plus, Loader2 } from "lucide-react";
import { addBanner, deleteBanner } from "@/actions/banners";

interface BannerSlide {
  id: string;
  imageUrl: string;
}

interface BannerCarouselProps {
  banners: BannerSlide[];
  canEdit?: boolean;
  workspaceId?: string;
  projectId?: string;
}

export function BannerCarousel({ banners, canEdit = false, workspaceId, projectId }: BannerCarouselProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (banners.length <= 1 || editing || paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length, editing, paused]);

  if (banners.length === 0) return null;

  const current = index % banners.length;

  const handleDelete = async (bannerId: string) => {
    setBusy(bannerId);
    await deleteBanner(bannerId);
    router.refresh();
  };

  const handleAdd = async () => {
    if (!url.trim()) return;
    setBusy("add");
    const res = await addBanner({ imageUrl: url.trim(), workspaceId, projectId });
    setBusy(null);
    if (res.error) {
      alert(res.error);
      return;
    }
    setUrl("");
    setAdding(false);
    router.refresh();
  };

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-lg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((b) => (
          <div key={b.id} className="relative w-full shrink-0">
            <img
              src={b.imageUrl}
              alt="Banner"
              className="h-36 sm:h-44 w-full object-cover grayscale contrast-125 brightness-95"
              loading="lazy"
            />
            {canEdit && editing && (
              <button
                onClick={() => handleDelete(b.id)}
                disabled={busy === b.id}
                title="Remove banner image"
                className="absolute right-2 top-12 flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-white hover:bg-rose-600 transition"
              >
                {busy === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)}
            title="Previous"
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/80"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % banners.length)}
            title="Next"
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/80"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? "w-4 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Edit controls */}
      {canEdit && (
        <div className="absolute right-2 top-2 flex gap-1.5">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              title="Manage banner images"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-white hover:bg-black/90 transition"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => setAdding((a) => !a)}
                title="Add image by URL"
                className="flex items-center gap-1 rounded-lg bg-black/70 px-2 text-[11px] font-bold text-white hover:bg-black/90 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
              <button
                onClick={() => setEditing(false)}
                title="Done"
                className="flex h-7 items-center rounded-lg bg-white px-2 text-[11px] font-bold text-black hover:bg-neutral-200 transition"
              >
                Done
              </button>
            </>
          )}
        </div>
      )}

      {editing && adding && (
        <div className="absolute inset-x-0 bottom-0 flex gap-2 border-t border-neutral-800 bg-black/80 p-2 backdrop-blur-sm">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="https://... image URL"
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={busy === "add"}
            className="flex items-center gap-1 rounded-lg bg-white px-3 text-xs font-bold text-black hover:bg-neutral-200 transition"
          >
            {busy === "add" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add
          </button>
        </div>
      )}
    </div>
  );
}