import { describe, it, expect } from "vitest";
import { createBoardColumnSchema, updateBoardColumnSchema } from "@/lib/validators";

describe("Unit Tests: Board Columns & Custom Lists Validation", () => {
  it("validates valid board column creation input", () => {
    const valid = {
      name: "QA & Staging",
      color: "#3b82f6",
    };
    const res = createBoardColumnSchema.safeParse(valid);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.name).toBe("QA & Staging");
      expect(res.data.color).toBe("#3b82f6");
    }
  });

  it("applies default color if not specified", () => {
    const valid = {
      name: "Client Feedback",
    };
    const res = createBoardColumnSchema.safeParse(valid);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.color).toBe("#737373");
    }
  });

  it("rejects empty column names", () => {
    const invalid = {
      name: "",
    };
    const res = createBoardColumnSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("rejects names exceeding 30 characters", () => {
    const invalid = {
      name: "A".repeat(31),
    };
    const res = createBoardColumnSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("validates column update schema", () => {
    const updateInput = {
      name: "Production Deployed",
      color: "#10b981",
      order: 3000,
    };
    const res = updateBoardColumnSchema.safeParse(updateInput);
    expect(res.success).toBe(true);
  });

  it("rejects invalid hex colors", () => {
    const invalidColor = {
      name: "Testing",
      color: "not-a-color",
    };
    const res = createBoardColumnSchema.safeParse(invalidColor);
    expect(res.success).toBe(false);
  });
});
