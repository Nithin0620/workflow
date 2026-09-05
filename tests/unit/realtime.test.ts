import { describe, it, expect, vi } from "vitest";
import {
  broadcastProjectEvent,
  subscribeToProjectEvents,
  RealtimeEventPayload,
} from "@/lib/realtime/events";

describe("Realtime Event Bus & Broadcasting", () => {
  it("allows subscribing and receiving broadcast project events", () => {
    const projectId = "proj-test-123";
    const receivedEvents: RealtimeEventPayload[] = [];

    const unsubscribe = subscribeToProjectEvents(projectId, (event) => {
      receivedEvents.push(event);
    });

    const mockEvent: RealtimeEventPayload = {
      type: "ISSUE_MOVED",
      projectId,
      timestamp: Date.now(),
      actor: {
        id: "user-456",
        name: "Test User",
        email: "test@workflow.dev",
      },
      data: {
        issueId: "issue-789",
        targetStatus: "IN_PROGRESS",
        newOrder: 2000,
      },
    };

    broadcastProjectEvent(mockEvent);

    expect(receivedEvents).toHaveLength(1);
    expect(receivedEvents[0].type).toBe("ISSUE_MOVED");
    expect(receivedEvents[0].data.issueId).toBe("issue-789");
    expect(receivedEvents[0].data.targetStatus).toBe("IN_PROGRESS");

    // Test unsubscribe
    unsubscribe();

    broadcastProjectEvent({
      ...mockEvent,
      type: "ISSUE_DELETED",
    });

    // Should not receive any new events after unsubscribing
    expect(receivedEvents).toHaveLength(1);
  });

  it("isolates events across different project IDs", () => {
    const projectA = "proj-aaa";
    const projectB = "proj-bbb";

    const receivedA: RealtimeEventPayload[] = [];
    const receivedB: RealtimeEventPayload[] = [];

    const unsubA = subscribeToProjectEvents(projectA, (e) => receivedA.push(e));
    const unsubB = subscribeToProjectEvents(projectB, (e) => receivedB.push(e));

    broadcastProjectEvent({
      type: "ISSUE_CREATED",
      projectId: projectA,
      timestamp: Date.now(),
      data: { issueId: "issue-a" },
    });

    expect(receivedA).toHaveLength(1);
    expect(receivedB).toHaveLength(0);

    unsubA();
    unsubB();
  });
});
