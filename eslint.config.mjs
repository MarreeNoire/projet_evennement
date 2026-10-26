import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/* =============================================================================
   Configuration ESLint (format « flat config »)
   ========================================================================== */

const config = defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    settings: { react: { version: "19.3" } },
    rules: {
      // Les variables non utilisées sont une erreur, sauf préfixées par _.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Les `any` explicites doivent être justifiés : ils masquent les vraies erreurs.
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      eqeqeq: ["error", "smart"],
    },
  },
  globalIgnores([
    ".next/**",
    ".open-next/**",
    ".wrangler/**",
    ".vercel/**",
    "node_modules/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    "promo-video/**",
    // Brouillons et ressources locales hors application : ils ne font pas
    // partie du build et ne doivent pas ralentir ni polluer `npm run lint`.
    ".agents/**",
    ".claude/**",
    ".opencode/**",
    "agent/**",
    "accueil/**",
    "exemple_couleur/**",
    "projet_cassé/**",
    "scripts/captures/**",
    // Scripts de diagnostic / rendu ponctuels à la racine, hors application.
    "test_*.js",
    "render_showreel.js",
  ]),
]);

export default config;
