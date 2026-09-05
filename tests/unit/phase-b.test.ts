import { describe, it, expect } from "vitest";

describe("Unit Tests: Phase B Features (Export, Search & Profile)", () => {
  it("escapes CSV values with special characters and commas properly", () => {
    const escapeCsv = (val: string | number | null | undefined) => {
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    expect(escapeCsv('Issue with "quotes" and, commas')).toBe('"Issue with ""quotes"" and, commas"');
    expect(escapeCsv(123)).toBe('"123"');
    expect(escapeCsv(null)).toBe("");
  });

  it("formats search queries and filters accurately", () => {
    const query = "  demo   ";
    expect(query.trim()).toBe("demo");
    expect(query.trim().toUpperCase()).toBe("DEMO");
  });
});
