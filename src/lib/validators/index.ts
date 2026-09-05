import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace name must be at least 2 characters").max(50),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and dashes"),
  description: z.string().max(200).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters").max(60),
  key: z.string().min(2, "Key must be at least 2 characters").max(8).toUpperCase().regex(/^[A-Z0-9]+$/, "Key can only contain uppercase letters and numbers"),
  description: z.string().max(500).optional(),
  color: z.string().optional(),
});

export const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELED"]).default("TODO"),
  priority: z.enum(["NO_PRIORITY", "LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assigneeId: z.string().optional().nullable(),
  sprintId: z.string().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
  estimate: z.number().int().min(0).max(100).optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const updateIssueSchema = createIssueSchema.partial().extend({
  order: z.number().optional(),
});

export const createCommentSchema = z.object({
  issueId: z.string().min(1),
  content: z.string().min(1, "Comment cannot be empty").max(5000),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
});
