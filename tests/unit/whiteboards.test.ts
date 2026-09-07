import { describe, it, expect } from "vitest";
import {
  createWhiteboardSchema,
  updateWhiteboardSchema,
  linkWhiteboardProjectSchema,
} from "@/lib/validators";

describe("Whiteboard Validators", () => {
  it("validates createWhiteboardSchema with valid input", () => {
    const validData = {
      title: "System Architecture Flow",
      description: "Auth & DB flow diagram",
      initialData: [{ id: "elem-1", type: "rectangle" }],
      projectIds: ["proj-1", "proj-2"],
    };

    const result = createWhiteboardSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("fails createWhiteboardSchema when title is empty", () => {
    const invalidData = {
      title: "",
    };

    const result = createWhiteboardSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("validates updateWhiteboardSchema partial updates", () => {
    const updateData = {
      title: "Updated Diagram Title",
      data: [{ id: "elem-2", type: "arrow" }],
      thumbnail: "data:image/png;base64,sample...",
    };

    const result = updateWhiteboardSchema.safeParse(updateData);
    expect(result.success).toBe(true);
  });

  it("validates 2-way project linking validator", () => {
    const linkData = {
      whiteboardId: "board-123",
      projectId: "proj-456",
    };

    const result = linkWhiteboardProjectSchema.safeParse(linkData);
    expect(result.success).toBe(true);
  });
});
