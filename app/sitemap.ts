import { MetadataRoute } from "next";

const NMMPK = "https://www.nooitmeerpostkwijt.nl";
const TST = "https://www.timesavertools.nl";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    // NooitMeerPostKwijt
    { url: NMMPK,                         lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${NMMPK}/aanmelden`,          lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${NMMPK}/inloggen`,           lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${NMMPK}/voorwaarden`,        lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${NMMPK}/privacy`,            lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${NMMPK}/veiligheid`,         lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    // TimeSaverTools
    { url: TST,                           lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${TST}/aanmelden`,            lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${TST}/inloggen`,             lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
