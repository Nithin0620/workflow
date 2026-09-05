import { EventEmitter } from "events";
import { IssueStatus, IssuePriority } from "@prisma/client";

export type RealtimeEventType =
  | "ISSUE_CREATED"
  | "ISSUE_MOVED"
  | "ISSUE_UPDATED"
  | "ISSUE_DELETED"
  | "COMMENT_ADDED"
  | "COLUMN_CREATED"
  | "COLUMN_UPDATED"
  | "COLUMN_DELETED";

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  projectId: string;
  timestamp: number;
  actor?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  data: {
    issueId?: string;
    targetStatus?: IssueStatus;
    issue?: {
      id: string;
      projectKey: string;
      issueNumber: number;
      title: string;
      status: IssueStatus;
      priority: IssuePriority;
      estimate?: number | null;
      assignee?: { id: string; name?: string | null; image?: string | null } | null;
      _count?: { comments: number; attachments: number };
    };
    comment?: {
      id: string;
      issueId: string;
      content: string;
      createdAt: string;
      author: { id: string; name?: string | null; image?: string | null };
    };
    [key: string]: unknown;
  };
}

// Global in-memory broadcast bus (works across server actions and SSE route handlers)
declare global {
  // eslint-disable-next-line no-var
  var __WORKFLOW_EVENT_BUS__: EventEmitter | undefined;
}

const eventBus = globalThis.__WORKFLOW_EVENT_BUS__ || new EventEmitter();
eventBus.setMaxListeners(200); // Allow high concurrency subscriptions

if (process.env.NODE_ENV !== "production") {
  globalThis.__WORKFLOW_EVENT_BUS__ = eventBus;
}

export function broadcastProjectEvent(event: RealtimeEventPayload) {
  const channel = `project:${event.projectId}`;
  eventBus.emit(channel, event);
}

export function subscribeToProjectEvents(
  projectId: string,
  callback: (event: RealtimeEventPayload) => void
) {
  const channel = `project:${projectId}`;
  eventBus.on(channel, callback);

  return () => {
    eventBus.off(channel, callback);
  };
}
