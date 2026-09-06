"use server";

import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceMember, requireProjectAccess } from "@/lib/auth/session";
import { addBannerSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Adds a banner image to a workspace or project.
 * Requires OWNER/ADMIN for workspaces, EDITOR+ for projects.
 */
export async function addBanner(input: z.infer<typeof addBannerSchema>) {
  const parsed = addBannerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { imageUrl, workspaceId, projectId } = parsed.data;
  if (!workspaceId && !projectId) {
    return { error: "A workspace or project id is required." };
  }

  if (workspaceId) {
    await requireWorkspaceMember(workspaceId, ["OWNER", "ADMIN"]);
  } else {
    await requireProjectAccess(projectId!, "EDITOR");
  }

  const last = await prisma.banner.findFirst({
    where: { OR: [{ workspaceId: workspaceId || null }, { projectId: projectId || null }] },
    orderBy: { sortOrder: "desc" },
  });

  await prisma.banner.create({
    data: { imageUrl, sortOrder: (last?.sortOrder ?? -1) + 1, workspaceId, projectId },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Removes a banner image. Same RBAC as addBanner.
 */
export async function deleteBanner(bannerId: string) {
  const banner = await prisma.banner.findUnique({ where: { id: bannerId } });
  if (!banner) return { success: true };

  if (banner.workspaceId) {
    await requireWorkspaceMember(banner.workspaceId, ["OWNER", "ADMIN"]);
  } else if (banner.projectId) {
    await requireProjectAccess(banner.projectId, "EDITOR");
  } else {
    return { error: "Banner is not attached to any workspace or project." };
  }

  await prisma.banner.delete({ where: { id: bannerId } });

  revalidatePath("/", "layout");
  return { success: true };
}