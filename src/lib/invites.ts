import { randomBytes } from "crypto";

export const INVITE_TTL_DAYS = 7;

export function createInviteToken(): string {
  return randomBytes(32).toString("hex");
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

export function inviteStatus(invite: { acceptedAt: Date | null; expiresAt: Date }) {
  const now = new Date();
  if (invite.acceptedAt) return "accepted" as const;
  if (invite.expiresAt < now) return "expired" as const;
  return "valid" as const;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Renders the invite email. Inline-styled table layout for maximum
 * compatibility across email clients (Gmail, Outlook, Apple Mail).
 */
export function buildInviteEmailHtml(opts: {
  workspaceName: string;
  inviterName: string;
  inviteEmail: string;
  roleLabel: string;
  inviteLink: string;
  expiresAt: Date;
}): string {
  const { workspaceName, inviterName, inviteEmail, roleLabel, inviteLink, expiresAt } = opts;
  const expiry = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(expiresAt);

  const html = {
    workspaceName: esc(workspaceName),
    inviterName: esc(inviterName),
    inviteEmail: esc(inviteEmail),
    roleLabel: esc(roleLabel),
    inviteLink: esc(inviteLink),
    expiry: esc(expiry),
  };

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#111113;border:1px solid #26262b;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 36px 8px 36px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="left" style="font-size:16px;font-weight:800;color:#ffffff;letter-spacing:0.3px;">
                      <span style="display:inline-block;background:#ffffff;color:#000000;border-radius:8px;padding:1px 8px;font-size:13px;margin-right:8px;">W</span>Workflow
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 36px 8px 36px;">
                <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;">
                  ${html.inviterName} invited you to ${html.workspaceName}
                </h1>
                <p style="margin:14px 0 0 0;font-size:14px;line-height:1.6;color:#a1a1aa;">
                  You've been invited to collaborate in the
                  <strong style="color:#e4e4e7;">${html.workspaceName}</strong> workspace on Workflow
                  as a <strong style="color:#e4e4e7;">${html.roleLabel}</strong>. Accept the invitation to
                  start working together on boards, issues, and sprints.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 36px;">
                <a href="${html.inviteLink}"
                   style="display:inline-block;background:#ffffff;color:#000000;text-decoration:none;font-size:14px;font-weight:700;padding:14px 36px;border-radius:10px;">
                  Accept invitation
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px 8px 36px;">
                <p style="margin:0;font-size:12.5px;line-height:1.6;color:#a1a1aa;">
                  If the button doesn't work, paste this link into your browser:<br />
                  <span style="color:#71717a;word-break:break-all;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;">${html.inviteLink}</span>
                </p>
                <p style="margin:12px 0 0 0;font-size:12.5px;line-height:1.6;color:#a1a1aa;">
                  <strong style="color:#e4e4e7;">Not registered yet?</strong> No problem — sign up
                  with <span style="color:#e4e4e7;font-weight:600;">${html.inviteEmail}</span> (the email this
                  invitation was sent to) and you'll be able to accept right away.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 36px 28px 36px;border-top:1px solid #232327;">
                <p style="margin:0;font-size:11.5px;color:#71717a;line-height:1.6;">
                  This invitation was sent to <strong style="color:#a1a1aa;">${html.inviteEmail}</strong> by
                  ${html.inviterName}. It expires on <strong style="color:#a1a1aa;">${html.expiry}</strong>.
                  If you weren't expecting this invitation, you can safely ignore this email.
                </p>
                <p style="margin:14px 0 0 0;font-size:11px;color:#52525b;">© ${new Date().getFullYear()} Workflow. High-velocity project management for engineering teams.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildInviteEmailText(opts: {
  workspaceName: string;
  inviterName: string;
  inviteEmail: string;
  roleLabel: string;
  inviteLink: string;
  expiresAt: Date;
}): string {
  const { workspaceName, inviterName, inviteEmail, roleLabel, inviteLink, expiresAt } = opts;
  return [
    `${inviterName} invited you to ${workspaceName}`,
    "",
    `You've been invited to collaborate in the ${workspaceName} workspace on Workflow as a ${roleLabel}.`,
    "",
    `Accept the invitation: ${inviteLink}`,
    "",
    `Not registered yet? No problem — sign up with ${inviteEmail} and you'll be able to accept right away.`,
    `This invitation expires on ${expiresAt.toDateString()}.`,
  ].join("\n");
}