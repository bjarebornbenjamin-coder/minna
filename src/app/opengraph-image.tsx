import { ImageResponse } from "next/og";

export const alt = "Minna. Your life. More organized. Less overwhelming.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f7fafd",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 150, fontWeight: 800, letterSpacing: -4, color: "#0e2233", lineHeight: 1 }}>
            MINNA<span style={{ color: "#e34234" }}>.</span>
          </div>
          <div style={{ marginTop: 28, fontSize: 40, color: "#5b6e80" }}>Your life. More organized. Less overwhelming.</div>
        </div>
        <svg width="300" height="300" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#0e2233" strokeWidth="2" />
          <line x1="12" y1="50" x2="88" y2="50" stroke="#7cc6ee" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
