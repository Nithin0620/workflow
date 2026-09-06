import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DiscussionMessageItem } from "@/components/discussions/discussion-message-item";
import { DiscussionComposer } from "@/components/discussions/discussion-composer";

describe("Discussions UI Components", () => {
  const sampleMessage = {
    id: "msg_1",
    content: "We should fix the 401 error in auth endpoint.",
    createdAt: new Date("2026-09-06T12:00:00Z"),
    author: {
      id: "user_1",
      name: "Nithin",
      email: "nithin@example.com",
      image: null,
    },
    reactions: [
      {
        id: "r_1",
        emoji: "🚀",
        userId: "user_1",
        user: { id: "user_1", name: "Nithin" },
      },
    ],
    replyCount: 2,
    lastReplyAt: new Date("2026-09-06T12:05:00Z"),
  };

  it("renders DiscussionMessageItem with author name, content, and reactions", () => {
    render(
      <DiscussionMessageItem
        message={sampleMessage}
        currentUserId="user_1"
        onOpenThread={vi.fn()}
      />
    );

    expect(screen.getByText("Nithin")).toBeDefined();
    expect(screen.getByText("We should fix the 401 error in auth endpoint.")).toBeDefined();
    expect(screen.getByText("🚀")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("replies")).toBeDefined();
  });

  it("triggers onOpenThread callback when replies button is clicked", () => {
    const handleOpenThread = vi.fn();
    render(
      <DiscussionMessageItem
        message={sampleMessage}
        currentUserId="user_1"
        onOpenThread={handleOpenThread}
      />
    );

    const replyButton = screen.getByText("replies").closest("button");
    if (replyButton) {
      fireEvent.click(replyButton);
      expect(handleOpenThread).toHaveBeenCalledWith("msg_1");
    }
  });

  it("renders DiscussionComposer and submits on send", async () => {
    const handleSend = vi.fn().mockResolvedValue(undefined);
    render(
      <DiscussionComposer
        placeholder="Type a message..."
        onSendMessage={handleSend}
      />
    );

    const textarea = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(textarea, { target: { value: "Hello team!" } });
    expect((textarea as HTMLTextAreaElement).value).toBe("Hello team!");

    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(handleSend).toHaveBeenCalledWith({
      content: "Hello team!",
      attachments: undefined,
    });
  });
});
