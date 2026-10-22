/**
 * Ancien service worker PWA — auto-destruction.
 *
 * L'application est désormais un site web classique et n'enregistre plus de
 * service worker. Ce fichier reste temporairement en ligne pour les navigateurs
 * qui ont encore l'ancien worker : dès qu'il est téléchargé, il supprime les
 * caches de l'application et se désenregistre. Il pourra être supprimé une fois
 * les anciens clients nettoyés.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      await self.registration.unregister();
    })(),
  );
});
