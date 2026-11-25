"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  requireText?: string;
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

type ConfirmDialogContentProps = Omit<ConfirmDialogProps, "open">;

export function ConfirmDialog({ open, ...props }: ConfirmDialogProps) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(<ConfirmDialogContent {...props} />, document.body);
}

function ConfirmDialogContent({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  requireText,
  pending = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogContentProps) {
  const [typedValue, setTypedValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const inputId = useId();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onCancel();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [pending, onCancel]);

  useEffect(() => {
    if (requireText) inputRef.current?.focus();
  }, [requireText]);

  const canConfirm = !pending && (!requireText || typedValue === requireText);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl text-white"
      >
        <div className="flex items-start gap-3 border-b border-neutral-900 pb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-900/60 bg-rose-950/50 text-rose-400">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-bold text-white">
              {title}
            </h2>
            {description && (
              <div id={descriptionId} className="mt-1 text-xs leading-relaxed text-neutral-400">
                {description}
              </div>
            )}
          </div>
        </div>

        {requireText && (
          <div className="mt-4">
            <label
              htmlFor={inputId}
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono"
            >
              Type <span className="text-white">{requireText}</span> to confirm
            </label>
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={typedValue}
              onChange={(event) => setTypedValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && canConfirm) void onConfirm();
              }}
              disabled={pending}
              placeholder={requireText}
              className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-sm font-medium text-white placeholder:text-neutral-600 focus:border-rose-800 focus:outline-none disabled:opacity-50"
            />
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-300"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-neutral-900 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold text-neutral-400 hover:bg-neutral-900 hover:text-white transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={!canConfirm}
            className="cursor-pointer flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:bg-rose-500 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
