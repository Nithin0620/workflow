"use client";

import { useEffect, useState, useRef } from "react";
import { RealtimeEventPayload } from "@/lib/realtime/events";

interface UseProjectRealtimeOptions {
  projectId: string;
  onEvent?: (event: RealtimeEventPayload) => void;
  enabled?: boolean;
}

export function useProjectRealtime({
  projectId,
  onEvent,
  enabled = true,
}: UseProjectRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEventPayload | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);

  // Keep latest onEvent callback ref without re-triggering connection effect
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled || !projectId) return;

    let isMounted = true;
    let reconnectTimeout: NodeJS.Timeout;

    function connect() {
      if (!isMounted) return;

      try {
        const es = new EventSource(`/api/realtime/projects/${projectId}`);
        eventSourceRef.current = es;

        es.onopen = () => {
          if (isMounted) {
            setIsConnected(true);
          }
        };

        es.addEventListener("message", (event) => {
          if (!isMounted) return;
          try {
            const payload = JSON.parse(event.data) as RealtimeEventPayload;
            setLastEvent(payload);
            if (onEventRef.current) {
              onEventRef.current(payload);
            }
          } catch (err) {
            console.error("[Realtime] Error parsing event payload:", err);
          }
        });

        es.onerror = () => {
          if (isMounted) {
            setIsConnected(false);
            es.close();
            // Reconnect after 3 seconds
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };
      } catch (err) {
        console.error("[Realtime] Connection failed:", err);
        if (isMounted) {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 5000);
        }
      }
    }

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [projectId, enabled]);

  return {
    isConnected,
    lastEvent,
  };
}
