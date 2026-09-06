/**
 * Generates a default 3-4 image banner set (grayscale / pure black & white aesthetic
 * hosted picsum.photos URLs, zero setup). Seeded per-image so the same banner row
 * renders the same image.
 */
export function defaultBannerUrls(): { imageUrl: string; sortOrder: number }[] {
  const count = 3 + Math.floor(Math.random() * 2); // 3 or 4 images
  return Array.from({ length: count }, (_, i) => ({
    imageUrl: `https://picsum.photos/seed/bw-${Math.random().toString(36).slice(2, 9)}-${i}/1600/400?grayscale`,
    sortOrder: i,
  }));
}

export const bannerInclude = {
  banners: {
    select: { id: true, imageUrl: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] as const,
  },
} as const;