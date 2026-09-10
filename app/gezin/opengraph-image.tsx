import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "NooitMeerPostKwijt — Nooit meer een document kwijt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f59e0b",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "40px" }}>
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              width: "72px",
              height: "72px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px",
            }}
          >
            ✉️
          </div>
          <span style={{ color: "white", fontSize: "38px", fontWeight: "800", letterSpacing: "-1px" }}>
            NooitMeerPostKwijt
          </span>
        </div>

        <div
          style={{
            color: "white",
            fontSize: "68px",
            fontWeight: "900",
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: "-2px",
            marginBottom: "28px",
          }}
        >
          Nooit meer een<br />document kwijt.
        </div>

        <div
          style={{
            color: "rgba(255,255,255,0.88)",
            fontSize: "28px",
            textAlign: "center",
            maxWidth: "840px",
            lineHeight: 1.45,
            marginBottom: "48px",
          }}
        >
          Scan je post — AI herkent wat het is en wat je moet doen.<br />
          Altijd terugvindbaar in je eigen cloud.
        </div>

        <div
          style={{
            background: "white",
            color: "#d97706",
            borderRadius: "20px",
            padding: "18px 48px",
            fontSize: "26px",
            fontWeight: "800",
          }}
        >
          Gratis beginnen — 10 scans cadeau
        </div>
      </div>
    ),
    { ...size },
  );
}
