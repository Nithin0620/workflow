// One-off backfill: attach default banner sets to existing workspaces/projects
// that have none. Run: node --env-file=.env scripts/backfill-banners.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function defaultBanners() {
  const count = 3 + Math.floor(Math.random() * 2);
  return Array.from({ length: count }, (_, i) => ({
    imageUrl: `https://picsum.photos/seed/b${Math.random().toString(36).slice(2, 9)}-${i}/1600/400`,
    sortOrder: i,
  }));
}

const [workspaces, projects] = await Promise.all([
  prisma.workspace.findMany({ select: { id: true, _count: { select: { banners: true } } } }),
  prisma.project.findMany({ select: { id: true, _count: { select: { banners: true } } } }),
]);

let added = 0;
for (const ws of workspaces.filter((w) => w._count.banners === 0)) {
  await prisma.banner.createMany({ data: defaultBanners().map((b) => ({ ...b, workspaceId: ws.id })) });
  added++;
}
for (const p of projects.filter((p) => p._count.banners === 0)) {
  await prisma.banner.createMany({ data: defaultBanners().map((b) => ({ ...b, projectId: p.id })) });
  added++;
}

console.log(`Done. Backfilled ${added} workspaces/projects with default banners.`);
await prisma.$disconnect();