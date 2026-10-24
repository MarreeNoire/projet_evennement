import type { Metadata, Viewport } from "next";
import { Anton, Bricolage_Grotesque } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import { ServiceWorkerRegistration } from "@/components/providers/service-worker-registration";
import { PWAInstallPrompt, PWAInstallBanner } from "@/components/pwa/pwa-install-prompt";
import { APP_NAME } from "@/lib/constants";
import { env } from "@/lib/env";

import "./globals.css";

/* Polices de la maquette `accueil/`, auto-hébergées : aucun appel réseau au
   chargement et aucun décalage de mise en page. */
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-anton",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
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
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // « App native » : le contenu va sous l'encoche et la barre home
  // (env(safe-area-inset-*) exploitées par la tabbar et les sheets).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f2ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`light ${anton.variable} ${bricolage.variable}`}
    >
      <head />
      <body className="min-h-dvh antialiased">
        <a href="#contenu" className="skip-link">
          Aller au contenu principal
        </a>
        <AppProviders>
          <div id="contenu">{children}</div>
        </AppProviders>
        <ServiceWorkerRegistration />
        <PWAInstallPrompt />
        <PWAInstallBanner />
      </body>
    </html>
  );
}
