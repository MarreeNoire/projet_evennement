import { describe, expect, it } from "vitest";

import { isDateInput, startOfDayAfter } from "@/lib/events/date-range";

describe("event discovery date filters", () => {
  it("accepts real calendar dates in the URL format", () => {
    expect(isDateInput("2028-02-29")).toBe(true);
    expect(isDateInput("2027-02-29")).toBe(false);
    expect(isDateInput("2027-13-01")).toBe(false);
    expect(isDateInput("2027-1-01")).toBe(false);
  });

  it("creates an exclusive bound after the selected inclusive end date", () => {
    expect(startOfDayAfter("2027-12-31")).toBe("2028-01-01T00:00:00.000Z");
  });
});
