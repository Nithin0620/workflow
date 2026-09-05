import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("Unit Tests: Password Hashing & Verification", () => {
  it("generates a bcrypt hash different from plaintext password", async () => {
    const plaintext = "SecureP@ssw0rd123";
    const hash = await hashPassword(plaintext);

    expect(hash).not.toBe(plaintext);
    expect(hash.startsWith("$2")).toBe(true); // bcrypt prefix
  });

  it("verifies matching password correctly", async () => {
    const plaintext = "MySecretPass!99";
    const hash = await hashPassword(plaintext);

    const isMatch = await verifyPassword(plaintext, hash);
    expect(isMatch).toBe(true);
  });

  it("rejects non-matching password", async () => {
    const plaintext = "MySecretPass!99";
    const wrongPass = "WrongPass!99";
    const hash = await hashPassword(plaintext);

    const isMatch = await verifyPassword(wrongPass, hash);
    expect(isMatch).toBe(false);
  });
});
