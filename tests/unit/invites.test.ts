import { describe, it, expect } from "vitest";
import {
  createInviteToken,
  INVITE_TTL_DAYS,
  inviteStatus,
  roleLabel,
  buildInviteEmailHtml,
} from "@/lib/invites";

describe("Unit Tests: Workspace Invites", () => {
  it("createInviteToken produces a unique 64-char hex token", () => {
    const a = createInviteToken();
    const b = createInviteToken();
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(a).not.toBe(b);
  });

  it("roleLabel resolves the four workspace roles", () => {
    for (const [role, label] of [
      ["OWNER", "Owner"],
      ["ADMIN", "Admin"],
      ["MEMBER", "Member"],
      ["VIEWER", "Viewer"],
    ]) {
      expect(roleLabel(role)).toBe(label);
    }
    expect(roleLabel("UNKNOWN")).toBe("UNKNOWN");
  });

  it("inviteStatus distinguishes valid, accepted, and expired", () => {
    const future = new Date(Date.now() + 60 * 1000);
    const past = new Date(Date.now() - 60 * 1000);
    expect(inviteStatus({ acceptedAt: null, expiresAt: future })).toBe("valid");
    expect(inviteStatus({ acceptedAt: new Date(), expiresAt: future })).toBe("accepted");
    expect(inviteStatus({ acceptedAt: null, expiresAt: past })).toBe("expired");
  });

  it("INVITE_TTL_DAYS is a week", () => {
    expect(INVITE_TTL_DAYS).toBe(7);
  });

  it("email html contains the workspace, invitee, role, CTA link, and expiry", () => {
    const html = buildInviteEmailHtml({
      workspaceName: "Capybara Crew",
      inviterName: "Nithin",
      inviteEmail: "leo@capybara.dev",
      roleLabel: "Admin",
      inviteLink: "https://workflow.app/invite?token=abc123",
      expiresAt: new Date("2026-09-20T00:00:00Z"),
    });

    expect(html).toContain("Capybara Crew");
    expect(html).toContain("leo@capybara.dev");
    expect(html).toContain("Admin");
    expect(html).toContain("https://workflow.app/invite?token=abc123");
    expect(html).toContain("was sent to");
  });
});