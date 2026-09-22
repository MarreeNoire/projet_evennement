import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

/* =============================================================================
   Configuration des tests unitaires
   --------------------------------------------------------------------------
   Environnement `node` par défaut (les modules testés sont côté serveur :
   paiement, formatage, validation). Les rares tests de composants déclarent
   `// @vitest-environment jsdom` en tête de fichier.
   ========================================================================== */

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx", "src/**/*.test.ts"],
    exclude: ["node_modules", ".next", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**/*.ts"],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});