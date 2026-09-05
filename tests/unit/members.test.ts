import { describe, it, expect } from "vitest";
import { z } from "zod";

const inviteMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

describe("Member Invite & Role Validation", () => {
  it("validates correct email addresses and roles", () => {
    const valid = inviteMemberSchema.safeParse({
      email: "engineer@company.com",
      role: "ADMIN",
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.email).toBe("engineer@company.com");
      expect(valid.data.role).toBe("ADMIN");
    }
  });

  it("rejects malformed email addresses", () => {
    const invalid = inviteMemberSchema.safeParse({
      email: "not-an-email",
      role: "MEMBER",
    });
    expect(invalid.success).toBe(false);
  });

  it("rejects unauthorized role types", () => {
    const invalid = inviteMemberSchema.safeParse({
      email: "test@domain.com",
      role: "SUPER_ADMIN",
    });
    expect(invalid.success).toBe(false);
  });
});
