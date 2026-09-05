export const APP_NAME = "Workflow";
export const APP_DESCRIPTION = "Real-time engineering and project management workspace";

export const ISSUE_STATUSES = [
  { id: "BACKLOG", label: "Backlog", color: "bg-zinc-500" },
  { id: "TODO", label: "To Do", color: "bg-slate-500" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-blue-500" },
  { id: "IN_REVIEW", label: "In Review", color: "bg-amber-500" },
  { id: "DONE", label: "Done", color: "bg-emerald-500" },
  { id: "CANCELED", label: "Canceled", color: "bg-rose-500" },
] as const;

export const ISSUE_PRIORITIES = [
  { id: "NO_PRIORITY", label: "No Priority", icon: "Minus", color: "text-zinc-400" },
  { id: "LOW", label: "Low", icon: "ArrowDown", color: "text-blue-400" },
  { id: "MEDIUM", label: "Medium", icon: "Equal", color: "text-amber-400" },
  { id: "HIGH", label: "High", icon: "ArrowUp", color: "text-orange-500" },
  { id: "URGENT", label: "Urgent", icon: "AlertCircle", color: "text-rose-500" },
] as const;

export const USER_ROLES = [
  { id: "OWNER", label: "Owner", description: "Full access to workspace and billing" },
  { id: "ADMIN", label: "Admin", description: "Can manage projects, members, and settings" },
  { id: "MEMBER", label: "Member", description: "Can create and edit issues and comments" },
  { id: "VIEWER", label: "Viewer", description: "Read-only access across the workspace" },
] as const;

export const DEFAULT_PAGE_LIMIT = 25;
