"use client";

import { X, Image as ImageIcon } from "lucide-react";
import { BannerCarousel } from "./banner-carousel";

interface BannerDialogProps {
  banners: { id: string; imageUrl: string }[];
  isOpen: boolean;
  onClose: () => void;
  canEdit?: boolean;
  projectId?: string;
  workspaceId?: string;
}

export function BannerDialog({
  banners,
  isOpen,
  onClose,
  canEdit = false,
  projectId,
  workspaceId,
}: BannerDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black dark:bg-white/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 dark:border-neutral-200">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-neutral-300 dark:text-neutral-700" />
            <h2 className="text-lg font-bold text-white dark:text-black">Project Banners</h2>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-neutral-400 dark:text-neutral-600 hover:bg-neutral-900 hover:text-white dark:text-black transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <BannerCarousel
            banners={banners}
            canEdit={canEdit}
            projectId={projectId}
            workspaceId={workspaceId}
          />
        </div>
      </div>
    </div>
  );
}
