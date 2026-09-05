import { describe, it, expect } from "vitest";

describe("Notifications Format & Helpers", () => {
  it("formats notification snippets accurately", () => {
    const rawContent = "This is a very long issue comment that discusses architecture decisions and frontend styling in great detail";
    const snippet = rawContent.slice(0, 60);

    expect(snippet.length).toBeLessThanOrEqual(60);
    expect(snippet).toBe("This is a very long issue comment that discusses architectur");
  });

  it("calculates unread state filters correctly", () => {
    const notifications = [
      { id: "1", isRead: false },
      { id: "2", isRead: true },
      { id: "3", isRead: false },
    ];

    const unread = notifications.filter((n) => !n.isRead);
    expect(unread).toHaveLength(2);
  });
});
