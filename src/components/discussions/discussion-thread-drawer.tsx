"use client";

import { useEffect, useState, useRef } from "react";
import { getThreadMessages, sendDiscussionMessage } from "@/actions/discussions";
import { DiscussionMessageItem } from "./discussion-message-item";
import { DiscussionComposer } from "./discussion-composer";
import { X, MessageSquare, Loader2, Sparkles } from "lucide-react";

interface DiscussionThreadDrawerProps {
  messageId: string;
  channelId: string;
  currentUserId?: string;
  onClose: () => void;
  onCreateIssue?: (message: any) => void;
  onSelectIssue?: (issueId: string) => void;
}

export function DiscussionThreadDrawer({
  messageId,
  channelId,
  currentUserId,
  onClose,
  onCreateIssue,
  onSelectIssue,
}: DiscussionThreadDrawerProps) {
  const [parentMessage, setParentMessage] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadThread = async () => {
    setLoading(true);
    const res = await getThreadMessages(messageId);
    if (res.parentMessage) {
      setParentMessage(res.parentMessage);
      setReplies(res.replies || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadThread();
  }, [messageId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies]);

  const handleSendReply = async ({
    content,
    attachments,
  }: {
    content: string;
    attachments?: any[];
  }) => {
    // Optimistic reply
    const tempReply = {
      id: `opt_${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      author: {
        id: currentUserId || "anon",
        name: "You",
        email: null,
        image: null,
      },
      attachments,
      reactions: [],
      issueLinks: [],
    };
    setReplies((prev) => [...prev, tempReply]);

    const res = await sendDiscussionMessage(channelId, {
      content,
      parentId: messageId,
      attachments,
    });

    if (res.message) {
      setReplies((prev) =>
        prev.map((r) => (r.id === tempReply.id ? res.message : r))
      );
    }
  };

  return (
    <div className="flex h-full w-96 flex-col border-l border-neutral-900 dark:border-neutral-100 bg-neutral-950/95 dark:bg-neutral-50/95 backdrop-blur shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-neutral-900 dark:border-neutral-100 px-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-white dark:text-black" />
          <h3 className="text-xs font-bold text-white dark:text-black uppercase tracking-wider font-mono">
            Thread
          </h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-neutral-400 dark:text-neutral-600 hover:bg-neutral-900 hover:text-white dark:text-black transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content Stream */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-500 dark:text-neutral-500" />
          </div>
        ) : parentMessage ? (
          <>
            {/* Root Message */}
            <div className="border-b border-neutral-900 dark:border-neutral-100 pb-3">
              <DiscussionMessageItem
                message={parentMessage}
                currentUserId={currentUserId}
                onCreateIssue={onCreateIssue}
                onSelectIssue={onSelectIssue}
                isThreadView={true}
              />
            </div>

            {/* Reply Count Separator */}
            {replies.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1">
                <div className="h-px flex-1 bg-neutral-900 dark:bg-neutral-100" />
                <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">
                  {replies.length} {replies.length === 1 ? "reply" : "replies"}
                </span>
                <div className="h-px flex-1 bg-neutral-900 dark:bg-neutral-100" />
              </div>
            )}

            {/* Replies List */}
            <div className="space-y-1">
              {replies.map((reply) => (
                <DiscussionMessageItem
                  key={reply.id}
                  message={reply}
                  currentUserId={currentUserId}
                  onCreateIssue={onCreateIssue}
                  onSelectIssue={onSelectIssue}
                  isThreadView={true}
                />
              ))}
            </div>
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="p-4 text-center text-xs text-neutral-500 dark:text-neutral-500">
            Thread could not be loaded.
          </div>
        )}
      </div>

      {/* Thread Composer */}
      <div className="border-t border-neutral-900 dark:border-neutral-100 p-3 bg-black dark:bg-white">
        <DiscussionComposer
          placeholder="Reply in thread..."
          workspaceId={parentMessage?.channel?.workspaceId}
          onSendMessage={handleSendReply}
        />
      </div>
    </div>
  );
}
