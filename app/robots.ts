import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dossier",
          "/account",
          "/acties",
          "/mijn-gegevens",
          "/admin",
          "/api/",
          "/auth/",
        ],
      },
    ],
    sitemap: [
      "https://www.nooitmeerpostkwijt.nl/sitemap.xml",
      "https://www.timesavertools.nl/sitemap.xml",
    ],
  };
}
