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
    <div className="card flex items-center gap-3 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900 mb-4">
      <span className="text-2xl">🔔</span>
      <p className="flex-1 text-sm">Slå på notiser så att jag kan påminna dig även när du är i en annan flik.</p>
      <button className="btn-primary" onClick={async () => setPerm(await requestNotificationPermission())}>
        Slå på
      </button>
    </div>
  );
}
