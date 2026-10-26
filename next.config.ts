import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: "standalone",
  // Permet de lancer un build isolé sans entrer en conflit avec `next dev`.
  distDir: process.env.NEXT_BUILD_DIST_DIR || ".next",

  experimental: {
    // Étend la durée du cache côté client du routeur Next.js.
    // Par défaut à 0 s (Next 15+) pour les pages dynamiques, ce qui entraîne
    // un rechargement complet des Server Components à chaque retour arrière.
    // Avec 300 s, le contenu affiché reste intact si l'utilisateur revient
    // dans les 5 minutes — comportement attendu d'une navigation fluide.
    staleTimes: {
      dynamic: 300, // 5 minutes
      static: 600,  // 10 minutes
    },
  },

  images: {
    qualities: [48, 55, 58, 65, 68, 72, 75, 76, 80],
    remotePatterns: [
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
    // Autoriser les IPs locales/privées pour Supabase en dev (SSRF protection bypass)
    dangerouslyAllowLocalIP: true,
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // Le navigateur doit pouvoir vérifier les mises à jour du worker PWA.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
