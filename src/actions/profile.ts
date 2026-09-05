"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

/**
 * Updates the current user's profile name
 */
export async function updateProfileName(name: string) {
  const user = await requireAuth();

  const parsed = updateProfileSchema.safeParse({ name });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name.trim() },
  });

  return { success: true, user: updated };
}

/**
 * Changes user account password
 */
export async function changeUserPassword(input: z.infer<typeof changePasswordSchema>) {
  const user = await requireAuth();

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser || !dbUser.passwordHash) {
    return { error: "This account was created via OAuth (Google/GitHub) and does not use a password." };
  }

  const isMatch = await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash);
  if (!isMatch) {
    return { error: "Incorrect current password." };
  }

  const newHash = await hashPassword(parsed.data.newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  return { success: true };
}
