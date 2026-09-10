import nodemailer from "nodemailer";
import type { Workspace, User } from "@prisma/client";
import { buildInviteEmailHtml, buildInviteEmailText, roleLabel } from "./invites";
import type { WorkspaceInvite } from "@prisma/client";

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });
}

/**
 * Sends a workspace invite email. Returns false (without throwing) when
 * SMTP is not configured so invite flows keep working with a copy-paste link.
 */
export async function sendInviteEmail(opts: {
  workspace: Workspace;
  inviter: User;
  invite: WorkspaceInvite;
}): Promise<boolean> {
  const { workspace, inviter, invite } = opts;
  const link = `${baseUrl()}/invite?token=${invite.token}`;
  const content = {
    workspaceName: workspace.name,
    inviterName: inviter.name ?? (inviter.email ?? "A teammate").split("@")[0],
    inviteEmail: invite.email,
    roleLabel: roleLabel(invite.role),
    inviteLink: link,
    expiresAt: invite.expiresAt,
  };

  const transporter = buildTransporter();
  if (!transporter) return false;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Workflow <noreply@workflow.app>",
    to: invite.email,
    subject: `${inviter.name ?? "Someone"} invited you to ${workspace.name} on Workflow`,
    text: buildInviteEmailText(content),
    html: buildInviteEmailHtml(content),
  });
  return true;
}

/**
 * Sends a plain activity notification email. Returns false (without throwing)
 * when SMTP is not configured, matching the invite flow's graceful skip.
 */
export async function sendNotificationEmail(opts: {
  to: string;
  title: string;
  message: string;
  link?: string | null;
}): Promise<boolean> {
  const transporter = buildTransporter();
  if (!transporter) return false;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Workflow <noreply@workflow.app>",
    to: opts.to,
    subject: opts.title,
    text: `${opts.message}\n\n${opts.link ? `${baseUrl()}${opts.link}` : baseUrl()}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111;background:#fff">
      <p style="margin:0 0 16px;font-weight:600">${opts.title}</p>
      <p style="margin:0 0 24px;line-height:1.5;color:#444">${opts.message}</p>
      ${opts.link ? `<a href="${baseUrl()}${opts.link}" style="display:inline-block;background:#000;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:13px">View in Workflow</a>` : ""}
    </div>`,
  });
  return true;
}