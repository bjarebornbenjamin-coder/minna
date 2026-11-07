"use client";

import { useEffect, useRef } from "react";
import { Core } from "../Core";

/** The hero Core drifts slightly as the page scrolls. */
export function HeroCore({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 900);
        if (ref.current) ref.current.style.transform = `translate3d(0, ${y * 0.18}px, 0) rotate(${y * 0.012}deg)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      <Core size="100%" priority shadow={false} />
    </div>
  );
}
