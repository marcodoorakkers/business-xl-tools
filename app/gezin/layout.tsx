import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NooitMeerPostKwijt — Nooit meer een brief kwijt",
  description: "Scan je post, laat het slim analyseren en sla alles veilig op in je eigen OneDrive of Dropbox.",
  icons: {
    icon: [
      { url: "/gezin-icon.svg", type: "image/svg+xml" },
      { url: "/gezin-apple-touch-icon.png", type: "image/png", sizes: "180x180" },
    ],
    apple: [
      { url: "/gezin-apple-touch-icon.png", sizes: "180x180" },
    ],
  },
};

export default function GezinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
