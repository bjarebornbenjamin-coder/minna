"use client";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  return Notification.requestPermission();
}

/** Shows a system notification if the user allowed it. Uses the service worker when available (required on mobile). */
export async function showSystemNotification(title: string, body: string, tag: string): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  const options: NotificationOptions = { body, tag, icon: "/icon.svg", badge: "/icon.svg" };
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, { ...options, requireInteraction: true } as NotificationOptions);
        return;
      }
    }
    new Notification(title, options);
  } catch {
    // some browsers don't allow notifications without a service worker
  }
}
