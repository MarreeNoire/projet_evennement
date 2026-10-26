/* =============================================================================
   Service worker d'auto-destruction
   --------------------------------------------------------------------------
   L'application est un site web, plus une PWA : ce fichier ne fait plus aucun
   cache. Il reste servi à l'ancienne URL `/sw.js` uniquement pour libérer les
   navigateurs (surtout les téléphones) encore contrôlés par la version
   précédente, qui continuait de servir d'anciennes pages et de vieux CSS.

   Le navigateur vérifie ce fichier à chaque navigation (en-tête no-store).
   Une fois installé, ce worker supprime tous les caches, se désenregistre et
   recharge les onglets ouverts pour qu'ils repartent du réseau.
   ========================================================================== */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();

      if ("caches" in self) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }

      /* Désenregistrement d'abord : le rechargement suivant repart du réseau.
         On ne l'attend pas, sinon l'activation resterait bloquée tant que
         l'onglet n'a pas fini de naviguer. */
      await self.registration.unregister();

      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        void client.navigate(client.url).catch(() => undefined);
      }
    })(),
  );
});
