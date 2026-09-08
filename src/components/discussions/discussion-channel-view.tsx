"use client";

import { useState, useEffect, useRef } from "react";
import { DiscussionMessageItem } from "./discussion-message-item";
import { DiscussionComposer } from "./discussion-composer";
import { DiscussionThreadDrawer } from "./discussion-thread-drawer";
import { CreateIssueFromDiscussionModal } from "./create-issue-from-discussion-modal";
import { IssueDetailModal } from "@/components/issues/issue-detail-modal";
import {
  sendDiscussionMessage,
  markChannelAsRead,
  sendTypingIndicator,
  searchIssuesInWorkspace,
} from "@/actions/discussions";
import {
  Hash,
  Megaphone,
  FolderKanban,
  Users,
  Sparkles,
  Info,
} from "lucide-react";
import Link from "next/link";

interface DiscussionChannelViewProps {
  channel: {
    id: string;
    name: string;
    topic?: string | null;
    type: "TEXT" | "ANNOUNCEMENT";
    workspaceId: string;
    projectId?: string | null;
    project?: { id: string; name: string; key: string } | null;
  };
  initialMessages: any[];
  currentUserId?: string;
  orgSlug: string;
  workspaceSlug: string;
  projects?: Array<{ id: string; name: string; key: string }>;
}

export function DiscussionChannelView({
  channel,
  initialMessages = [],
  currentUserId,
  orgSlug,
  workspaceSlug,
  projects = [],
}: DiscussionChannelViewProps) {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [issueModalMessage, setIssueModalMessage] = useState<any | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mark channel as read on load
  useEffect(() => {
    markChannelAsRead(channel.id).catch(() => {});
  }, [channel.id]);

  // Real-time SSE subscription
  useEffect(() => {
    const eventSource = new EventSource(`/api/realtime/discussions/${channel.id}`);

    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === "MESSAGE_SENT" && payload.data?.message) {
          const newMsg = payload.data.message;
          if (!newMsg.parentId) {
            setMessages((prev) => {
              // If we already have this message by ID, do nothing
              if (prev.some((m) => m.id === newMsg.id)) return prev;

              // Check if we have an optimistic temporary message from this author with identical content/created nearby
              const optIndex = prev.findIndex(
                (m) =>
                  m.id.startsWith("opt_") &&
                  m.content === newMsg.content &&
                  (m.author?.id === newMsg.author?.id || m.author?.name === "You")
              );

              if (optIndex !== -1) {
                const next = [...prev];
                next[optIndex] = newMsg;
                return next;
              }

              return [...prev, newMsg];
            });
          } else {
            // Update parent reply count
            setMessages((prev) =>
              prev.map((m) =>
                m.id === newMsg.parentId
                  ? {
                      ...m,
                      replyCount: (m.replyCount || 0) + 1,
                      lastReplyAt: newMsg.createdAt,
                    }
                  : m
              )
            );
          }
        } else if (payload.type === "REACTION_TOGGLED" && payload.data) {
          const { messageId, emoji, action, userId, userName } = payload.data;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== messageId) return m;
              const currentReactions = m.reactions || [];
              if (action === "ADDED") {
                return {
                  ...m,
                  reactions: [
                    ...currentReactions,
                    { emoji, userId, user: { id: userId, name: userName } },
                  ],
                };
              } else {
                return {
                  ...m,
                  reactions: currentReactions.filter(
                    (r: any) => !(r.emoji === emoji && r.userId === userId)
                  ),
                };
              }
            })
          );
        } else if (payload.type === "ISSUE_LINKED_TO_DISCUSSION" && payload.data) {
          const { messageId, link } = payload.data;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== messageId) return m;
              const currentLinks = m.issueLinks || [];
              if (currentLinks.some((l: any) => l.id === link.id)) return m;
              return {
                ...m,
                issueLinks: [...currentLinks, link],
              };
            })
          );
        } else if (payload.type === "TYPING_INDICATOR" && payload.data) {
          const { userId, userName } = payload.data;
          if (userId !== currentUserId) {
            setTypingUser(userName);
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => {
              setTypingUser(null);
            }, 3000);
          }
        }
      } catch (err) {
        console.error("Error parsing discussion realtime event", err);
      }
    };

    return () => {
      eventSource.close();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [channel.id, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSendMessage = async ({
    content,
    attachments,
  }: {
    content: string;
    attachments?: any[];
  }) => {
    const tempId = `opt_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
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

    setMessages((prev) => [...prev, optimisticMsg]);

    const res = await sendDiscussionMessage(channel.id, {
      content,
      attachments,
    });

    if (res.message) {
      setMessages((prev) => {
        // If message already exists by real ID (delivered by SSE), remove the temp opt message
        if (prev.some((m) => m.id === res.message.id)) {
          return prev.filter((m) => m.id !== tempId);
        }
        return prev.map((m) => (m.id === tempId ? res.message : m));
      });
    }
  };

  const handleSelectIssue = async (keyOrId: string) => {
    // If it's a key like DEMO-2, query the issue ID first
    if (keyOrId.includes("-")) {
      try {
        const res = await searchIssuesInWorkspace(channel.workspaceId, keyOrId);
        if (res.issues && res.issues.length > 0) {
          const match = res.issues.find(
            (i: any) => `${i.projectKey}-${i.issueNumber}`.toUpperCase() === keyOrId.toUpperCase()
          );
          if (match) {
            setSelectedIssueId(match.id);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to lookup issue key:", err);
      }
    }
    setSelectedIssueId(keyOrId);
  };

  const handleIssueCreated = (issue: any, link: any) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === link.messageId) {
          return {
            ...m,
            issueLinks: [...(m.issueLinks || []), link],
          };
        }
        return m;
      })
    );
  };

  const isAnnouncement = channel.type === "ANNOUNCEMENT";

  return (
    <div className="flex h-full w-full overflow-hidden bg-black text-white">
      {/* Main Channel Column */}
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        {/* Channel Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-900 px-6 bg-black">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300">
              {isAnnouncement ? (
                <Megaphone className="h-4 w-4 text-amber-400" />
              ) : (
                <Hash className="h-4 w-4 text-neutral-300" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white font-mono">
                  #{channel.name}
                </h1>
                {channel.project && (
                  <Link
                    href={`/${orgSlug}/${workspaceSlug}/projects/${channel.project.key}/board`}
                    className="flex items-center gap-1 rounded-md border border-neutral-800 bg-neutral-900/60 px-2 py-0.5 text-[10px] font-mono text-neutral-400 hover:border-neutral-700 hover:text-white transition"
                  >
                    <FolderKanban className="h-2.5 w-2.5" />
                    <span>Project: {channel.project.name}</span>
                  </Link>
                )}
              </div>
              {channel.topic && (
                <p className="text-[11px] text-neutral-400 truncate max-w-lg">
                  {channel.topic}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900/50 px-2.5 py-1 text-[11px] text-neutral-400 font-mono">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Sync</span>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          {/* Spacer to push content to bottom if few messages */}
          <div className="flex-1 min-h-0 shrink-0"></div>
          <div className="flex flex-col justify-end space-y-2 mt-auto">
          {/* Welcome Banner at start of stream */}
          <div className="mb-6 px-2 pt-10 shrink-0">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800 text-white shadow-inner mb-4">
              {isAnnouncement ? (
                <Megaphone className="h-8 w-8 text-amber-400" />
              ) : (
                <Hash className="h-8 w-8 text-neutral-300" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome to #{channel.name}!
            </h2>
            <p className="text-neutral-400 max-w-2xl">
              {channel.topic ||
                (channel.project
                  ? `This is the dedicated discussion channel for ${channel.project.name}. Turn any thread into an issue anytime.`
                  : "This is the start of the channel. Send messages, reply in threads, or convert discussions into tracked issues.")}
            </p>
          </div>

          {/* Messages */}
          {messages.map((message) => (
            <DiscussionMessageItem
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              onOpenThread={(msgId) => setActiveThreadId(msgId)}
              onCreateIssue={(msg) => setIssueModalMessage(msg)}
              onSelectIssue={handleSelectIssue}
            />
          ))}
          <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Channel Composer */}
        <div className="p-4 border-t border-neutral-900 bg-black relative">
          {typingUser && (
            <div className="absolute -top-6 left-6 flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono animate-in fade-in duration-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
              <span className="font-semibold text-neutral-200">{typingUser}</span>
              <span>is typing...</span>
            </div>
          )}
          <DiscussionComposer
            placeholder={`Message #${channel.name}...`}
            workspaceId={channel.workspaceId}
            onSendMessage={handleSendMessage}
            onTyping={() => sendTypingIndicator(channel.id)}
          />
        </div>
      </div>

      {/* Slide-out Thread Drawer */}
      {activeThreadId && (
        <DiscussionThreadDrawer
          messageId={activeThreadId}
          channelId={channel.id}
          currentUserId={currentUserId}
          onClose={() => setActiveThreadId(null)}
          onCreateIssue={(msg) => setIssueModalMessage(msg)}
          onSelectIssue={handleSelectIssue}
        />
      )}

      {/* Convert to Issue Modal */}
      {issueModalMessage && (
        <CreateIssueFromDiscussionModal
          message={issueModalMessage}
          channel={channel}
          projects={projects}
          isOpen={true}
          onClose={() => setIssueModalMessage(null)}
          onIssueCreated={handleIssueCreated}
        />
      )}

      {/* Linked Issue Detail Popup Modal */}
      {selectedIssueId && (
        <IssueDetailModal
          issueId={selectedIssueId}
          isOpen={true}
          onClose={() => setSelectedIssueId(null)}
        />
      )}
    </div>
  );
}
