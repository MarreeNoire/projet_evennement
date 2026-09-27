import { describe, expect, it } from "vitest";

import { getProfileBadgeUrl } from "@/lib/social/badge-url";

describe("participant badge QR destination", () => {
  it("points to the participant profile on the configured app domain", () => {
    expect(getProfileBadgeUrl("participant-123", "https://event.example/")).toBe(
      "https://event.example/profil/participant-123",
    );
  });

  it("encodes profile IDs before putting them in the QR URL", () => {
    expect(getProfileBadgeUrl("participant/123", "http://localhost:3000")).toBe(
      "http://localhost:3000/profil/participant%2F123",
    );
  });
});
