import webpush from "web-push";
import { prisma } from "@/lib/db/prisma";

/**
 * Sends a browser push notification to every subscription the user has.
 * No-op (never throws) when VAPID keys aren't configured.
 */
export async function sendPushNotification(opts: {
  userId: string;
  title: string;
  message: string;
  url?: string | null;
}) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:noreply@workflow.app",
    publicKey,
    privateKey
  );

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: opts.userId },
  });
  if (subscriptions.length === 0) return;

  const payload = JSON.stringify({
    title: opts.title,
    message: opts.message,
    url: opts.url ?? "/dashboard",
  });

  await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );
}

/**
 * VAPID public key exposed to the browser (it's public by design).
 */
export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
}