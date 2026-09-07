"use client";

import { useState } from "react";
import { Markdown } from "@/components/markdown";
import {
  MessageSquare,
  Smile,
  Plus,
  ExternalLink,
  Paperclip,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  X,
  Download,
} from "lucide-react";
import { toggleReaction } from "@/actions/discussions";

interface DiscussionMessageItemProps {
  message: {
    id: string;
    content: string;
    createdAt: string | Date;
    replyCount?: number;
    lastReplyAt?: string | Date | null;
    author: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    attachments?: Array<{
      id?: string;
      fileName: string;
      fileSize: number;
      fileType: string;
      fileUrl: string;
    }>;
    reactions?: Array<{
      id?: string;
      emoji: string;
      userId: string;
      user?: { id: string; name?: string | null };
    }>;
    issueLinks?: Array<{
      id: string;
      issue: {
        id: string;
        projectKey: string;
        issueNumber: number;
        title: string;
        status: string;
        priority: string;
        assignee?: { id: string; name?: string | null; image?: string | null } | null;
      };
    }>;
  };
  currentUserId?: string;
  onOpenThread?: (messageId: string) => void;
  onCreateIssue?: (message: any) => void;
  onSelectIssue?: (issueId: string) => void;
  isThreadView?: boolean;
}

const COMMON_EMOJIS = ["👍", "🔥", "🚀", "❤️", "👀", "🙌", "🎉"];

export function DiscussionMessageItem({
  message,
  currentUserId,
  onOpenThread,
  onCreateIssue,
  onSelectIssue,
  isThreadView = false,
}: DiscussionMessageItemProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [optimisticReactions, setOptimisticReactions] = useState(message.reactions || []);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  const formattedDate = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const authorInitial = (message.author.name || message.author.email || "U")[0].toUpperCase();

  // Group reactions by emoji
  const reactionGroups: Record<
    string,
    { emoji: string; count: number; hasReacted: boolean; userNames: string[] }
  > = {};

  for (const r of optimisticReactions) {
    if (!reactionGroups[r.emoji]) {
      reactionGroups[r.emoji] = {
        emoji: r.emoji,
        count: 0,
        hasReacted: false,
        userNames: [],
      };
    }
    reactionGroups[r.emoji].count += 1;
    if (r.userId === currentUserId) {
      reactionGroups[r.emoji].hasReacted = true;
    }
    if (r.user?.name) {
      reactionGroups[r.emoji].userNames.push(r.user.name);
    }
  }

  const handleToggleReaction = async (emoji: string) => {
    setShowEmojiPicker(false);
    // Optimistic toggle
    const hasReacted = reactionGroups[emoji]?.hasReacted;
    if (hasReacted) {
      setOptimisticReactions((prev) =>
        prev.filter((r) => !(r.emoji === emoji && r.userId === currentUserId))
      );
    } else {
      setOptimisticReactions((prev) => [
        ...prev,
        {
          id: `opt_${Date.now()}`,
          emoji,
          userId: currentUserId || "anon",
          user: { id: currentUserId || "anon", name: "You" },
        },
      ]);
    }

    try {
      await toggleReaction(message.id, emoji);
    } catch {
      // rollback if error
      setOptimisticReactions(message.reactions || []);
    }
  };

  return (
    <div
      className={`group relative flex gap-3 px-4 py-2.5 hover:bg-neutral-900/40 dark:hover:bg-neutral-100/40 rounded-xl transition-colors ${
        showEmojiPicker ? "z-30 bg-neutral-900/40 dark:bg-neutral-100/40" : "z-0"
      }`}
    >
      {/* Floating Action Bar */}
      <div
        className={`absolute right-4 top-2 ${
          showEmojiPicker ? "inline-flex opacity-100" : "hidden group-hover:inline-flex"
        } flex-row flex-nowrap items-center gap-1 rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 px-1.5 py-1 shadow-2xl z-30 transition-opacity duration-150 whitespace-nowrap`}
      >
        {/* Quick Reaction Bar */}
        <div className="relative inline-flex">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowEmojiPicker((prev) => !prev);
            }}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition shrink-0 ${
              showEmojiPicker ? "bg-neutral-800 dark:bg-neutral-200 text-white dark:text-black" : "text-neutral-400 hover:bg-neutral-800 dark:hover:bg-neutral-200 hover:text-white dark:text-black"
            }`}
            title="Add reaction"
          >
            <Smile className="h-3.5 w-3.5" />
          </button>

          {showEmojiPicker && (
            <>
              {/* Backdrop to capture clicks outside */}
              <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker(false);
                }}
              />
              <div
                className="absolute right-0 top-full mt-1 flex flex-row items-center gap-1 rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-900 dark:bg-neutral-100 p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleReaction(emoji);
                    }}
                    className="rounded-lg p-1.5 text-base hover:bg-neutral-800 dark:hover:bg-neutral-200 hover:scale-125 transition cursor-pointer shrink-0"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Reply in thread */}
        {!isThreadView && onOpenThread && (
          <button
            type="button"
            onClick={() => onOpenThread(message.id)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-600 hover:bg-neutral-800 hover:text-white dark:text-black transition shrink-0"
            title="Reply in thread"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Create Issue action */}
        {onCreateIssue && (
          <button
            type="button"
            onClick={() => onCreateIssue(message)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 h-7 text-xs font-semibold text-neutral-300 dark:text-neutral-700 hover:bg-neutral-800 hover:text-white dark:text-black transition shrink-0 whitespace-nowrap"
            title="Create tracked Issue from this message"
          >
            <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />
            <span className="text-[11px]">Issue</span>
          </button>
        )}
      </div>

      {/* Author Avatar */}
      <div className="shrink-0 pt-0.5">
        {message.author.image ? (
          <img
            src={message.author.image}
            alt={message.author.name || "User"}
            className="h-8 w-8 rounded-xl object-cover border border-neutral-800 dark:border-neutral-200"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-800 dark:bg-neutral-200 border border-neutral-700/60 font-bold font-mono text-xs text-white dark:text-black">
            {authorInitial}
          </div>
        )}
      </div>

      {/* Message Body & Metadata */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white dark:text-black truncate">
            {message.author.name || message.author.email?.split("@")[0] || "Anonymous"}
          </span>
          <span className="text-[10px] text-neutral-500 dark:text-neutral-500 font-mono">{formattedDate}</span>
        </div>

        {/* Content */}
        <div className="mt-1 text-neutral-200 dark:text-neutral-800">
          <Markdown content={message.content} onSelectIssue={onSelectIssue} />
        </div>

        {/* Attachments & Images */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2.5 space-y-2">
            {/* Image attachments preview grid */}
            {message.attachments.some((att) => att.fileType?.startsWith("image/")) && (
              <div className="flex flex-wrap gap-2">
                {message.attachments
                  .filter((att) => att.fileType?.startsWith("image/"))
                  .map((att, idx) => (
                    <button
                      key={att.id || idx}
                      type="button"
                      onClick={() => setPreviewImage({ url: att.fileUrl, name: att.fileName })}
                      className="group/img relative block overflow-hidden rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-900 dark:bg-neutral-100 transition hover:border-neutral-600 dark:hover:border-neutral-400 max-h-72 max-w-sm cursor-zoom-in text-left"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={att.fileUrl}
                        alt={att.fileName}
                        className="h-auto max-h-64 w-auto object-cover rounded-xl transition duration-200 group-hover/img:scale-[1.02]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition flex items-end justify-between p-2">
                        <span className="text-[10px] text-white dark:text-black font-mono truncate">{att.fileName}</span>
                        <span className="text-[9px] text-neutral-300 dark:text-neutral-700 font-mono bg-black dark:bg-white/60 px-1.5 py-0.5 rounded">Preview</span>
                      </div>
                    </button>
                  ))}
              </div>
            )}

            {/* Non-image file attachments */}
            {message.attachments.some((att) => !att.fileType?.startsWith("image/")) && (
              <div className="flex flex-wrap gap-2">
                {message.attachments
                  .filter((att) => !att.fileType?.startsWith("image/"))
                  .map((att, idx) => (
                    <a
                      key={att.id || idx}
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-900/80 dark:bg-neutral-100/80 px-3 py-1.5 text-xs text-neutral-300 dark:text-neutral-700 hover:border-neutral-700 hover:text-white dark:text-black transition"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-600" />
                      <span className="truncate max-w-[200px]">{att.fileName}</span>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-500 font-mono">
                        ({Math.round(att.fileSize / 1024)} KB)
                      </span>
                      <ExternalLink className="h-3 w-3 text-neutral-500 dark:text-neutral-500" />
                    </a>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Linked Issues Micro-Cards */}
        {message.issueLinks && message.issueLinks.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {message.issueLinks.map((link) => {
              const issue = link.issue;
              const isDone = issue.status === "DONE";
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => onSelectIssue && onSelectIssue(issue.id)}
                  className="group/card relative flex items-center gap-2 rounded-xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 px-3 py-1.5 text-xs shadow-sm hover:border-neutral-600 dark:hover:border-neutral-400 hover:bg-neutral-900 dark:hover:bg-neutral-100 transition text-left cursor-pointer"
                  title={`Click to view issue: ${issue.projectKey}-${issue.issueNumber} - ${issue.title}`}
                >
                  <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold text-[11px]">
                    <Sparkles className="h-3 w-3 shrink-0" />
                    <span>
                      {issue.projectKey}-{issue.issueNumber}
                    </span>
                  </div>
                  <span className="text-white dark:text-black font-medium truncate max-w-[220px]">
                    {issue.title}
                  </span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider ${
                      isDone
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    {issue.status.replace("_", " ")}
                  </span>
                  <ExternalLink className="h-3 w-3 text-neutral-500 dark:text-neutral-500 group-hover/card:text-white dark:text-black transition shrink-0 ml-0.5" />
                </button>
              );
            })}
          </div>
        )}

        {/* Reactions List */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {Object.values(reactionGroups).map((rg) => (
              <button
                key={rg.emoji}
                onClick={() => handleToggleReaction(rg.emoji)}
                className={`flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs transition ${
                  rg.hasReacted
                    ? "border-neutral-600 dark:border-neutral-400 bg-neutral-800 dark:bg-neutral-200 text-white dark:text-black font-semibold"
                    : "border-neutral-800/80 dark:border-neutral-200/80 bg-neutral-900/60 dark:bg-neutral-100/60 text-neutral-400 hover:border-neutral-700 dark:hover:border-neutral-300"
                }`}
                title={rg.userNames.length > 0 ? rg.userNames.join(", ") : undefined}
              >
                <span>{rg.emoji}</span>
                <span className="font-mono text-[11px]">{rg.count}</span>
              </button>
            ))}

            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker((prev) => !prev);
                }}
                className="flex h-6 w-6 items-center justify-center rounded-lg border border-dashed border-neutral-800 dark:border-neutral-200 text-neutral-500 dark:text-neutral-500 hover:border-neutral-700 hover:text-neutral-300 dark:hover:text-neutral-700 transition"
                title="Add reaction"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Thread Replies Button */}
        {!isThreadView && message.replyCount && message.replyCount > 0 && onOpenThread ? (
          <button
            onClick={() => onOpenThread(message.id)}
            className="mt-2 flex items-center gap-2 rounded-xl bg-neutral-900/80 dark:bg-neutral-100/80 border border-neutral-800/60 px-3 py-1 text-xs text-neutral-300 dark:text-neutral-700 hover:bg-neutral-800 hover:text-white dark:text-black transition group/reply"
          >
            <MessageSquare className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-600 group-hover/reply:text-white dark:text-black" />
            <span className="font-semibold text-white dark:text-black">{message.replyCount}</span>
            <span>{message.replyCount === 1 ? "reply" : "replies"}</span>
            {message.lastReplyAt && (
              <span className="text-[10px] text-neutral-500 dark:text-neutral-500 font-mono">
                • last reply {new Date(message.lastReplyAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </button>
        ) : null}
      </div>

      {/* In-Chat Image Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black dark:bg-white/85 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl border border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-50 p-2 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800/80 dark:border-neutral-200/80 mb-2">
              <span className="text-xs font-mono font-medium text-neutral-300 dark:text-neutral-700 truncate max-w-md">
                {previewImage.name}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage.url}
                  download={previewImage.name}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 dark:bg-neutral-100 text-neutral-400 hover:bg-neutral-800 dark:hover:bg-neutral-200 hover:text-white dark:text-black transition"
                  title="Download image"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 dark:bg-neutral-100 text-neutral-400 hover:bg-neutral-800 dark:hover:bg-neutral-200 hover:text-white dark:text-black transition"
                  title="Close preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
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
