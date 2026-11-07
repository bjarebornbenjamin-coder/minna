"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { CoreState } from "./MinnaCore";

export type { CoreState };

const MinnaCoreCanvas = dynamic(() => import("./MinnaCore"), { ssr: false, loading: () => null });

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

const LABELS: Record<CoreState, string> = {
  idle: "Minna is ready",
  listening: "Minna is listening",
  thinking: "Minna is thinking",
  executing: "Minna is working on it",
  complete: "Done",
  error: "Something went wrong",
  mom: "Minna is reminding you",
};

/**
 * The Minna Core: a real-time 3D object that responds to the cursor and the assistant's state.
 * Falls back to the still image when WebGL is missing or the user prefers reduced motion.
 */
export function CoreView({ state = "idle", size = 220, className = "" }: { state?: CoreState; size?: number; className?: string }) {
  const [mode, setMode] = useState<"pending" | "3d" | "image">("pending");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disabled = false;
    try {
      disabled = localStorage.getItem("minna:3d") === "off";
    } catch {
      // storage blocked
    }
    setMode(!reduced && !disabled && webglAvailable() ? "3d" : "image");
  }, []);

  const stateGlow =
    state === "mom" ? "rgba(251,191,36,0.35)" : state === "error" ? "rgba(251,113,133,0.3)" : "rgba(139,92,246,0.35)";

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={LABELS[state]}
    >
      <div
        className="absolute inset-[22%] rounded-full blur-3xl opacity-70 transition-colors duration-700"
        style={{ background: stateGlow }}
        aria-hidden
      />
      {mode === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/brand/core-idle.webp"
          alt=""
          className={`relative h-full w-full object-contain ${state === "thinking" || state === "executing" ? "animate-pulse" : ""}`}
          style={{ mixBlendMode: "screen" }}
        />
      )}
      {mode === "3d" && (
        <div className="absolute inset-0">
          <MinnaCoreCanvas state={state} />
        </div>
      )}
    </div>
  );
}
