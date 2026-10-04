import type { MetadataRoute } from "next";

import { APP_NAME } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: APP_NAME,
    short_name: APP_NAME,
    description: "Événements, billetterie et communautés.",
    lang: "fr-CI",
    // This marker lets the server distinguish a PWA launch from a normal
    // navigation to the home page.
    start_url: "/?pwa_start=1",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f7f5ef",
    theme_color: "#14252e",
    icons: [
      { src: "/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/app-icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/app-icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
