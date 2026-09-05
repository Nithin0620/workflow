import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

describe("Sanity Tests: Core System Modules & Exports", () => {
  it("exports a valid Prisma client singleton", () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma).toBe("object");
  });

  it("exports configured NextAuth options with 3 providers", () => {
    expect(authOptions).toBeDefined();
    expect(authOptions.providers).toHaveLength(3);

    const providerNames = authOptions.providers.map((p) => p.name || p.id);
    expect(providerNames).toContain("Google");
    expect(providerNames).toContain("GitHub");
    expect(providerNames).toContain("Credentials");
  });

  it("defines application branding and metadata correctly", () => {
    expect(APP_NAME).toBe("Workflow");
    expect(APP_DESCRIPTION).toBeTruthy();
  });
});
