import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  getApiUser,
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
} from "@/lib/api/auth";
import { markNotificationSchema } from "@/lib/validators";

/**
 * GET /api/v1/notifications
 * Returns list of notifications for the authenticated user along with the unread count.
 */
export async function GET(req: Request | NextRequest) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const url = new URL(req.url);
    const limitParam = parseInt(url.searchParams.get("limit") || "50", 10);
    const limit = isNaN(limitParam) || limitParam <= 0 ? 50 : Math.min(limitParam, 100);

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
    ]);

    return apiSuccess({
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}

/**
 * PATCH /api/v1/notifications
 * Marks a single notification (by id) or all notifications as read.
 * Body: { id?: string, all?: boolean }
 */
export async function PATCH(req: Request | NextRequest) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return apiUnauthorized("Unauthorized");
    }

    const body = await req.json().catch(() => ({}));
    const parsed = markNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid notification payload", 400);
    }

    const { id, all } = parsed.data;

    if (all) {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
      return apiSuccess({ success: true });
    }

    if (id) {
      const notification = await prisma.notification.findUnique({
        where: { id },
      });

      if (!notification || notification.userId !== user.id) {
        return apiNotFound("Notification not found");
      }

      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      return apiSuccess({ success: true });
    }

    return apiError("Either 'id' or 'all' must be provided", 400);
  } catch (err: any) {
    return apiError(err?.message || "Internal server error", 500);
  }
}
