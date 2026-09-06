import { describe, it, expect } from "vitest";
import { computeNextRun } from "@/lib/cron";

describe("computeNextRun", () => {
  it("returns null when disabled", () => {
    expect(computeNextRun("0 12 * * *", false)).toBeNull();
  });

  it("computes the next occurrence in the future for a valid schedule", () => {
    const pastish = new Date("2020-01-01T00:00:00Z");
    const next = computeNextRun("0 12 * * *", true);
    expect(next).not.toBeNull();
    expect(next!.getTime()).toBeGreaterThan(pastish.getTime());
  });

  it("returns null for an invalid schedule", () => {
    expect(computeNextRun("not a cron", true)).toBeNull();
  });
});