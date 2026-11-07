export type MarkState = "idle" | "listening" | "thinking" | "executing" | "complete" | "error" | "focus";

const LABELS: Record<MarkState, string> = {
  idle: "Minna",
  listening: "Minna is listening",
  thinking: "Minna is thinking",
  executing: "Minna is working on it",
  complete: "Done",
  error: "Something went wrong",
  focus: "Focus Mode is on",
};

/**
 * The Minna mark ("Horizon"): a thin circle with one sky-blue line through it.
 * States are shown with small, purposeful motion on the line.
 */
export function Mark({
  state = "idle",
  size = 40,
  draw = false,
  className = "",
  decorative = false,
  line,
  ringWidth,
  approxPx = 600,
}: {
  state?: MarkState;
  size?: number | string;
  /** Draw the circle and line in on mount */
  draw?: boolean;
  className?: string;
  decorative?: boolean;
  /** Thickness of the horizon line, in viewBox units */
  line?: number;
  /** Ring stroke in screen pixels */
  ringWidth?: number;
  /** Rendered width estimate when size is a CSS length, used to keep the ring thin */
  approxPx?: number;
}) {
  const px = typeof size === "number" ? size : approxPx;
  const ringPx = ringWidth ?? (px >= 160 ? 1.5 : px >= 64 ? 2 : 2.5);
  // Stroke in viewBox units (not non-scaling-stroke, which breaks the draw-in dash animation)
  const ring = (ringPx * 100) / px;
  return (
    <svg
      viewBox="0 0 100 100"
      width={typeof size === "number" ? size : undefined}
      style={typeof size === "string" ? { width: size, height: "auto" } : undefined}
      className={`mark ${draw ? "mark-draw" : ""} ${className}`}
      data-state={state}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : LABELS[state]}
      overflow="visible"
    >
      <circle
        className="mark-ring"
        cx="50"
        cy="50"
        r="38"
        fill="none"
        stroke="currentColor"
        strokeWidth={ring}
        pathLength={100}
      />
      <line className="mark-line" x1="12" y1="50" x2="88" y2="50" strokeWidth={line ?? (px < 40 ? 10 : px < 90 ? 7 : 5)} strokeLinecap="round" />
    </svg>
  );
}
