import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NooitMeerPostKwijt — Nooit meer een document kwijt",
  description: "Scan je post, laat het slim analyseren en sla alles veilig op in je eigen OneDrive, Dropbox of Google Drive.",
  applicationName: "NooitMeerPostKwijt",
  manifest: "/gezin/manifest.webmanifest",
  appleWebApp: {
    title: "NooitMeerPostKwijt",
    statusBarStyle: "default",
    capable: true,
  },
  icons: {
    icon: [
      { url: "/gezin-icon.svg", type: "image/svg+xml" },
      { url: "/gezin-apple-touch-icon.png", type: "image/png", sizes: "180x180" },
    ],
    apple: [
      { url: "/gezin-apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: "https://www.nooitmeerpostkwijt.nl",
    siteName: "NooitMeerPostKwijt",
  },
  twitter: {
    card: "summary_large_image",
    site: "@nooitmeerpostkwijt",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function GezinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
