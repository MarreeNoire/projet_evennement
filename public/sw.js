/**
 * Service Worker — Rassemble PWA
 *
 * Stratégie :
 *  - Navigation (HTML)  : Network-first avec fallback cache (offline shell).
 *  - Assets statiques   : Cache-first (JS/CSS/images immutables via _next/static).
 *  - API / Supabase     : Network-only (jamais mis en cache).
 *
 * Ce service worker résout le problème de « rafraîchissement automatique »
 * quand l'utilisateur revient sur la PWA après l'avoir mise en arrière-plan :
 *  1. Les assets statiques sont servis instantanément depuis le cache.
 *  2. La page HTML est servie depuis le cache pendant que la mise à jour
 *     réseau s'effectue silencieusement (stale-while-revalidate pour le shell).
 */

const CACHE_VERSION = "v1";
const SHELL_CACHE = `rassemble-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `rassemble-static-${CACHE_VERSION}`;

/** Ressources constituant le shell applicatif mis en cache à l'installation. */
const SHELL_URLS = ["/", "/explorer", "/connexion", "/inscription"];

/** Préfixes des assets statiques Next.js (immutables — hash dans le nom). */
const STATIC_PREFIXES = ["/_next/static/"];

/** Origines que l'on ne met jamais en cache (API, Supabase, analytics). */
const BYPASS_ORIGINS = [
  "supabase.co",
  "supabase.com",
  "googleapis.com",
  "analytics",
];

// ---------------------------------------------------------------------------
// Installation — préchargement du shell
// ---------------------------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        cache.addAll(
          SHELL_URLS.map(
            (url) => new Request(url, { credentials: "same-origin" })
          )
        )
      )
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) // Ne pas bloquer si le réseau est absent
  );
});

// ---------------------------------------------------------------------------
// Activation — nettoyage des anciens caches
// ---------------------------------------------------------------------------
self.addEventListener("activate", (event) => {
  const currentCaches = [SHELL_CACHE, STATIC_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => !currentCaches.includes(name))
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// Fetch — intercepter les requêtes
// ---------------------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Ne pas intercepter les requêtes non-GET ou les autres origines
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) {
    // Laisser passer les APIs / Supabase
    if (BYPASS_ORIGINS.some((o) => url.hostname.includes(o))) return;
    // Pour tout autre cross-origin : laisser passer
    return;
  }

  // 2. Assets statiques Next.js → Cache-first (hash = toujours immutables)
  if (STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 3. Navigation HTML (pages) → Stale-while-revalidate
  //    Affiche le cache immédiatement, met à jour en arrière-plan.
  //    C'est la clé pour éviter le « rechargement visible » au retour sur la PWA.
  if (request.mode === "navigate") {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
    return;
  }

  // 4. Tout le reste (fonts, images non-statiques…) → Network-first
  event.respondWith(networkFirst(request, SHELL_CACHE));
});

// ---------------------------------------------------------------------------
// Stratégies de cache
// ---------------------------------------------------------------------------

/**
 * Cache-first : retourne la réponse mise en cache si disponible,
 * sinon va chercher sur le réseau et met en cache le résultat.
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response("Hors ligne", { status: 503 });
  }
}

/**
 * Stale-while-revalidate : retourne le cache instantanément ET lance
 * une mise à jour réseau en arrière-plan.
 * Résout le problème de rechargement visible quand on revient sur la PWA.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Mise à jour réseau en arrière-plan (silencieuse)
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  // Retourner le cache immédiatement si disponible
  if (cached) return cached;

  // Pas de cache : attendre le réseau
  return networkPromise || new Response("Hors ligne", { status: 503 });
}

/**
 * Network-first : essaie le réseau, tombe en cache si erreur réseau.
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response("Hors ligne", { status: 503 });
  }
}
