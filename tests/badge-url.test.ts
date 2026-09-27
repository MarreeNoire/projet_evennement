import { describe, expect, it } from "vitest";

import {
  createBadgeSignature,
  getProfileBadgeUrl,
  getRequestOrigin,
  verifyBadgeSignature,
} from "@/lib/social/badge-url";

describe("participant badge QR destination", () => {
  it("points to the participant profile on the configured app domain", () => {
    expect(getProfileBadgeUrl("participant-123", "https://event.example/", "test-secret")).toBe(
      `https://event.example/profil/participant-123?badge=${createBadgeSignature("participant-123", "test-secret")}`,
    );
  });

  it("encodes profile IDs before putting them in the QR URL", () => {
    expect(getProfileBadgeUrl("participant/123", "http://localhost:3000", "test-secret")).toContain(
      "http://localhost:3000/profil/participant%2F123?badge=",
    );
  });

  it("uses the public forwarded host when the configured URL is localhost", () => {
    const headers = new Headers({
      host: "internal-service.railway.internal",
      "x-forwarded-host": "projetevennement-production.up.railway.app",
      "x-forwarded-proto": "https",
    });

    const origin = getRequestOrigin(headers, "http://localhost:3000", true);
    expect(origin).toBe("https://projetevennement-production.up.railway.app");
    expect(getProfileBadgeUrl("participant-123", origin)).toBe(
      "https://projetevennement-production.up.railway.app/profil/participant-123",
    );
  });

  it("keeps local QR links on localhost during development", () => {
    const origin = getRequestOrigin(
      new Headers({ host: "localhost:3000" }),
      "http://localhost:3000",
      false,
    );
    expect(origin).toBe("http://localhost:3000");
  });

  it("validates signed badge links and rejects changes to the profile ID", () => {
    const signature = createBadgeSignature("participant-123", "test-secret");
    expect(verifyBadgeSignature("participant-123", signature, "test-secret")).toBe(true);
    expect(verifyBadgeSignature("participant-456", signature, "test-secret")).toBe(false);
    expect(verifyBadgeSignature("participant-123", "invalid", "test-secret")).toBe(false);
  });
});
