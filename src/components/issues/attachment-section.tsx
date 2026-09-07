"use client";

import { useRef, useState } from "react";
import { uploadFileToCloudinary } from "@/lib/cloudinary-client";
import { uploadIssueAttachment, deleteAttachment } from "@/actions/attachments";
import { ATTACHMENT_MAX_BYTES } from "@/lib/validators";
import { formatFileSize } from "@/lib/utils";
import { Paperclip, Trash2, ImagePlus, Loader2, UploadCloud } from "lucide-react";

export interface AttachmentItem {
  id: string;
  issueId: string;
  commentId?: string | null;
  publicId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploader?: { id: string; name?: string | null; image?: string | null } | null;
  createdAt?: string | Date;
}

interface AttachmentSectionProps {
  issueId: string;
  attachments: AttachmentItem[];
  onAdded: (attachment: AttachmentItem) => void;
  onDeleted: (attachmentId: string) => void;
  compact?: boolean;
  title?: string;
}

function isImage(att: AttachmentItem) {
  return att.fileType.startsWith("image/");
}

export function AttachmentGrid({
  attachments,
  onDelete,
  compact,
}: {
  attachments: AttachmentItem[];
  onDelete: (attachmentId: string) => void;
  compact?: boolean;
}) {
  if (attachments.length === 0) return null;

  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-2 sm:grid-cols-3"}`}>
      {attachments.map((att) =>
        isImage(att) ? (
          <div key={att.id} className={`group relative overflow-hidden rounded-lg border border-neutral-800 dark:border-neutral-200 bg-neutral-900 dark:bg-neutral-100 ${compact ? "h-14 w-14" : "h-24"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={att.fileUrl}
              alt={att.fileName}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <button
              onClick={() => onDelete(att.id)}
              title="Delete attachment"
              className="absolute inset-0 flex items-center justify-center bg-black dark:bg-white/70 opacity-0 transition group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4 text-rose-400" />
            </button>
          </div>
        ) : (
          <div
            key={att.id}
            className={`group relative flex items-center gap-2 rounded-lg border border-neutral-800 dark:border-neutral-200 bg-neutral-900 dark:bg-neutral-100 py-2 pl-2 pr-1 ${compact ? "h-14 w-14 !p-0" : ""}`}
          >
            {compact ? (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-[9px] font-bold uppercase text-neutral-400 dark:text-neutral-600">{att.fileType.split("/")[1] || "FILE"}</span>
                <button
                  onClick={() => onDelete(att.id)}
                  title="Delete attachment"
                  className="absolute inset-0 flex items-center justify-center bg-black dark:bg-white/70 opacity-0 transition group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4 text-rose-400" />
                </button>
              </div>
            ) : (
              <>
                <Paperclip className="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-neutral-200 dark:text-neutral-800" title={att.fileName}>
                    {att.fileName}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-500">{formatFileSize(att.fileSize)}</p>
                </div>
                <button
                  onClick={() => onDelete(att.id)}
                  title="Delete attachment"
                  className="rounded p-1 text-neutral-500 dark:text-neutral-500 transition hover:bg-neutral-800 dark:hover:bg-neutral-200 hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        )
      )}
    </div>
  );
}

export function AttachmentSection({ issueId, attachments, onAdded, onDeleted, compact, title = "ATTACHMENTS" }: AttachmentSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.size > 0);
    setUploading(true);
    try {
      for (const file of list) {
        if (file.size > ATTACHMENT_MAX_BYTES) {
          alert(`${file.name} exceeds the 10MB limit and was skipped.`);
          continue;
        }
        try {
          const meta = await uploadFileToCloudinary(file);
          const res = await uploadIssueAttachment(issueId, meta);
          if (res.success && res.attachment) {
            onAdded(res.attachment as AttachmentItem);
          } else if (res.error) {
            alert(res.error);
          }
        } catch {
          alert(`Failed to upload ${file.name}. Check your Cloudinary configuration.`);
        }
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!window.confirm("Delete this attachment?")) return;
    const res = await deleteAttachment(attachmentId);
    if (res.success) onDeleted(attachmentId);
    else alert(res.error || "Could not delete attachment.");
  };

  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-600 font-mono">
        {title}
      </label>

      <AttachmentGrid attachments={attachments} onDelete={handleDelete} compact={compact} />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-xs font-semibold transition ${
          dragging
            ? "border-white dark:border-black bg-neutral-800 text-white dark:text-black"
            : "border-neutral-800 dark:border-neutral-200 bg-neutral-900/40 dark:bg-neutral-100/40 text-neutral-400 hover:border-neutral-600 dark:hover:border-neutral-400 hover:text-neutral-200 dark:hover:text-neutral-800"
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            {compact ? <ImagePlus className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
            <span>Drop files here or click to upload</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}