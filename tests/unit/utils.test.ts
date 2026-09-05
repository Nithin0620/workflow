import { describe, it, expect } from "vitest";
import { cn, formatDate, formatIssueKey, slugify } from "@/lib/utils";

describe("Unit Tests: Utility Functions", () => {
  describe("cn()", () => {
    it("merges class names cleanly and resolves Tailwind conflicts", () => {
      const result = cn("px-2 py-1", "bg-blue-500", "px-4");
      expect(result).toContain("px-4");
      expect(result).not.toContain("px-2");
      expect(result).toContain("bg-blue-500");
    });

    it("handles conditional classes properly", () => {
      const isSelected = true;
      const isDisabled = false;
      const result = cn(
        "text-sm",
        isSelected && "font-bold",
        isDisabled && "opacity-50"
      );
      expect(result).toContain("font-bold");
      expect(result).not.toContain("opacity-50");
    });
  });

  describe("formatIssueKey()", () => {
    it("formats project key and issue number into standard format", () => {
      expect(formatIssueKey("trip", 101)).toBe("TRIP-101");
      expect(formatIssueKey("dev", 1)).toBe("DEV-1");
      expect(formatIssueKey("APP", 205)).toBe("APP-205");
    });
  });

  describe("slugify()", () => {
    it("converts strings to url-friendly slugs", () => {
      expect(slugify("Trip Tally")).toBe("trip-tally");
      expect(slugify("Engineering & Product Team!")).toBe("engineering-product-team");
      expect(slugify("   Mobile   App   ")).toBe("mobile-app");
    });
  });

  describe("formatDate()", () => {
    it("formats ISO date strings to human-readable format", () => {
      const formatted = formatDate("2026-09-05T12:00:00Z");
      expect(formatted).toContain("2026");
      expect(formatted).toContain("Sep");
    });
  });
});
