import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #2563EB 0%, #6366F1 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg viewBox="0 0 32 32" width="120" height="120" fill="none">
          <path
            d="M18.5 4L9 18h7.5L13.5 28L23 14h-7.5L18.5 4Z"
            fill="white"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
