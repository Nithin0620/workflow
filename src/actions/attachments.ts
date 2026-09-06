"use server";

import { prisma } from "@/lib/db/prisma";
import { requireProjectAccess } from "@/lib/auth/session";
import { createAttachmentSchema } from "@/lib/validators";
import { destroyCloudinaryAsset } from "@/lib/cloudinary";
import { broadcastProjectEvent } from "@/lib/realtime/events";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>;

const SELECT = {
  id: true,
  issueId: true,
  commentId: true,
  publicId: true,
  fileName: true,
  fileSize: true,
  fileType: true,
  fileUrl: true,
  uploaderId: true,
  createdAt: true,
  uploader: { select: { id: true, name: true, image: true } },
} as const;

async function inspectIssue(issueId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { project: true },
  });
  if (!issue) return null;
  return issue;
}

async function logActivity(
  tx: Prisma.TransactionClient,
  project: { workspaceId: string },
  issueId: string,
  actorId: string,
  action: string,
  details: Prisma.InputJsonValue
) {
  await tx.activityLog.create({
    data: {
      workspaceId: project.workspaceId,
      issueId,
      actorId,
      action,
      details,
    },
  });
}

/**
 * Attaches an already-uploaded Cloudinary file to an issue.
 */
export async function uploadIssueAttachment(issueId: string, input: Omit<CreateAttachmentInput, "commentId">) {
  const issue = await inspectIssue(issueId);
  if (!issue) return { error: "Issue not found" };

  const { user, project } = await requireProjectAccess(issue.projectId, "EDITOR");

  const parsed = createAttachmentSchema.safeParse({ ...input, commentId: null });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const attachment = await prisma.$transaction(async (tx) => {
    const created = await tx.attachment.create({
      data: { ...parsed.data, issueId, uploaderId: user.id },
      select: SELECT,
    });
    await logActivity(tx, project, issueId, user.id, "ATTACHMENT_ADDED", {
      fileName: created.fileName,
      attachmentId: created.id,
    });
    return created;
  });

  broadcastProjectEvent({
    type: "ATTACHMENT_ADDED",
    projectId: issue.projectId,
    timestamp: Date.now(),
    actor: { id: user.id, name: user.name, email: user.email, image: user.image },
    data: { issueId, attachment },
  });

  return { success: true, attachment };
}

/**
 * Links an uploaded Cloudinary file to an existing comment (comment uploads).
 */
export async function attachFileToComment(
  issueId: string,
  commentId: string,
  input: Omit<CreateAttachmentInput, "commentId">
) {
  const issue = await inspectIssue(issueId);
  if (!issue) return { error: "Issue not found" };

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.issueId !== issueId) {
    return { error: "Comment not found" };
  }

  // Comments may be posted by viewers; match that access level for uploads here.
  const { user, project } = await requireProjectAccess(issue.projectId, "VIEWER");

  const parsed = createAttachmentSchema.safeParse({ ...input, commentId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const attachment = await prisma.$transaction(async (tx) => {
    const created = await tx.attachment.create({
      data: {
        issueId,
        commentId: parsed.data.commentId,
        publicId: parsed.data.publicId,
        fileName: parsed.data.fileName,
        fileType: parsed.data.fileType,
        fileSize: parsed.data.fileSize,
        fileUrl: parsed.data.fileUrl,
        uploaderId: user.id,
      },
      select: SELECT,
    });
    await logActivity(tx, project, issueId, user.id, "ATTACHMENT_ADDED", {
      fileName: created.fileName,
      attachmentId: created.id,
    });
    return created;
  });

  broadcastProjectEvent({
    type: "ATTACHMENT_ADDED",
    projectId: issue.projectId,
    timestamp: Date.now(),
    actor: { id: user.id, name: user.name, email: user.email, image: user.image },
    data: { issueId, commentId, attachment },
  });

  return { success: true, attachment };
}

/**
 * Deletes an attachment: removes the Cloudinary asset and the DB row.
 * Allowed for the uploader, the issue creator, or a project OWNER.
 */
export async function deleteAttachment(attachmentId: string) {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: { issue: { include: { project: true } } },
  });

  if (!attachment) return { error: "Attachment not found" };

  const { user, projectRole } = await requireProjectAccess(attachment.issue.projectId);

  const isUploader = attachment.uploaderId === user.id;
  const isCreator = attachment.issue.creatorId === user.id;
  const isOwner = projectRole === "OWNER";
  if (!isUploader && !isCreator && !isOwner) {
    return { error: "Forbidden: You can only delete attachments you uploaded." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.attachment.delete({ where: { id: attachmentId } });
    await tx.activityLog.create({
      data: {
        workspaceId: attachment.issue.project.workspaceId,
        issueId: attachment.issueId,
        actorId: user.id,
        action: "ATTACHMENT_DELETED",
        details: { fileName: attachment.fileName, attachmentId: attachment.id },
      },
    });
  });

  // Orphan cleanup is best-effort; don't block the DB deletion on Cloudinary.
  await destroyCloudinaryAsset(attachment.publicId, attachment.fileType);

  broadcastProjectEvent({
    type: "ATTACHMENT_DELETED",
    projectId: attachment.issue.projectId,
    timestamp: Date.now(),
    actor: { id: user.id, name: user.name, email: user.email, image: user.image },
    data: { issueId: attachment.issueId, attachmentId: attachment.id },
  });

  return { success: true };
}