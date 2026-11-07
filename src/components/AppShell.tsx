"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { NagEngine } from "./NagEngine";
import { Onboarding } from "./Onboarding";

type NavItem = { href: string; label: string; area?: "skola" };

const NAV: NavItem[] = [
  { href: "/app", label: "Today" },
  { href: "/app/chat", label: "Chat" },
  { href: "/app/tasks", label: "Tasks" },
  { href: "/app/mom-mode", label: "Mom Mode" },
  { href: "/app/routines", label: "Routines" },
  { href: "/app/school", label: "School", area: "skola" },
  { href: "/app/memory", label: "Memory" },
  { href: "/app/settings", label: "Settings" },
];

const MOBILE: NavItem[] = [
  { href: "/app", label: "Today" },
  { href: "/app/chat", label: "Chat" },
  { href: "/app/tasks", label: "Tasks" },
  { href: "/app/mom-mode", label: "Mom" },
  { href: "/app/more", label: "More" },
];

const MORE_ROUTES = ["/app/more", "/app/routines", "/app/school", "/app/memory", "/app/settings"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, ready } = useStore();
  const pathname = usePathname();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  if (!ready) {
    return <div className="min-h-dvh grid place-items-center text-sm text-ink-2">Loading</div>;
  }

  if (!state.settings.onboarded) return <Onboarding />;

  const nav = NAV.filter((n) => !n.area || state.settings.areas.includes(n.area));
  const isActive = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));
  const isMobileActive = (href: string) =>
    href === "/app/more" ? MORE_ROUTES.some((r) => pathname.startsWith(r)) : isActive(href);

  return (
    <div className="min-h-dvh md:flex">
      <NagEngine />
      <aside className="hidden md:flex md:w-56 md:shrink-0 md:flex-col md:sticky md:top-0 md:h-dvh border-r border-line px-6 py-7">
        <Link href="/" className="display text-[28px] tracking-normal mb-10">
          Minna.
        </Link>
        <nav className="flex flex-col gap-0.5" aria-label="App">
          {nav.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`-mx-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                  active ? "bg-ink text-white" : "text-ink-2 hover:bg-bg-2 hover:text-ink"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto text-xs leading-relaxed text-ink-2">Your data is stored on this device.</p>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-3 backdrop-blur">
          <Link href="/" className="display text-2xl tracking-normal">
            Minna.
          </Link>
          <Link href="/app/chat" className="btn-primary !py-1.5 !px-3">
            Ask Minna
          </Link>
        </header>
        <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-28 md:px-10 md:pt-12 md:pb-16">{children}</main>
      </div>

      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-line bg-bg/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
        aria-label="App"
      >
        <div className="flex">
          {MOBILE.map((n) => {
            const active = isMobileActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex-1 py-3.5 text-center text-[13px] ${active ? "text-ink font-medium" : "text-ink-2"}`}
              >
                {active && <span className="absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 bg-accent" />}
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
