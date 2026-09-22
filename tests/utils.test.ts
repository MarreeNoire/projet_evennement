import {
  formatDate,
  formatDateRange,
  formatNumber,
  formatPercent,
  formatPrice,
  getInitials,
  toSlug,
  truncate,
} from "@/lib/utils";
import { describe, expect, it } from "vitest";

/* =============================================================================
   Tests — helpers de formatage
   --------------------------------------------------------------------------
   Le formatage FCFA et les dates en français touchent chaque écran : une
   régression ici serait visible partout.
   ========================================================================== */

describe("formatPrice", () => {
  it("affiche un montant en FCFA avec séparateur de milliers", () => {
    // Espace insécable étroite utilisée par Intl pour fr-FR.
    expect(formatPrice(10000)).toMatch(/^10\s?000\sFCFA$/);
    expect(formatPrice(5000)).toMatch(/^5\s?000\sFCFA$/);
  });

  it("affiche un montant nul sans décimales", () => {
    expect(formatPrice(0)).toMatch(/^0\sFCFA$/);
  });

  it("accepte null et undefined sans planter", () => {
    expect(formatPrice(null)).toMatch(/FCFA$/);
    expect(formatPrice(undefined)).toMatch(/FCFA$/);
  });
});

describe("formatNumber", () => {
  it("sépare les milliers", () => {
    expect(formatNumber(2430)).toMatch(/^2\s?430$/);
    expect(formatNumber(35200000)).toMatch(/^35\s?200\s?000$/);
  });
});

describe("formatPercent", () => {
  it("convertit un ratio en pourcentage lisible", () => {
    expect(formatPercent(0.92)).toMatch(/^92\s%$/);
    expect(formatPercent(0.5, 1)).toMatch(/^50,0\s%$/);
  });
});

describe("formatDate", () => {
  it("formate une date en français", () => {
    const formatted = formatDate("2026-11-15T19:00:00.000Z");
    expect(formatted).toContain("nov.");
    expect(formatted).toContain("2026");
  });
});

describe("formatDateRange", () => {
  it("regroupe l'horaire quand les deux dates sont le même jour", () => {
    const result = formatDateRange(
      "2026-11-15T09:00:00.000Z",
      "2026-11-15T18:00:00.000Z",
    );

    expect(result).toContain("–");
    expect(result).not.toContain("→");
  });

  it("affiche les deux dates complètes quand elles diffèrent", () => {
    const result = formatDateRange(
      "2026-11-15T09:00:00.000Z",
      "2026-11-17T18:00:00.000Z",
    );

    expect(result).toContain("→");
  });
});

describe("getInitials", () => {
  it("retourne les deux initiales", () => {
    expect(getInitials("Koffi Atta")).toBe("KA");
  });

  it("gère un nom unique et les espaces superflus", () => {
    expect(getInitials("Koffi")).toBe("K");
    expect(getInitials("  Aya   Marie   Koné  ")).toBe("AM");
  });
});

describe("truncate", () => {
  it("laisse intact un texte plus court que la limite", () => {
    expect(truncate("Court", 20)).toBe("Court");
  });

  it("coupe sur un mot et ajoute une ellipse", () => {
    const result = truncate("Un texte suffisamment long pour devoir être coupé proprement", 30);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(31);
  });
});

describe("toSlug", () => {
  it("supprime accents, espaces et majuscules", () => {
    expect(toSlug("Abidjan Tech Conférence")).toBe("abidjan-tech-conference");
  });

  it("nettoie les séparateurs en début et fin", () => {
    expect(toSlug("  --Événement--  ")).toBe("evenement");
  });

  it("tronque les slugs très longs", () => {
    expect(toSlug("a".repeat(200)).length).toBeLessThanOrEqual(80);
  });
});