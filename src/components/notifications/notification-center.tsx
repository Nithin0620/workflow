"use client";

import { useEffect, useState, useRef } from "react";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/actions/notifications";
import { Bell, CheckCheck, Inbox, ExternalLink, Loader2 } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date | string;
}

function timeAgo(dateInput: Date | string) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await getUserNotifications();
      setNotifications(res.notifications as NotificationItem[]);
      setUnreadCount(res.unreadCount);
    } catch {
      // Ignore background fetch error
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s

    const handleCustomEvent = () => {
      fetchNotifications();
    };

    window.addEventListener("workflow_notification_updated", handleCustomEvent);
    window.addEventListener("focus", handleCustomEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener("workflow_notification_updated", handleCustomEvent);
      window.removeEventListener("focus", handleCustomEvent);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id: string, link?: string | null) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markNotificationAsRead(id);
    if (link) {
      window.location.href = link;
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsAsRead();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white transition"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(244,63,94,0.8)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl z-50 overflow-hidden text-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-900 px-4 py-3 bg-black">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-md bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-neutral-300">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-white transition"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-900">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-neutral-500 mb-2">
                  <Inbox className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-neutral-300">All caught up</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">No unread notifications at this time.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id, n.link)}
                  className={`flex cursor-pointer items-start gap-3 p-3.5 transition hover:bg-neutral-900/60 ${
                    !n.isRead ? "bg-neutral-900/30" : "opacity-80"
                  }`}
                >
                  <div className="mt-1 flex h-2 w-2 shrink-0 items-center justify-center">
                    {!n.isRead ? (
                      <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-neutral-700" />
                    )}
                  </div>

                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">{n.title}</span>
                      <span className="font-mono text-[10px] text-neutral-500 shrink-0">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
