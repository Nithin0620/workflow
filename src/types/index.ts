export type UserRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export type IssueStatus =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "CANCELED";

export type IssuePriority =
  | "NO_PRIORITY"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: UserRole;
  user: User;
  joinedAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  key: string; // e.g. "DEV", "APP"
  description?: string;
  leadId?: string;
  lead?: User;
  icon?: string;
  color?: string;
  issueSequence: number;
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  description?: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  number: number;
  goal?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Issue {
  id: string;
  projectId: string;
  projectKey: string;
  issueNumber: number; // #101
  title: string;
  description?: string;
  status: IssueStatus;
  priority: IssuePriority;
  order: number; // for Kanban column position sorting
  assigneeId?: string;
  assignee?: User;
  creatorId: string;
  creator: User;
  sprintId?: string;
  sprint?: Sprint;
  labels: Label[];
  estimate?: number; // story points
  dueDate?: string;
  commentCount: number;
  attachmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  issueId: string;
  authorId: string;
  author: User;
  content: string; // supports markdown and @mentions
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  issueId: string;
  commentId?: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploaderId: string;
  uploader: User;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  issueId?: string;
  projectId?: string;
  workspaceId: string;
  actorId: string;
  actor: User;
  action: string; // e.g. "STATUS_CHANGED", "ASSIGNED", "COMMENTED"
  details: Record<string, unknown>;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export type RealtimeEvent<T = unknown> = {
  type:
    | "ISSUE_CREATED"
    | "ISSUE_UPDATED"
    | "ISSUE_DELETED"
    | "ISSUE_MOVED"
    | "COMMENT_ADDED"
    | "USER_PRESENCE"
    | "NOTIFICATION_SENT";
  payload: T;
  timestamp: string;
};
