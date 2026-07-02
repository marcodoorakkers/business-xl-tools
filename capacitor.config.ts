import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "nl.nooitmeerpostkwijt.app",
  appName: "NooitMeerPostKwijt",
  webDir: "capacitor-web",
  server: {
    // Live URL — app laadt de productiewebsite in de native WebView.
    // Verwijder deze server-sectie en run `npx cap sync` als je ooit
    // een volledig bundled (offline) build wilt maken.
    url: "https://nooitmeerpostkwijt.nl/dossier",
    cleartext: false,
    allowNavigation: ["nooitmeerpostkwijt.nl", "*.nooitmeerpostkwijt.nl"],
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#ffffff",
    preferredContentMode: "mobile",
  },
};

export default config;
