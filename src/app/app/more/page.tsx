"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";

export default function MorePage() {
  const { state } = useStore();
  const links = [
    { href: "/app/routines", label: "Routines", desc: "Checklists that come back on set days" },
    ...(state.settings.areas.includes("skola") ? [{ href: "/app/school", label: "School", desc: "Schedule and packing lists" }] : []),
    { href: "/app/memory", label: "Memory", desc: state.settings.memoryEnabled ? `On · ${state.memories.length} saved` : "Off" },
    { href: "/app/settings", label: "Settings", desc: "Areas, tone, notifications, data" },
    { href: "/", label: "About Minna", desc: "The Minna website" },
  ];
  return (
    <div>
      <p className="eyebrow">More</p>
      <ul className="mt-6 border-t border-line">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="group flex items-baseline justify-between gap-4 border-b border-line py-5">
              <span>
                <span className="display block text-4xl group-hover:text-accent-ink">{l.label}</span>
                <span className="mt-1 block text-sm text-ink-2">{l.desc}</span>
              </span>
              <span aria-hidden className="text-ink-2 transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
