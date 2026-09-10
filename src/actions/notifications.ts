"use server";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, requireAuth } from "@/lib/auth/session";
import { sendPushNotification } from "@/lib/push";
import { sendNotificationEmail } from "@/lib/email";
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
 * Central notification dispatcher. Creates the in-app record, then fans out
 * to browser push and email. All three channels fail soft so a notification
 * can never break the action that triggered it.
 */
export async function createUserNotification(input: {
  userId: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    const record = await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        link: input.link || null,
      },
    });

    // ponytail: synchronous fan-out. Swap for a job queue (e.g. DB-triggered
    // worker) if per-event latency ever matters at scale.
    await dispatchExternalChannels(input);

    return record;
  } catch (err) {
    console.error("[Notification] Failed to create notification:", err);
    return null;
  }
}

async function dispatchExternalChannels(input: {
  userId: string;
  title: string;
  message: string;
  link?: string;
}) {
  await Promise.allSettled([
    sendPushNotification({
      userId: input.userId,
      title: input.title,
      message: input.message,
      url: input.link,
    }),
    (async () => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { email: true },
      });
      if (!user?.email) return;
      await sendNotificationEmail({
        to: user.email,
        title: input.title,
        message: input.message,
        link: input.link,
      });
    })(),
  ]);
}
