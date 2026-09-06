import { describe, it, expect } from "vitest";
import { defaultBannerUrls } from "@/lib/banners";
import { addBannerSchema } from "@/lib/validators";

describe("Unit Tests: Banners", () => {
  it("generates 3-4 unique picsum URLs with sequential sort order", () => {
    for (let i = 0; i < 20; i++) {
      const banners = defaultBannerUrls();
      expect(banners.length).toBeGreaterThanOrEqual(3);
      expect(banners.length).toBeLessThanOrEqual(4);
      const urls = banners.map((b) => b.imageUrl);
      expect(new Set(urls).size).toBe(urls.length);
      banners.forEach((b, idx) => {
        expect(b.imageUrl).toMatch(/^https:\/\/picsum\.photos\/seed\//);
        expect(b.sortOrder).toBe(idx);
      });
    }
  });

  it("accepts a project or workspace scope in addBannerSchema", () => {
    const okProject = addBannerSchema.safeParse({
      imageUrl: "https://picsum.photos/seed/x/1600/400",
      projectId: "p1",
    });
    const okWorkspace = addBannerSchema.safeParse({
      imageUrl: "https://picsum.photos/seed/x/1600/400",
      workspaceId: "w1",
    });
    const noScope = addBannerSchema.safeParse({ imageUrl: "https://picsum.photos/seed/x/1600/400" });
    expect(okProject.success).toBe(true);
    expect(okWorkspace.success).toBe(true);
    expect(noScope.success).toBe(true);
  });
});