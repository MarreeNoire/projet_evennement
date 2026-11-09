/**
 * Normalise une destination de redirection interne.
 *
 * Refuse tout ce qui pourrait sortir du site : URL absolue, protocole-relatif
 * (`//exemple.com`), barre oblique inversée (`/\exemple.com`, normalisée en
 * `//` par les navigateurs) et caractères de contrôle.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  return value;
}
