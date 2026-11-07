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
    <div className="card flex items-center gap-3 !border-violet-400/25 !bg-violet-500/[0.08] mb-4">
      <span className="text-2xl">🔔</span>
      <p className="flex-1 text-sm">Turn on notifications so I can remind you even when you&apos;re in another tab.</p>
      <button className="btn-primary" onClick={async () => setPerm(await requestNotificationPermission())}>
        Turn on
      </button>
    </div>
  );
}
