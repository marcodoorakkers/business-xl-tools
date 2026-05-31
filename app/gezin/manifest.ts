import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NooitMeerPostKwijt",
    short_name: "NooitMeerPostKwijt",
    description: "Scan je post en sla hem veilig op.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f59e0b",
    icons: [
      {
        src: "/gezin-apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/gezin-apple-touch-icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/gezin-apple-touch-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // @ts-expect-error share_target not yet in Next.js MetadataRoute.Manifest types
    share_target: {
      action: "/api/gezin/share-target",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        files: [{ name: "files", accept: ["image/*", "application/pdf"] }],
      },
    },
  };
}
