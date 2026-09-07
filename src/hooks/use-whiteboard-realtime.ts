"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { CanvasElement, WhiteboardDocument } from "@/components/whiteboard/types";

export interface RemoteCursor {
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  lastSeen: number;
}

const PEER_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export function useWhiteboardRealtime(
  whiteboardId: string,
  currentUserId?: string,
  onRemoteElementsUpdate?: (elements: CanvasElement[]) => void,
  onRemotePageChange?: (pageId: string) => void
) {
  const [remoteCursors, setRemoteCursors] = useState<Record<string, RemoteCursor>>({});
  const cursorThrottleRef = useRef<number>(0);

  // Broadcast current user cursor position
  const broadcastCursor = useCallback(
    (x: number, y: number) => {
      const now = Date.now();
      if (now - cursorThrottleRef.current < 40) return; // 25fps throttle
      cursorThrottleRef.current = now;

      fetch(`/api/realtime/whiteboards/${whiteboardId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "WHITEBOARD_CURSOR_MOVED",
          data: { x, y },
        }),
      }).catch(() => {});
    },
    [whiteboardId]
  );

  // Broadcast element updates to other peers
  const broadcastElementsUpdate = useCallback(
    (elements: CanvasElement[]) => {
      fetch(`/api/realtime/whiteboards/${whiteboardId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "WHITEBOARD_ELEMENTS_UPDATED",
          data: { elements },
        }),
      }).catch(() => {});
    },
    [whiteboardId]
  );

  // SSE Stream Listener
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(`/api/realtime/whiteboards/${whiteboardId}`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (!payload.type) return;

          if (payload.type === "WHITEBOARD_CURSOR_MOVED" && payload.actor) {
            const userId = payload.actor.id;

            // Never show your own cursor as a remote peer
            if (currentUserId && userId === currentUserId) {
              return;
            }

            // Generate deterministic color based on user ID
            const colorIdx =
              Math.abs(
                userId.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
              ) % PEER_COLORS.length;

            setRemoteCursors((prev) => ({
              ...prev,
              [userId]: {
                userId,
                name: payload.actor.name || payload.actor.email?.split("@")[0] || "Collaborator",
                color: PEER_COLORS[colorIdx],
                x: payload.data.x,
                y: payload.data.y,
                lastSeen: Date.now(),
              },
            }));
          }

          if (payload.type === "WHITEBOARD_ELEMENTS_UPDATED" && payload.data?.elements) {
            // Ignore own echoed broadcast updates so local in-progress state is never overwritten
            if (currentUserId && payload.actor?.id === currentUserId) {
              return;
            }
            onRemoteElementsUpdate?.(payload.data.elements);
          }

          if (payload.type === "WHITEBOARD_PAGE_CHANGED" && payload.data?.pageId) {
            onRemotePageChange?.(payload.data.pageId);
          }
        } catch (err) {
          // ignore malformed SSE
        }
      };
    } catch (e) {
      console.error("SSE Connection error:", e);
    }

    // Clean up stale cursors every 4 seconds
    const pruneInterval = setInterval(() => {
      const now = Date.now();
      setRemoteCursors((prev) => {
        const next: Record<string, RemoteCursor> = {};
        for (const [id, cursor] of Object.entries(prev)) {
          if (now - cursor.lastSeen < 6000) {
            next[id] = cursor;
          }
        }
        return next;
      });
    }, 4000);

    return () => {
      clearInterval(pruneInterval);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [whiteboardId, onRemoteElementsUpdate, onRemotePageChange]);

  return {
    remoteCursors: Object.values(remoteCursors),
    broadcastCursor,
    broadcastElementsUpdate,
  };
}
