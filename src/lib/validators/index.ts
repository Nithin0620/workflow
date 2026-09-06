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

export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024; // 10MB

export const createAttachmentSchema = z.object({
  commentId: z.string().min(1).optional().nullable(),
  publicId: z.string().min(1, "Cloudinary public_id is required").max(300),
  fileName: z.string().min(1, "Filename is required").max(260),
  fileType: z.string().min(1).max(150),
  fileSize: z.number().int().positive().max(ATTACHMENT_MAX_BYTES, "File exceeds 10MB limit"),
  fileUrl: z
    .string()
    .url("Invalid file URL")
    .refine((url) => url.includes("res.cloudinary.com") || url.includes("cloudinary.com"), "File must be hosted on Cloudinary"),
});

export const createSprintSchema = z
  .object({
    name: z.string().min(1, "Sprint name is required").max(100),
    goal: z.string().max(500).optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  })
  .refine((s) => new Date(s.endDate) >= new Date(s.startDate), {
    message: "Sprint end date must be on or after the start date",
    path: ["endDate"],
  });

export const addBannerSchema = z.object({
  imageUrl: z.string().url("Invalid image URL").max(1000),
  workspaceId: z.string().min(1).optional(),
  projectId: z.string().min(1).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
});

export const createBoardColumnSchema = z.object({
  name: z.string().min(1, "Column name is required").max(30, "Column name cannot exceed 30 characters"),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid color hex").optional().default("#737373"),
});

export const updateBoardColumnSchema = z.object({
  name: z.string().min(1, "Column name is required").max(30, "Column name cannot exceed 30 characters").optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid color hex").optional(),
  order: z.number().int().min(0).optional(),
});

export const connectRepositorySchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  repoUrl: z.string().min(1, "Repository URL or owner/repo is required"),
  defaultBranch: z.string().min(1).default("main"),
  accessToken: z.string().max(255).optional().nullable(),
  aiScanEnabled: z.boolean().default(true),
  cronSchedule: z.string().optional().default("0 12 * * *"),
});

export const updateRepositorySchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  defaultBranch: z.string().min(1).optional(),
  accessToken: z.string().max(255).optional().nullable(),
  aiScanEnabled: z.boolean().optional(),
  cronSchedule: z.string().optional(),
});


