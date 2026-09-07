import { NextRequest } from "next/server";
import { getCurrentUser, requireWhiteboardAccess } from "@/lib/auth/session";
import {
  subscribeToWhiteboardEvents,
  broadcastWhiteboardEvent,
  RealtimeEventPayload,
} from "@/lib/realtime/events";

export const dynamic = "force-dynamic";

/**
 * SSE Stream endpoint for Whiteboard real-time events & live cursors
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ whiteboardId: string }> }
) {
  const { whiteboardId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await requireWhiteboardAccess(whiteboardId, "VIEWER");
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send handshake
      const initialMessage = `event: connected\ndata: ${JSON.stringify({
        status: "connected",
        whiteboardId,
        userId: user.id,
        timestamp: Date.now(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initialMessage));

      // Subscribe to real-time events for this whiteboard
      const unsubscribe = subscribeToWhiteboardEvents(
        whiteboardId,
        (event: RealtimeEventPayload) => {
          try {
            const sseData = `event: message\ndata: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          } catch (e) {
            // Stream closed
          }
        }
      );

      // Keepalive heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

/**
 * POST endpoint for broadcasting ephemeral cursor positions & canvas delta operations
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ whiteboardId: string }> }
) {
  const { whiteboardId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await req.json();
  const { type, data } = body;

  const payload: RealtimeEventPayload = {
    type,
    timestamp: Date.now(),
    actor: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    },
    data,
  };

  broadcastWhiteboardEvent(whiteboardId, payload);

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
