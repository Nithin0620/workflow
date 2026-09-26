import { EventEmitter } from "events";
import { IssueStatus, IssuePriority } from "@prisma/client";

export type RealtimeEventType =
  | "ISSUE_CREATED"
  | "ISSUE_MOVED"
  | "ISSUE_UPDATED"
  | "ISSUE_DELETED"
  | "COMMENT_ADDED"
  | "ATTACHMENT_ADDED"
  | "ATTACHMENT_DELETED"
  | "COLUMN_CREATED"
  | "COLUMN_UPDATED"
  | "COLUMN_DELETED"
  | "SPRINT_CREATED"
  | "SPRINT_UPDATED"
  | "SPRINT_DELETED"
  | "MESSAGE_SENT"
  | "MESSAGE_UPDATED"
  | "MESSAGE_DELETED"
  | "REACTION_TOGGLED"
  | "ISSUE_LINKED_TO_DISCUSSION"
  | "CHANNEL_CREATED"
  | "CHANNEL_UPDATED"
  | "CHANNEL_DELETED"
  | "TYPING_INDICATOR"
  | "WHITEBOARD_ELEMENTS_UPDATED"
  | "WHITEBOARD_CURSOR_MOVED"
  | "WHITEBOARD_PAGE_CHANGED";

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  projectId?: string;
  workspaceId?: string;
  channelId?: string;
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
      sprintId?: string | null;
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
    message?: any;
    reaction?: any;
    discussionChannel?: any;
    [key: string]: unknown;
  };
}

// Global in-memory broadcast bus (works across server actions and SSE route handlers)
declare global {

  var __WORKFLOW_EVENT_BUS__: EventEmitter | undefined;
}

const eventBus = globalThis.__WORKFLOW_EVENT_BUS__ || new EventEmitter();
eventBus.setMaxListeners(500); // Allow high concurrency subscriptions

if (process.env.NODE_ENV !== "production") {
  globalThis.__WORKFLOW_EVENT_BUS__ = eventBus;
}

export function broadcastProjectEvent(event: RealtimeEventPayload) {
  if (event.projectId) {
    const channel = `project:${event.projectId}`;
    eventBus.emit(channel, event);
  }
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

export function broadcastDiscussionEvent(event: RealtimeEventPayload) {
  if (event.channelId) {
    eventBus.emit(`discussion-channel:${event.channelId}`, event);
  }
  if (event.workspaceId) {
    eventBus.emit(`discussion-workspace:${event.workspaceId}`, event);
  }
}

export function subscribeToDiscussionChannelEvents(
  channelId: string,
  callback: (event: RealtimeEventPayload) => void
) {
  const channel = `discussion-channel:${channelId}`;
  eventBus.on(channel, callback);

  return () => {
    eventBus.off(channel, callback);
  };
}

export function subscribeToWorkspaceDiscussionEvents(
  workspaceId: string,
  callback: (event: RealtimeEventPayload) => void
) {
  const channel = `discussion-workspace:${workspaceId}`;
  eventBus.on(channel, callback);

  return () => {
    eventBus.off(channel, callback);
  };
}

export function broadcastWhiteboardEvent(whiteboardId: string, event: RealtimeEventPayload) {
  eventBus.emit(`whiteboard:${whiteboardId}`, event);
}

export function subscribeToWhiteboardEvents(
  whiteboardId: string,
  callback: (event: RealtimeEventPayload) => void
) {
  const channel = `whiteboard:${whiteboardId}`;
  eventBus.on(channel, callback);

  return () => {
    eventBus.off(channel, callback);
  };
}

