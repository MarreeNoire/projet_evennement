/**
 * Service Worker — Event PWA (v3)
 *
 * Stratégies :
 *  - Navigation (HTML)     : stale-while-revalidate (page instantanée depuis le
 *    cache pendant que la mise à jour réseau tourne en arrière-plan).
 *  - Assets statiques      : cache-first (`/_next/static/*` — immuables, hash).
 *  - API même origine      : network-first (fraîcheur d'abord, cache en secours).
 *  - Hors ligne            : réponse gracieuse → page `/offline` précaheée.
 *
 * Cycle de version :
 *  - Le nouveau SW attend (waiting) ; l'application écoute l'événement
 *    `updatefound` + `waiting` et affiche un toast « Nouvelle version
 *    disponible — Actualiser ». Le bouton envoie `SKIP_WAITING` puis recharge.
 */

const CACHE_VERSION = "v3";
const SHELL_CACHE = `rassemble-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `rassemble-static-${CACHE_VERSION}`;

/** Shell applicatif précahé à l'installation (dont la page hors ligne). */
const SHELL_URLS = ["/", "/explorer", "/connexion", "/inscription", "/offline"];

/** Préfixes d'assets statiques Next.js (immutables — hash dans le nom). */
const STATIC_PREFIXES = ["/_next/static/"];

/** Chemins API même origine : network-first strict. */
const API_PREFIXES = ["/api/"];

// ---------------------------------------------------------------------------
// Installation — précache du shell
// ---------------------------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        cache.addAll(SHELL_URLS.map((url) => new Request(url, { credentials: "same-origin" }))),
      )
      // ⚠️ Pas de skipWaiting automatique : le toast propose la mise à jour.
      .catch(() => {
        /* Un shell incomplet ne doit pas bloquer l'installation. */
      }),
  );
});

// ---------------------------------------------------------------------------
// Activation — nettoyage des anciens caches + contrôle immédiat si activé
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
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ---------------------------------------------------------------------------
// Message — activation sur demande de l'utilisateur (toast « Actualiser »)
// ---------------------------------------------------------------------------
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Fetch — interception
// ---------------------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 1. Assets statiques → cache-first (hash = toujours immuables).
  if (STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 2. API même origine → network-first (jamais le cache d'abord).
  if (API_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // 3. Navigation (HTML) → stale-while-revalidate + repli /offline.
  if (request.mode === "navigate") {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
    return;
  }

  // 4. Tout le reste (polices, images publiques…) → network-first.
  event.respondWith(networkFirst(request, STATIC_CACHE));
});

// ---------------------------------------------------------------------------
// Stratégies
// ---------------------------------------------------------------------------

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return offlineFallback();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) return cached;

  return (await networkPromise) || offlineFallback();
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || offlineFallback();
  }
}

/** Page Hors-ligne gracieuse — précahée à l'installation. */
async function offlineFallback() {
  const cache = await caches.open(SHELL_CACHE);
  const offlinePage =
    (await cache.match("/offline")) ||
    new Response("Hors ligne", {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  return offlinePage;
}
