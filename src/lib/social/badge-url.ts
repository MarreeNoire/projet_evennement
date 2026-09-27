import { createHmac, timingSafeEqual } from "node:crypto";

type RequestHeaders = Pick<Headers, "get">;

/** Resolves the public origin from the current request, behind Railway's proxy. */
export function getRequestOrigin(
  headers: RequestHeaders,
  fallbackUrl: string,
  isProduction: boolean,
): string {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const forwardedProtocol = headers.get("x-forwarded-proto")?.split(",", 1)[0]?.trim();

  if (!host || !/^[a-z\d.-]+(?::\d+)?$/i.test(host)) return new URL(fallbackUrl).origin;

  const protocol =
    forwardedProtocol === "https" || forwardedProtocol === "http"
      ? forwardedProtocol
      : isProduction || !/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)
        ? "https"
        : "http";

  return `${protocol}://${host}`;
}

export function createBadgeSignature(profileId: string, secret: string): string {
  return createHmac("sha256", secret).update(profileId).digest("hex");
}

export function verifyBadgeSignature(
  profileId: string,
  signature: string,
  secret: string,
): boolean {
  if (!/^[a-f\d]{64}$/i.test(signature)) return false;

  const expected = Buffer.from(createBadgeSignature(profileId, secret), "hex");
  const actual = Buffer.from(signature, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Builds the absolute, signed profile URL encoded in a networking badge. */
export function getProfileBadgeUrl(profileId: string, origin: string, secret?: string): string {
  const url = new URL(`/profil/${encodeURIComponent(profileId)}`, origin);
  if (secret) url.searchParams.set("badge", createBadgeSignature(profileId, secret));
  return url.toString();
}
