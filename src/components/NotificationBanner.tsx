"use client";

import { useEffect, useState } from "react";
import { notificationsSupported, requestNotificationPermission } from "@/lib/notify";

export function NotificationBanner() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported" | null>(null);

  useEffect(() => {
    setPerm(notificationsSupported() ? Notification.permission : "unsupported");
  }, []);

  if (perm !== "default") return null;

  return (
    <div className="mb-6 flex flex-col gap-3 border-y border-line py-4 sm:flex-row sm:items-center">
      <p className="flex-1 text-sm">
        <span className="font-medium">Turn on notifications</span>
        <span className="text-ink-2"> so Minna can remind you while you&apos;re in another tab.</span>
      </p>
      <button className="btn-primary" onClick={async () => setPerm(await requestNotificationPermission())}>
        Turn on
      </button>
    </div>
  );
}
