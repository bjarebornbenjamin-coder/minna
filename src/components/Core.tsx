"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export type CoreState = "idle" | "listening" | "thinking" | "executing" | "complete" | "error" | "focus";

const LABELS: Record<CoreState, string> = {
  idle: "Minna",
  listening: "Minna is listening",
  thinking: "Minna is thinking",
  executing: "Minna is working on it",
  complete: "Done",
  error: "Something went wrong",
  focus: "Focus Mode is on",
};

/**
 * The Minna Core, built on the product image. States are shown with restrained light on the
 * optical band rather than new shapes, so the object stays recognisable.
 */
export function Core({
  state = "idle",
  size = 200,
  float = true,
  priority = false,
  shadow = true,
  tilt = true,
  className = "",
}: {
  state?: CoreState;
  size?: number | string;
  float?: boolean;
  priority?: boolean;
  shadow?: boolean;
  /** Lean toward the cursor in 3D */
  tilt?: boolean;
  className?: string;
}) {
  const busy = state === "thinking" || state === "executing";
  const tiltRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tilt) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = tiltRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const reach = Math.max(420, r.width * 1.4);
        const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / reach));
        const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / reach));
        el.style.transform = `perspective(900px) rotateY(${dx * 16}deg) rotateX(${-dy * 16}deg)`;
        if (shineRef.current) {
          shineRef.current.style.background = `radial-gradient(circle at ${50 + dx * 28}% ${32 + dy * 28}%, rgba(255,255,255,0.55), rgba(255,255,255,0) 38%)`;
        }
      });
    };
    const reset = () => {
      if (tiltRef.current) tiltRef.current.style.transform = "";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", reset);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", reset);
    };
  }, [tilt]);
  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, aspectRatio: "1 / 1" }}
      role="img"
      aria-label={LABELS[state]}
      aria-live="polite"
    >
      {shadow && (
        <div
          aria-hidden
          className="absolute left-[14%] right-[14%] -bottom-[6%] h-[9%] rounded-[50%] bg-ink/25 blur-xl"
          style={float ? { animation: "breathe 6s ease-in-out infinite" } : undefined}
        />
      )}
      <div className="absolute inset-0" style={float ? { animation: "float 6s ease-in-out infinite" } : undefined}>
        <div ref={tiltRef} className="relative h-full w-full overflow-hidden rounded-full transition-transform duration-500 ease-out will-change-transform">
          <Image
            src="/assets/minna-editorial/minna-core-product.png"
            alt=""
            fill
            sizes={typeof size === "number" ? `${size}px` : "(min-width: 1024px) 50vw, 90vw"}
            priority={priority}
            className="select-none object-contain"
            draggable={false}
          />
          {/* Specular highlight that follows the cursor */}
          <div ref={shineRef} aria-hidden className="absolute inset-0 rounded-full transition-[background] duration-300" style={{ mixBlendMode: "soft-light" }} />
          {/* Light inside the optical band */}
          <div
            aria-hidden
            className="absolute left-[4%] right-[4%] top-[28%] h-[27%] transition-opacity duration-700"
            style={{
              background: "radial-gradient(ellipse 40% 60% at 50% 55%, rgba(140,230,255,0.9), rgba(60,140,255,0.25) 55%, transparent 75%)",
              mixBlendMode: "screen",
              opacity: busy ? 1 : state === "listening" ? 0.6 : 0,
              animation: busy ? "breathe 1.6s ease-in-out infinite" : state === "listening" ? "breathe 2.4s ease-in-out infinite" : undefined,
            }}
          />
          {/* Focus Mode: the band shifts to vermilion */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-[27%] h-[29%] transition-opacity duration-700"
            style={{ background: "#e34234", mixBlendMode: "hue", opacity: state === "focus" ? 0.85 : 0 }}
          />
          {/* Error: a muted red tint on the band */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-[27%] h-[29%] transition-opacity duration-700"
            style={{ background: "#d9534f", mixBlendMode: "hue", opacity: state === "error" ? 0.75 : 0 }}
          />
        </div>
        {state === "complete" && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-accent-ink"
            style={{ animation: "ring 1.2s cubic-bezier(0.16,1,0.3,1) both" }}
          />
        )}
      </div>
    </div>
  );
}
