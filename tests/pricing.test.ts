import { describe, expect, it } from "vitest";

import { checkQuantityBounds, checkSaleWindow, priceOrder } from "@/lib/orders/pricing";

/* Tarification : sous-total, remise, commission 5 %, bornes et fenêtres. */

describe("priceOrder", () => {
  const standard = { id: "t1", name: "Standard", price: 5000, access_level: "standard" as const };
  const vip = { id: "t2", name: "VIP", price: 15000, access_level: "vip" as const };

  it("calcule le total et la commission à 5 %", () => {
    const pricing = priceOrder([
      { ticketType: standard, quantity: 2 },
      { ticketType: vip, quantity: 1 },
    ]);
    expect(pricing.subtotal).toBe(25000);
    expect(pricing.total).toBe(25000);
    expect(pricing.commission).toBe(1250);
    expect(pricing.netForOrganizer).toBe(23750);
    expect(pricing.ticketCount).toBe(3);
  });

  it("applique la remise sans passer sous zéro", () => {
    const pricing = priceOrder([{ ticketType: standard, quantity: 1 }], { promoDiscount: 99999 });
    expect(pricing.discount).toBe(5000);
    expect(pricing.total).toBe(0);
    expect(pricing.commission).toBe(0);
  });

  it("commande gratuite : total et commission à zéro", () => {
    const free = { id: "t0", name: "Gratuit", price: 0, access_level: "standard" as const };
    const pricing = priceOrder([{ ticketType: free, quantity: 2 }]);
    expect(pricing.total).toBe(0);
    expect(pricing.commission).toBe(0);
  });
});

describe("checkQuantityBounds", () => {
  const type = { min_per_order: 1, max_per_order: 4, quantity: 100, sold_count: 90 };

  it("accepte une quantité valide", () => {
    expect(checkQuantityBounds(2, type)).toBeNull();
  });

  it("refuse sous le minimum et au-dessus du maximum", () => {
    expect(checkQuantityBounds(0, type)).toMatch(/Minimum/);
    expect(checkQuantityBounds(5, type)).toMatch(/Maximum/);
  });

  it("signale le stock restant", () => {
    expect(checkQuantityBounds(11, { ...type, max_per_order: 20 })).toMatch(/Plus que 10/);
  });
});

describe("checkSaleWindow", () => {
  it("accepte une vente en cours", () => {
    expect(checkSaleWindow({ sale_start: null, sale_end: null })).toBeNull();
  });

  it("refuse avant l'ouverture et après la fermeture", () => {
    expect(
      checkSaleWindow({ sale_start: new Date(Date.now() + 3600_000).toISOString(), sale_end: null }),
    ).toMatch(/pas encore/);
    expect(
      checkSaleWindow({ sale_start: null, sale_end: new Date(Date.now() - 3600_000).toISOString() }),
    ).toMatch(/terminée/);
  });
});
