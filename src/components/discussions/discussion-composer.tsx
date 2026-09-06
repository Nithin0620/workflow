"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Smile,
  Bold,
  Italic,
  Code,
  Quote,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import { uploadFileToCloudinary } from "@/lib/cloudinary-client";
import { searchIssuesInWorkspace } from "@/actions/discussions";

interface DiscussionComposerProps {
  placeholder?: string;
  workspaceId?: string;
  onSendMessage: (data: {
    content: string;
    attachments?: Array<{
      fileName: string;
      fileSize: number;
      fileType: string;
      fileUrl: string;
    }>;
  }) => Promise<void>;
  onTyping?: () => void;
  disabled?: boolean;
}

const COMMON_EMOJIS = ["👍", "🔥", "🚀", "❤️", "👀", "🙌", "🎉", "💡", "⚡"];

interface PendingAttachment {
  file: File;
  previewUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export function DiscussionComposer({
  placeholder = "Message channel...",
  workspaceId,
  onSendMessage,
  onTyping,
  disabled = false,
}: DiscussionComposerProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Issue autocomplete state
  const [issueSuggestions, setIssueSuggestions] = useState<any[]>([]);
  const [showIssueMenu, setShowIssueMenu] = useState(false);
  const [selectedIssueIdx, setSelectedIssueIdx] = useState(0);
  const [issueQuery, setIssueQuery] = useState("");
  const [issueQueryStart, setIssueQueryStart] = useState(-1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTypingRef = useRef<number>(0);

  const handleSubmit = async () => {
    if ((!content.trim() && pendingAttachments.length === 0) || sending || disabled) return;

    setSending(true);
    try {
      // Perform uploads only on Send click
      let uploadedAttachments: Array<{
        fileName: string;
        fileSize: number;
        fileType: string;
        fileUrl: string;
      }> | undefined;

      if (pendingAttachments.length > 0) {
        uploadedAttachments = await Promise.all(
          pendingAttachments.map(async (att) => {
            const res = await uploadFileToCloudinary(att.file);
            return {
              fileName: res.fileName,
              fileSize: res.fileSize,
              fileType: res.fileType,
              fileUrl: res.fileUrl,
            };
          })
        );
      }

      await onSendMessage({
        content: content.trim() || (uploadedAttachments && uploadedAttachments.length > 0 ? "Shared attachments" : ""),
        attachments: uploadedAttachments,
      });

      // Cleanup object URLs to avoid memory leaks
      pendingAttachments.forEach((att) => {
        if (att.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(att.previewUrl);
        }
      });

      setContent("");
      setPendingAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (err) {
      console.error("Failed to send message with attachments:", err);
    } finally {
      setSending(false);
    }
  };

  // Search issues when typing after `#`
  useEffect(() => {
    if (!workspaceId || !showIssueMenu) {
      setIssueSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await searchIssuesInWorkspace(workspaceId, issueQuery);
        if (res.issues) {
          setIssueSuggestions(res.issues);
          setSelectedIssueIdx(0);
        }
      } catch (err) {
        console.error("Failed to query issues for autocomplete:", err);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [workspaceId, showIssueMenu, issueQuery]);

  const selectIssueSuggestion = (issue: any) => {
    if (issueQueryStart === -1) return;
    const before = content.slice(0, issueQueryStart);
    const after = content.slice(issueQueryStart + 1 + issueQuery.length);
    const inserted = `#${issue.projectKey}-${issue.issueNumber} `;
    const newContent = `${before}${inserted}${after}`;
    setContent(newContent);
    setShowIssueMenu(false);
    setIssueSuggestions([]);
    setIssueQuery("");
    setIssueQueryStart(-1);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorPosition = (before + inserted).length;
        textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showIssueMenu && issueSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIssueIdx((prev) => (prev + 1) % issueSuggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIssueIdx((prev) => (prev - 1 + issueSuggestions.length) % issueSuggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const selected = issueSuggestions[selectedIssueIdx];
        if (selected) {
          selectIssueSuggestion(selected);
          return;
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowIssueMenu(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(val);

    // Check if cursor is immediately after a `#` or `#QUERY`
    const textBeforeCursor = val.slice(0, cursorPos);
    const hashMatch = textBeforeCursor.match(/#([A-Za-z0-9-_]*)$/);

    if (hashMatch && workspaceId) {
      const query = hashMatch[1];
      const matchIndex = textBeforeCursor.lastIndexOf("#" + query);
      setIssueQuery(query);
      setIssueQueryStart(matchIndex);
      setShowIssueMenu(true);
    } else {
      setShowIssueMenu(false);
      setIssueSuggestions([]);
    }

    // Throttle typing indicator to at most once every 2 seconds
    if (onTyping && Date.now() - lastTypingRef.current > 2000) {
      lastTypingRef.current = Date.now();
      onTyping();
    }

    // Auto resize
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  };

  const wrapSelection = (prefix: string, suffix: string = prefix) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.slice(start, end);
    const replacement = `${prefix}${selected || "text"}${suffix}`;
    const newContent = text.slice(0, start) + replacement + text.slice(end);
    setContent(newContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected.length || 4)
      );
    }, 0);
  };

  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments((prev) => {
      const target = prev[index];
      if (target?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: PendingAttachment[] = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
    }));

    setPendingAttachments((prev) => [...prev, ...newAttachments]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative rounded-2xl border border-neutral-800 bg-neutral-950 p-2.5 shadow-lg focus-within:border-neutral-700 transition">
      {/* Attachment Preview Chips */}
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2.5 mb-2 border-b border-neutral-800/80">
          {pendingAttachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-1.5 pr-2.5 text-xs text-neutral-300 shadow-sm"
            >
              {att.fileType.startsWith("image/") ? (
                <button
                  type="button"
                  onClick={() => setPreviewImage({ url: att.previewUrl, name: att.fileName })}
                  className="cursor-zoom-in group/thumb relative block overflow-hidden rounded-lg"
                  title="Preview image"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={att.previewUrl}
                    alt={att.fileName}
                    className="h-8 w-8 rounded-lg object-cover border border-neutral-800 transition group-hover/thumb:scale-105"
                  />
                </button>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400">
                  <Paperclip className="h-4 w-4" />
                </div>
              )}
              <div
                className="flex flex-col max-w-[140px] cursor-pointer"
                onClick={() => {
                  if (att.fileType.startsWith("image/")) {
                    setPreviewImage({ url: att.previewUrl, name: att.fileName });
                  }
                }}
              >
                <span className="truncate font-medium text-[11px] text-white hover:underline">
                  {att.fileName}
                </span>
                <span className="text-[9px] text-neutral-500 font-mono">
                  {Math.round(att.fileSize / 1024)} KB
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="text-neutral-500 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition ml-1"
                title="Remove attachment"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Issue Autocomplete Suggestion Popup */}
      {showIssueMenu && issueSuggestions.length > 0 && (
        <div className="absolute bottom-full left-2 mb-2 w-full sm:w-80 max-h-64 overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950 p-1.5 shadow-2xl z-40 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-800/80 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Tag Issue (#{issueQuery})
            </span>
            <span className="text-[9px] text-neutral-600">Tab / Enter to insert</span>
          </div>
          <div className="space-y-0.5">
            {issueSuggestions.map((issue, idx) => {
              const isSelected = idx === selectedIssueIdx;
              const isDone = issue.status === "DONE";
              return (
                <button
                  key={issue.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectIssueSuggestion(issue);
                  }}
                  onMouseEnter={() => setSelectedIssueIdx(idx)}
                  className={`w-full flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                    isSelected ? "bg-blue-600/20 border border-blue-500/30 text-white" : "text-neutral-300 hover:bg-neutral-900"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[11px] text-blue-400">
                        {issue.projectKey}-{issue.issueNumber}
                      </span>
                      <span className="truncate font-medium text-neutral-200">
                        {issue.title}
                      </span>
                    </div>
                    {issue.project?.name && (
                      <div className="text-[10px] text-neutral-500 truncate mt-0.5">
                        Project: {issue.project.name}
                      </div>
                    )}
                  </div>
                  <span
                    className={`rounded px-1 py-0.5 text-[9px] font-bold font-mono uppercase tracking-wider shrink-0 ${
                      isDone
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    {issue.status.replace("_", " ")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Textarea Input */}
      <textarea
        ref={textareaRef}
        rows={1}
        value={content}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        disabled={disabled || sending}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent px-2 text-xs text-white placeholder-neutral-500 focus:outline-none max-h-44 leading-relaxed"
      />

      {/* Action Toolbar */}
      <div className="mt-2 flex items-center justify-between border-t border-neutral-800/50 pt-2 px-1">
        {/* Formatting tools */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => wrapSelection("**")}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
            title="Bold (**text**)"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection("*")}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
            title="Italic (*text*)"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection("`")}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
            title="Inline code (`code`)"
          >
            <Code className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection("> ")}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
            title="Quote (> text)"
          >
            <Quote className="h-3.5 w-3.5" />
          </button>

          <div className="h-3 w-px bg-neutral-800 mx-1" />

          {/* Emoji Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="rounded p-1 text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
              title="Insert Emoji"
            >
              <Smile className="h-3.5 w-3.5" />
            </button>

            {showEmojiPicker && (
              <div className="absolute left-0 bottom-full mb-2 flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 p-2 shadow-2xl z-20">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="rounded-lg p-1 text-sm hover:bg-neutral-800 hover:scale-125 transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || disabled}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-900 hover:text-white transition disabled:opacity-40"
            title="Attach file"
          >
            <Paperclip className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Send Button & Hint */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-500 hidden sm:inline font-mono">
            Return ↵ to send
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={(!content.trim() && pendingAttachments.length === 0) || sending || disabled}
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-black hover:bg-neutral-200 disabled:opacity-30 transition shadow"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
            ) : (
              <Send className="h-3.5 w-3.5 text-black" />
            )}
          </button>
        </div>
      </div>

      {/* In-Chat Image Lightbox Preview Modal for Composer */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 p-2 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800/80 mb-2">
              <span className="text-xs font-mono font-medium text-neutral-300 truncate max-w-md">
                {previewImage.name}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
                title="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Full Image */}
            <div className="flex items-center justify-center overflow-auto max-h-[78vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="h-auto max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
