"use server";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, requireAuth } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

/**
 * Fetches recent notifications for the authenticated user
 */
export async function getUserNotifications() {
  const user = await getCurrentUser();
  if (!user) return { notifications: [], unreadCount: 0 };

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return { notifications, unreadCount };
}

/**
 * Marks a specific notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const user = await requireAuth();

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== user.id) {
    return { error: "Notification not found." };
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  return { success: true };
}

/**
 * Marks all notifications as read for current user
 */
export async function markAllNotificationsAsRead() {
  const user = await requireAuth();

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  return { success: true };
}

/**
 * Helper to dispatch a notification to a specific user
 */
export async function createUserNotification(input: {
  userId: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        link: input.link || null,
      },
    });
  } catch (err) {
    console.error("[Notification] Failed to create notification:", err);
    return null;
  }
}
