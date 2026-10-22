import type { MetadataRoute } from "next";

import { APP_NAME } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: APP_NAME,
    short_name: APP_NAME,
    description: "Événements, salons et billetterie — Côte d'Ivoire.",
    lang: "fr-CI",
    dir: "ltr",
    // Toujours démarrer sur une route stable : une ancienne page enregistrée
    // ne peut pas produire de 404 à la réouverture de l'app installée.
    start_url: "/",
    scope: "/",
    display: "standalone",
    // On accepte le mode standalone seul : convivial, sans barres hacks ; le
    // navigateur peut retomber sur ses modes intégrés selon la plateforme.
    display_override: ["standalone", "minimal-ui"],
    // Numérique : permettre toutes les orientations (mobile paysage inclus,
    // exigence « app native » au mobile comme à la tablette).
    orientation: "any",
    // Couleurs alignées sur les tokens (papier chaud / nuit profonde).
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
    // Captures utilisées par la fiche d'installation (narrow = mobile,
    // wide = desktop/tablette) — générées depuis l'app réelle.
    screenshots: [
      {
        src: "/manifest/screenshot-narrow.png",
        sizes: "1080x2340",
        type: "image/png",
        form_factor: "narrow",
        label: "Découvrir les événements à venir",
      },
      {
        src: "/manifest/screenshot-wide.png",
        sizes: "1440x900",
        type: "image/png",
        form_factor: "wide",
        label: "Explorer, billetterie et espace organisateur",
      },
    ],
    shortcuts: [
      {
        name: "Explorer les événements",
        short_name: "Explorer",
        description: "Catalogue complet des sorties publiées.",
        url: "/explorer",
      },
      {
        name: "Mes billets",
        short_name: "Billets",
        description: "Mes billets achetés et leur QR de check-in.",
        url: "/mes-billets",
      },
      {
        name: "Notifications",
        short_name: "Alertes",
        description: "Centre de notifications et real-time.",
        url: "/notifications",
      },
    ],
  };
}
