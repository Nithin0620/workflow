"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff } from "lucide-react";
import { base64UrlToUint8Array } from "@/lib/vapid";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * Enable/disable browser push notifications for the signed-in user.
 * Hidden entirely when the browser lacks support or VAPID isn't configured.
 */
export function PushManager() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    let cancelled = false;
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        if (!cancelled) setSupported(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setEnabled(Boolean(sub)))
    );
  }, [supported]);

  if (!supported || !VAPID_PUBLIC_KEY) return null;

  const enable = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(VAPID_PUBLIC_KEY),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      setEnabled(true);
    } catch {
      window.alert(
        "Push notifications were blocked. Enable them in your browser's site permissions to try again."
      );
    }
  };

  const disable = async () => {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    setEnabled(false);
  };

  return (
    <button
      onClick={enabled ? disable : enable}
      title={
        enabled
          ? "Disable browser push notifications"
          : "Enable browser push notifications"
      }
      className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
        enabled
          ? "border-emerald-800 bg-emerald-950/40 text-emerald-400 hover:border-emerald-700 hover:text-emerald-300"
          : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white"
      }`}
    >
      {enabled ? <BellRing className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
    </button>
  );
}