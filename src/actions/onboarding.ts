"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";

/**
 * Whether the current user has already seen (or skipped) a given tour.
 */
export async function getTourState(tourId: string) {
  const user = await requireAuth();
  const row = await prisma.tourProgress.findUnique({
    where: { userId_tourId: { userId: user.id, tourId } },
    select: { id: true },
  });
  return { success: true, seen: Boolean(row) };
}

/**
 * Marks a tour as seen for the current user (Finish, Skip, or X).
 */
export async function markTourSeen(tourId: string) {
  const user = await requireAuth();
  await prisma.tourProgress.upsert({
    where: { userId_tourId: { userId: user.id, tourId } },
    update: {},
    create: { userId: user.id, tourId },
  });
  return { success: true };
}