import { describe, it, expect } from "vitest";
import {
  createAttachmentSchema,
  createSprintSchema,
  ATTACHMENT_MAX_BYTES,
} from "@/lib/validators";
import { formatFileSize } from "@/lib/utils";

describe("Unit Tests: Sprint & Attachment Validators", () => {
  describe("createSprintSchema", () => {
    const base = {
      name: "Checkout Redesign",
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-01-14T00:00:00.000Z",
    };

    it("accepts a valid sprint with dates", () => {
      const result = createSprintSchema.safeParse(base);
      expect(result.success).toBe(true);
    });

    it("accepts an optional goal", () => {
      const result = createSprintSchema.safeParse({ ...base, goal: "Ship the new checkout" });
      expect(result.success).toBe(true);
    });

    it("rejects an end date before the start date", () => {
      const result = createSprintSchema.safeParse({
        ...base,
        startDate: "2026-01-14T00:00:00.000Z",
        endDate: "2026-01-01T00:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a blank sprint name", () => {
      const result = createSprintSchema.safeParse({ ...base, name: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("createAttachmentSchema", () => {
    const base = {
      commentId: null,
      publicId: "workflow/abc123",
      fileName: "screenshot.png",
      fileType: "image/png",
      fileSize: 2048,
      fileUrl: "https://res.cloudinary.com/dx3abc/image/upload/v1/workflow/abc123.png",
    };

    it("accepts a valid attachment", () => {
      expect(createAttachmentSchema.safeParse(base).success).toBe(true);
    });

    it("rejects a file over the size limit", () => {
      const result = createAttachmentSchema.safeParse({
        ...base,
        fileSize: ATTACHMENT_MAX_BYTES + 1,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a non-Cloudinary URL", () => {
      const result = createAttachmentSchema.safeParse({
        ...base,
        fileUrl: "https://example.com/screenshot.png",
      });
      expect(result.success).toBe(false);
    });

    it("requires a public_id", () => {
      const result = createAttachmentSchema.safeParse({ ...base, publicId: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("formatFileSize", () => {
    it("formats bytes, KB, MB", () => {
      expect(formatFileSize(0)).toBe("0 B");
      expect(formatFileSize(500)).toBe("500 B");
      expect(formatFileSize(1536)).toBe("1.5 KB");
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe("2.5 MB");
    });
  });
});