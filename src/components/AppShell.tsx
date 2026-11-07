"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { NagEngine } from "./NagEngine";
import { Onboarding } from "./Onboarding";

const NAV = [
  { href: "/", label: "Today", icon: "◐" },
  { href: "/chat", label: "Chat", icon: "✦" },
  { href: "/tasks", label: "Tasks", icon: "◇" },
  { href: "/routines", label: "Routines", icon: "☰" },
  { href: "/school", label: "School", icon: "✎", area: "skola" as const },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

/** Background light and the per-card spotlight follow the cursor */
function usePointerLight() {
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--cx", `${e.clientX}px`);
        document.documentElement.style.setProperty("--cy", `${e.clientY}px`);
        const card = (e.target as Element | null)?.closest?.(".card") as HTMLElement | null;
        if (card) {
          const r = card.getBoundingClientRect();
          card.style.setProperty("--mx", `${e.clientX - r.left}px`);
          card.style.setProperty("--my", `${e.clientY - r.top}px`);
        }
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
}

function Ambient() {
  return (
    <div className="ambient" aria-hidden>
      <div className="ambient-grid" />
      <div className="ambient-light" />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, ready } = useStore();
  const pathname = usePathname();
  usePointerLight();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  if (!ready) {
    return (
      <>
        <Ambient />
        <div className="min-h-dvh grid place-items-center text-zinc-500">Loading…</div>
      </>
    );
  }

  if (!state.settings.onboarded) {
    return (
      <>
        <Ambient />
        <Onboarding />
      </>
    );
  }

  const nav = NAV.filter((n) => !n.area || state.settings.areas.includes(n.area));
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="min-h-dvh md:flex">
      <Ambient />
      <NagEngine />
      <aside className="hidden md:flex md:w-60 md:flex-col md:gap-1 md:p-4 md:sticky md:top-0 md:h-dvh border-r border-white/[0.06] bg-black/20 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2.5 px-3 py-2 mb-6">
          <span className="relative h-7 w-7 rounded-full bg-[radial-gradient(circle,#ede9fe_0%,#7c3aed_35%,#1e3a8a_70%,transparent_72%)] shadow-[0_0_20px_rgba(124,58,237,0.8)] ring-1 ring-cyan-300/40" />
          <span className="font-display text-xl font-semibold tracking-tight">Minna</span>
        </Link>
        {nav.map((n) => {
          const active = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-white/[0.07] text-white" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-violet-400 to-cyan-300 shadow-[0_0_10px_rgba(139,92,246,0.9)]" />
              )}
              <span className={`w-5 text-center ${active ? "text-cyan-300" : "text-zinc-500 group-hover:text-zinc-300"}`}>{n.icon}</span>
              {n.label}
            </Link>
          );
        })}
        <div className="mt-auto px-3 text-[11px] text-zinc-600">Your data stays on this device.</div>
      </aside>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 pt-6 pb-32 md:pb-12 md:pt-10">{children}</main>

      <nav className="md:hidden fixed bottom-3 inset-x-3 z-40 rounded-3xl border border-white/10 bg-[#0b0d1a]/80 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.9)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {nav.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] transition ${
                  active ? "text-white" : "text-zinc-500"
                }`}
              >
                <span
                  className={`text-base leading-none ${active ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : ""}`}
                >
                  {n.icon}
                </span>
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
