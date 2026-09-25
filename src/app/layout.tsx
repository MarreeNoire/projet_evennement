import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import { APP_NAME } from "@/lib/constants";
import { env } from "@/lib/env";

import "./globals.css";

/* =============================================================================
   Police — une seule famille sans-serif, chargée par next/font (auto-hébergée,
   sans requête vers Google au runtime, donc sans décalage de rendu ni fuite
   de données utilisateur).

   * Inter : la sans-serif de référence des interfaces sociales, très lisible
     aux petites tailles et neutre à souhait.
   ========================================================================== */

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: {
    default: `${APP_NAME} — Découvrir, participer, rencontrer`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Découvre des événements, réserve ta place et rejoins la communauté de chaque événement avant, pendant et après.",
  applicationName: APP_NAME,
  keywords: [
    "événements",
    "billetterie",
    "Abidjan",
    "Côte d'Ivoire",
    "mobile money",
    "networking",
    "communauté",
  ],
  openGraph: {
    type: "website",
    locale: "fr_CI",
    siteName: APP_NAME,
    title: `${APP_NAME} — Découvrir, participer, rencontrer`,
    description:
      "Chaque événement devient une communauté : billetterie, salon d'échange et networking réunis.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Découvrir, participer, rencontrer`,
  },
  robots: {
    index: true,
    follow: true,
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Le zoom reste autorisé : le bloquer nuit à l'accessibilité.
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0f2f5" },
    { media: "(prefers-color-scheme: dark)", color: "#18191a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning : next-themes écrit la classe de thème sur <html>
    // avant l'hydratation, ce qui est attendu et non une erreur.
    <html
      lang="fr"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={inter.variable}
    >
      <head>
      </head>
      <body className="min-h-dvh antialiased">
        <a href="#contenu" className="skip-link">
          Aller au contenu principal
        </a>
        <AppProviders>
          <div id="contenu">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}