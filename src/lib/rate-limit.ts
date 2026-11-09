/* =============================================================================
   Limitation de débit — compteur à fenêtre fixe, en mémoire du processus
   --------------------------------------------------------------------------
   Protège les routes publiques coûteuses (recherche, simulation de paiement,
   création de commande) contre l'abus et l'amplification.

   Limite : l'état vit dans l'instance. Derrière plusieurs instances, chaque
   instance applique son propre quota ; pour un quota global, brancher un
   stockage partagé (Redis/Upstash) derrière `checkRateLimit`.
   ========================================================================== */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;

function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Renvoie `true` si l'appel est autorisé, `false` si le quota est épuisé.
 * `key` doit identifier l'appelant (identifiant utilisateur ou IP).
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) pruneExpired(now);
    /* Si le nettoyage n'a rien libéré, on repart de zéro plutôt que de
       grossir indéfiniment : les compteurs sont jetables. */
    if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Adresse d'appelant, dérivée des en-têtes de proxy. */
export function clientKeyFromHeaders(headers: Headers, fallback = "anon"): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || fallback;
}
