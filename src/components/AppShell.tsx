"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { NagEngine } from "./NagEngine";
import { Onboarding } from "./Onboarding";

const NAV = [
  { href: "/", label: "Idag", icon: "☀️" },
  { href: "/paminnelser", label: "Påminnelser", icon: "🔔" },
  { href: "/rutiner", label: "Rutiner", icon: "📋" },
  { href: "/schema", label: "Skola", icon: "🎒", area: "skola" as const },
  { href: "/installningar", label: "Inställningar", icon: "⚙️" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, ready } = useStore();
  const pathname = usePathname();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  if (!ready) {
    return <div className="min-h-dvh grid place-items-center text-zinc-400">Laddar…</div>;
  }

  if (!state.settings.onboarded) return <Onboarding />;

  const nav = NAV.filter((n) => !n.area || state.settings.areas.includes(n.area));

  return (
    <div className="min-h-dvh md:flex">
      <NagEngine />
      <aside className="hidden md:flex md:w-56 md:flex-col md:gap-1 md:p-4 md:sticky md:top-0 md:h-dvh border-r border-zinc-200 dark:border-zinc-800">
        <Link href="/" className="flex items-center gap-2 px-3 py-2 mb-4">
          <span className="text-2xl">🧠</span>
          <span className="text-lg font-bold tracking-tight">Minna</span>
        </Link>
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
              pathname === n.href
                ? "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
            }`}
          >
            <span>{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </aside>

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6 pb-28 md:pb-10">{children}</main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] ${
                pathname === n.href ? "text-violet-600 dark:text-violet-400 font-semibold" : "text-zinc-500"
              }`}
            >
              <span className="text-lg leading-none">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
