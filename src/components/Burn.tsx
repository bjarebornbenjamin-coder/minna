"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

const DURATION = 1100;
const SLOPE = 30;
const RAMP =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' preserveAspectRatio='none'><defs><linearGradient id='g'><stop offset='0' stop-color='#000'/><stop offset='1' stop-color='#fff'/></linearGradient></defs><rect width='100' height='100' fill='url(#g)'/></svg>",
  );

/**
 * Burns an element away like paper: the fire starts on the left and eats its way across,
 * with a thin flame edge and a charred rim just behind it.
 */
export function useBurn() {
  const rawId = useId();
  const id = `burn-${rawId.replace(/[^a-zA-Z0-9-]/g, "")}`;
  const [progress, setProgress] = useState<number | null>(null);
  const [size, setSize] = useState({ w: 600, h: 60 });
  const ref = useRef<HTMLElement | null>(null);
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const burn = useCallback((onDone: () => void) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDone();
      return;
    }
    const r = ref.current?.getBoundingClientRect();
    if (r) setSize({ w: Math.max(1, r.width), h: Math.max(1, r.height) });
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      setProgress(t * t * (3 - 2 * t));
      if (t < 1) frame.current = requestAnimationFrame(tick);
      else {
        onDone();
        setProgress(null);
      }
    };
    frame.current = requestAnimationFrame(tick);
  }, []);

  const burning = progress !== null;
  // Threshold sweeps through the "fuel" value: low values (left side) burn first
  const t = 0.08 + (progress ?? 0) * 0.9;
  const at = (offset: number) => -SLOPE * (t + offset);

  const filter = burning ? (
    <svg width="0" height="0" aria-hidden style={{ position: "absolute" }}>
      <filter id={id} x="-4%" y="-40%" width="108%" height="180%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.045 0.11" numOctaves="3" seed="11" result="noise" />
        <feImage href={RAMP} x="0" y="0" width={size.w} height={size.h} preserveAspectRatio="none" result="ramp" />
        <feComposite in="noise" in2="ramp" operator="arithmetic" k1="0" k2="0.55" k3="0.45" k4="0" result="mix" />
        <feColorMatrix in="mix" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="fuel" />

        <feComponentTransfer in="fuel" result="keepInner">
          <feFuncA type="linear" slope={SLOPE} intercept={at(0.02)} />
        </feComponentTransfer>
        <feComponentTransfer in="fuel" result="keep">
          <feFuncA type="linear" slope={SLOPE} intercept={at(0)} />
        </feComponentTransfer>
        <feComponentTransfer in="fuel" result="flameZone">
          <feFuncA type="linear" slope={SLOPE} intercept={at(-0.028)} />
        </feComponentTransfer>

        <feComposite in="SourceGraphic" in2="keepInner" operator="in" result="paper" />

        <feFlood floodColor="#2a1a12" floodOpacity="0.85" result="charColor" />
        <feComposite in="charColor" in2="keep" operator="in" result="charKeep" />
        <feComposite in="charKeep" in2="keepInner" operator="out" result="charLoose" />
        <feComposite in="charLoose" in2="SourceAlpha" operator="in" result="char" />

        <feFlood floodColor="#ff8a1f" result="flameColor" />
        <feComposite in="flameColor" in2="flameZone" operator="in" result="flameAll" />
        <feComposite in="flameAll" in2="keep" operator="out" result="flameLoose" />
        <feComposite in="flameLoose" in2="SourceAlpha" operator="in" result="flame" />
        <feGaussianBlur in="flame" stdDeviation="3" result="flameGlow" />
        <feFlood floodColor="#e34234" result="redColor" />
        <feComposite in="redColor" in2="flameGlow" operator="in" result="redGlow" />

        <feMerge>
          <feMergeNode in="redGlow" />
          <feMergeNode in="paper" />
          <feMergeNode in="char" />
          <feMergeNode in="flameGlow" />
          <feMergeNode in="flame" />
        </feMerge>
      </filter>
    </svg>
  ) : null;

  const sparks = burning ? (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
      {[6, 18, 31, 44, 58, 71, 84, 95].map((x, i) => (
        <span
          key={x}
          className="spark"
          style={{
            left: `${x}%`,
            animationDelay: `${i * 105}ms`,
            ["--drift" as string]: `${(i % 2 ? 1 : -1) * (5 + (i % 3) * 4)}px`,
          }}
        />
      ))}
    </span>
  ) : null;

  return {
    ref,
    burning,
    burn,
    burnStyle: burning ? ({ filter: `url(#${id})`, background: "var(--surface)" } as React.CSSProperties) : undefined,
    burnLayer: (
      <>
        {filter}
        {sparks}
      </>
    ),
  };
}
