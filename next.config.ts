import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

/* Politique de sécurité du contenu : aucun script externe, aucun cadre
   distant. `unsafe-inline` reste nécessaire pour les scripts d'amorçage
   injectés par Next.js ; `unsafe-eval` n'est autorisé qu'en développement. */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  process.env.NODE_ENV === "production"
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self' https: wss:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

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
    qualities: [48, 55, 58, 65, 68, 72, 75, 76, 80, 85, 90],
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
    // Les IP privées ne sont jamais joignables par l'optimiseur d'images (anti-SSRF).
    formats: ["image/avif", "image/webp"],
    // Supabase Storage renvoie `max-age=3600` : sans ce plancher, l'optimiseur
    // re-télécharge et re-traverse chaque image toutes les heures. Un mois
    // laisse le CDN de Vercel servir les vignettes sans aller chercher upstream.
    minimumCacheTTL: 2_678_400,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
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
