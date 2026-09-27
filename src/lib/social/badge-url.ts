/** Builds the absolute profile URL encoded in a participant's networking badge. */
export function getProfileBadgeUrl(profileId: string, appUrl: string): string {
  return new URL(`/profil/${encodeURIComponent(profileId)}`, appUrl).toString();
}
