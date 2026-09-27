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

/** Builds the absolute profile URL encoded in a participant's networking badge. */
export function getProfileBadgeUrl(profileId: string, origin: string): string {
  return new URL(`/profil/${encodeURIComponent(profileId)}`, origin).toString();
}
