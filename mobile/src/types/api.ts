export type UserRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type ProjectRole = "OWNER" | "EDITOR" | "VIEWER";

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

export type ChannelType = "TEXT" | "ANNOUNCEMENT";

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  ownerId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceBanner {
  id: string;
  imageUrl: string;
}

export interface WorkspaceCounts {
  projects: number;
  members: number;
  discussionChannels: number;
}

export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string | null;
  organization?: Organization;
  banners?: WorkspaceBanner[];
  role?: UserRole;
  joinedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: WorkspaceCounts;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: UserRole;
  joinedAt: string;
  user?: User;
  workspace?: Workspace;
}

export interface ProjectCounts {
  issues: number;
  members: number;
  columns: number;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  createdAt?: string;
  user?: User;
}

export interface Column {
  id: string;
  projectId: string;
  name: string;
  key: string;
  color: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export type BoardColumn = Column;

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  number: number;
  goal?: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status?: "ACTIVE" | "COMPLETED" | "PLANNED";
  totalIssues?: number;
  openIssues?: number;
  completedIssues?: number;
  totalPoints?: number;
  openPoints?: number;
  completedPoints?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  isPrivate: boolean;
  issueSequence: number;
  leadId?: string | null;
  lead?: User | null;
  members?: ProjectMember[];
  columns?: Column[];
  activeSprint?: Sprint | null;
  role?: ProjectRole;
  _count?: ProjectCounts;
  createdAt?: string;
  updatedAt?: string;
}

export interface Label {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  description?: string | null;
}

export interface IssueCounts {
  comments: number;
  attachments: number;
}

export interface Issue {
  id: string;
  projectId: string;
  projectKey: string;
  issueNumber: number;
  title: string;
  description?: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  order: number;
  assigneeId?: string | null;
  assignee?: User | null;
  creatorId: string;
  creator?: User | null;
  sprintId?: string | null;
  sprint?: {
    id: string;
    name: string;
    number: number;
    goal?: string | null;
    startDate: string;
    endDate: string;
    isActive: boolean;
  } | null;
  labels?: Label[];
  column?: Column | null;
  estimate?: number | null;
  dueDate?: string | null;
  commentsCount?: number;
  attachmentsCount?: number;
  _count?: IssueCounts;
  comments?: Comment[];
  attachments?: Attachment[];
  activityLogs?: ActivityLog[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  issueId: string;
  authorId: string;
  author: User;
  content: string;
  isAi?: boolean;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  issueId?: string;
  commentId?: string | null;
  publicId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploaderId?: string;
  uploader?: User;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  issueId?: string | null;
  workspaceId: string;
  actorId: string;
  actor: User;
  action: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface DiscussionChannel {
  id: string;
  workspaceId: string;
  projectId?: string | null;
  name: string;
  topic?: string | null;
  type: ChannelType;
  isPrivate: boolean;
  position?: number;
  project?: {
    id: string;
    key: string;
    name: string;
    color?: string | null;
    icon?: string | null;
  } | null;
  messageCount?: number;
  unreadCount?: number;
  isUnread?: boolean;
  lastReadAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DiscussionAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  createdAt?: string;
}

export interface DiscussionReaction {
  id: string;
  emoji: string;
  userId: string;
  user?: { id: string; name?: string | null };
}

export interface DiscussionIssueLink {
  id: string;
  issueId: string;
  issue?: {
    id: string;
    projectKey: string;
    issueNumber: number;
    title: string;
    status: IssueStatus;
    priority: IssuePriority;
    assignee?: { id: string; name?: string | null; image?: string | null } | null;
  };
}

export interface DiscussionMessage {
  id: string;
  channelId: string;
  authorId: string;
  author: User;
  content: string;
  parentId?: string | null;
  replyCount?: number;
  lastReplyAt?: string | null;
  isSystem?: boolean;
  attachments?: DiscussionAttachment[];
  reactions?: DiscussionReaction[];
  issueLinks?: DiscussionIssueLink[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

// -------------------------------------------------------------
// API Request & Response Types
// -------------------------------------------------------------

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status?: number;
}

// Auth
export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SignupRequest {
  name: string;
  email: string;
  password?: string;
}

export interface SignupResponse {
  token?: string;
  user?: User;
  userId?: string;
  defaultOrgSlug?: string;
  defaultWorkspaceSlug?: string;
}

export interface MeResponse {
  user: User & {
    workspaceMembers?: WorkspaceMember[];
  };
}

// Workspaces
export interface ListWorkspacesResponse {
  workspaces: Workspace[];
}

export interface GetWorkspaceResponse {
  workspace: Workspace;
}

export interface CreateWorkspaceRequest {
  name: string;
  slug: string;
  description?: string;
  organizationId?: string;
  orgSlug?: string;
}

export interface CreateWorkspaceResponse {
  workspace: Workspace;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  slug?: string;
  description?: string | null;
}

// Projects
export interface ListProjectsResponse {
  projects: Project[];
}

export interface GetProjectResponse {
  project: Project;
}

export interface CreateProjectRequest {
  name: string;
  key: string;
  description?: string;
  color?: string;
  isPrivate?: boolean;
}

export interface CreateProjectResponse {
  project: Project;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string | null;
  color?: string | null;
  isPrivate?: boolean;
  leadId?: string | null;
}

// Issues
export interface IssueFilters {
  sprintId?: string | null;
  columnId?: string;
  assigneeId?: string | null;
  priority?: IssuePriority;
  search?: string;
}

export interface ListIssuesResponse {
  issues: Issue[];
}

export interface GetIssueResponse {
  issue: Issue;
}

export interface CreateIssueRequest {
  title: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeId?: string | null;
  sprintId?: string | null;
  labelIds?: string[];
  estimate?: number;
  dueDate?: string | null;
}

export interface CreateIssueResponse {
  issue: Issue;
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeId?: string | null;
  sprintId?: string | null;
  labelIds?: string[];
  estimate?: number;
  dueDate?: string | null;
  order?: number;
}

export interface UpdateIssueResponse {
  issue: Issue;
}

// Columns
export interface ListColumnsResponse {
  columns: Column[];
}

export interface CreateColumnRequest {
  name: string;
  color?: string;
}

export interface ReorderColumnsRequest {
  orderedColumnIds: string[];
}

// Sprints
export interface ListSprintsResponse {
  sprints: Sprint[];
}

export interface GetSprintResponse {
  sprint: Sprint;
  issues?: Issue[];
}

export interface CreateSprintRequest {
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
}

export interface CreateSprintResponse {
  sprint: Sprint;
}

export interface UpdateSprintRequest {
  name?: string;
  goal?: string | null;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  status?: "PLANNED" | "ACTIVE" | "COMPLETED";
}

// Channels & Messages
export interface ListChannelsResponse {
  channels: DiscussionChannel[];
}

export interface CreateChannelRequest {
  name: string;
  topic?: string;
  type?: ChannelType;
  isPrivate?: boolean;
  projectId?: string | null;
}

export interface CreateChannelResponse {
  channel: DiscussionChannel;
}

export interface ListMessagesResponse {
  messages: DiscussionMessage[];
}

export interface SendMessageRequest {
  content: string;
  parentId?: string | null;
  attachments?: Array<{
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
  }>;
}

export interface SendMessageResponse {
  message: DiscussionMessage;
}

// Notifications
export interface ListNotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface MarkNotificationRequest {
  id?: string;
  all?: boolean;
}

export interface MarkNotificationResponse {
  success: boolean;
}

// Profile
export interface GetProfileResponse {
  profile: User & {
    workspaceMemberships?: WorkspaceMember[];
  };
  user: User & {
    workspaceMemberships?: WorkspaceMember[];
  };
}

export interface UpdateProfileRequest {
  name?: string;
  image?: string | null;
  currentPassword?: string;
  newPassword?: string;
}

export interface UpdateProfileResponse {
  profile: User;
  user: User;
}
