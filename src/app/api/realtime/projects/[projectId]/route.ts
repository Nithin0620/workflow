import { NextRequest } from "next/server";
import { getCurrentUser, requireWorkspaceMember } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { subscribeToProjectEvents, RealtimeEventPayload } from "@/lib/realtime/events";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return new Response(JSON.stringify({ error: "Project not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Ensure user has access to this workspace
  try {
    await requireWorkspaceMember(project.workspaceId);
  } catch {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  // Create readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connected handshake message
      const initialMessage = `event: connected\ndata: ${JSON.stringify({
        status: "connected",
        projectId,
        userId: user.id,
        timestamp: Date.now(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initialMessage));

      // Subscribe to real-time events on this project channel
      const unsubscribe = subscribeToProjectEvents(projectId, (event: RealtimeEventPayload) => {
        try {
          const sseData = `event: message\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        } catch {
          unsubscribe();
        }
      });

      // Keep connection alive with periodic heartbeats every 25 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeatInterval);
          unsubscribe();
        }
      }, 25000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Controller already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
