import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  experimental: {
    // Étend la durée du cache côté client du routeur Next.js.
    // Par défaut à 0 s (Next 15+) pour les pages dynamiques, ce qui entraîne
    // un rechargement complet des Server Components à chaque retour sur l'app PWA.
    // Avec 300 s, le contenu affiché reste intact si l'utilisateur revient
    // dans les 5 minutes — comportement standard des apps mobiles natives.
    staleTimes: {
      dynamic: 300, // 5 minutes
      static: 600,  // 10 minutes
    },
  },

  images: {
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
        // Le service worker ne doit jamais être mis en cache HTTP —
        // le navigateur doit toujours le télécharger pour détecter les mises à jour.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;