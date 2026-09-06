import { describe, it, expect } from "vitest";
import { TOURS, isTour } from "@/lib/onboarding-tours";

describe("Unit Tests: Onboarding Tours", () => {
  it("defines tours for the four requested pages", () => {
    for (const id of ["dashboard", "workspace", "board", "analytics"]) {
      expect(isTour(id)).toBe(true);
      expect(TOURS[id].steps.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("every step targets a data-tour selector with copy", () => {
    for (const tour of Object.values(TOURS)) {
      for (const step of tour.steps) {
        expect(step.element).toMatch(/^\[data-tour='[a-z-]+'\]$/);
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.desc.length).toBeGreaterThan(0);
      }
    }
  });

  it("rejects unknown tour ids", () => {
    expect(isTour("nope")).toBe(false);
  });
});