import { describe, it, expect } from "vitest";
import { authOptions } from "@/lib/auth/options";

describe("Smoke Tests: Auth Configuration & Callbacks", () => {
  it("has jwt session strategy configured", () => {
    expect(authOptions.session?.strategy).toBe("jwt");
  });

  it("has dedicated custom signIn and error pages configured", () => {
    expect(authOptions.pages?.signIn).toBe("/login");
    expect(authOptions.pages?.error).toBe("/login");
  });

  it("has jwt and session callbacks properly defined", () => {
    expect(typeof authOptions.callbacks?.jwt).toBe("function");
    expect(typeof authOptions.callbacks?.session).toBe("function");
  });
});
