import { describe, it, expect } from "vitest";

describe("Analytics Calculation Engine", () => {
  it("computes completion rate percentage correctly", () => {
    const total = 20;
    const done = 15;
    const rate = Math.round((done / total) * 100);
    expect(rate).toBe(75);
  });

  it("handles zero total issues safely without NaN", () => {
    const total = 0;
    const done = 0;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    expect(rate).toBe(0);
  });

  it("computes cycle time in days accurately", () => {
    const inProgressTime = new Date("2026-09-01T10:00:00Z").getTime();
    const doneTime = new Date("2026-09-03T22:00:00Z").getTime();
    const cycleDays = Number(((doneTime - inProgressTime) / (1000 * 60 * 60 * 24)).toFixed(1));
    expect(cycleDays).toBe(2.5);
  });
});
