import Image from "next/image";

export type CoreState = "idle" | "listening" | "thinking" | "executing" | "complete" | "error" | "mom";

const LABELS: Record<CoreState, string> = {
  idle: "Minna",
  listening: "Minna is listening",
  thinking: "Minna is thinking",
  executing: "Minna is working on it",
  complete: "Done",
  error: "Something went wrong",
  mom: "Minna is reminding you",
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
  className = "",
}: {
  state?: CoreState;
  size?: number | string;
  float?: boolean;
  priority?: boolean;
  shadow?: boolean;
  className?: string;
}) {
  const busy = state === "thinking" || state === "executing";
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
        <div className="relative h-full w-full overflow-hidden rounded-full">
          <Image
            src="/assets/minna-editorial/minna-core-product.png"
            alt=""
            fill
            sizes={typeof size === "number" ? `${size}px` : "(min-width: 1024px) 50vw, 90vw"}
            priority={priority}
            className="select-none object-contain"
            draggable={false}
          />
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
          {/* Mom Mode: the band shifts to amber */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-[27%] h-[29%] transition-opacity duration-700"
            style={{ background: "#e5a73a", mixBlendMode: "hue", opacity: state === "mom" ? 0.9 : 0 }}
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
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-accent"
            style={{ animation: "ring 1.2s cubic-bezier(0.16,1,0.3,1) both" }}
          />
        )}
      </div>
    </div>
  );
}
