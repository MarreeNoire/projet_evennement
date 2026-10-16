import type { Metadata, Viewport } from "next";
import { Syne, Plus_Jakarta_Sans } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import { PwaRouteRestoration } from "@/components/providers/pwa-route-restoration";
import { APP_NAME } from "@/lib/constants";
import { env } from "@/lib/env";

import "./globals.css";

/* =============================================================================
   Polices — nuit électrique
   * Plus Jakarta Sans : humaniste, lisible à toutes les tailles, corps de texte
   * Syne : géométrique et forte personnalité, titres qui accrochent le regard
   ========================================================================== */

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: {
    default: `${APP_NAME} · Événements et billetterie`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Recherche des événements en Côte d'Ivoire, consulte les détails et réserve ta place en ligne.",
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  icons: {
    icon: [
      { url: "/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
    title: `${APP_NAME} · Événements et billetterie`,
    description: "Consulte les événements publiés et les informations de réservation sur Event.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} · Événements et billetterie`,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3fa" },
    { media: "(prefers-color-scheme: dark)", color: "#171420" },
  ],
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${jakarta.variable} ${syne.variable}`}
    >
      <head />
      <body className="min-h-dvh antialiased">
        <a href="#contenu" className="skip-link">
          Aller au contenu principal
        </a>
        <AppProviders>
          <div id="contenu">{children}</div>
        </AppProviders>
        <PwaRouteRestoration />
      </body>
    </html>
  );
}
