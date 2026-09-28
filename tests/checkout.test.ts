import { describe, expect, it } from "vitest";

import { checkoutItemsFromQuantities, checkoutSchema } from "@/lib/validation/checkout";

describe("checkoutItemsFromQuantities", () => {
  it("builds schema-valid checkout items from the selected ticket quantities", () => {
    const items = checkoutItemsFromQuantities(
      [
        { id: "22222222-2222-4222-8222-222222222222" },
        { id: "33333333-3333-4333-8333-333333333333" },
      ],
      {
        "22222222-2222-4222-8222-222222222222": 2,
        "33333333-3333-4333-8333-333333333333": 0,
      },
    );

    expect(items).toEqual([{ ticketTypeId: "22222222-2222-4222-8222-222222222222", quantity: 2 }]);
    expect(
      checkoutSchema.safeParse({
        eventId: "11111111-1111-4111-8111-111111111111",
        items,
        buyerName: "Koffi Atta",
        buyerEmail: "koffi@example.ci",
        buyerPhone: "",
        promoCode: "",
      }).success,
    ).toBe(true);
  });

  it("omits ticket types with no selected quantity", () => {
    expect(checkoutItemsFromQuantities([{ id: "22222222-2222-4222-8222-222222222222" }], {})).toEqual([]);
  });
});
