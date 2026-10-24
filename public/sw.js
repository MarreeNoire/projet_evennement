/**
 * Service Worker Event — PWA production
 * Stratégies :
 *  - Précache statique (/, /explorer, /offline, manifest, icônes, polices)
 *  - Stale-while-revalidate pour les pages mêmes-origin
 *  - Network-first pour les appels API (/api/*)
 *  - Fallback hors-ligne pour les navigations
 *  - Gestion des mises à jour (skipWaiting + clients.claim + notification)
 *  - Background Sync pour formulaires hors-ligne
 *  - Periodic Background Sync pour rafraîchir la liste d'événements
 *  - Push Notifications (Web Push + VAPID)
 */

const CACHE_NAME = 'event-v1';
const PRECACHE_URLS = [
  '/',
  '/explorer',
  '/offline',
  '/manifest.webmanifest',
  '/app-icon-192.png',
  '/app-icon-512.png',
  '/apple-touch-icon.png'
];

// Pages qui doivent toujours tenter le réseau d'abord (données fraîches)
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /\/evenements\/[^/]+\/billets/,
  /\/mes-billets/,
  /\/commandes/,
  /\/org\//
];

// Ressources statiques à servir depuis le cache (cache-first)
const CACHE_FIRST_PATTERNS = [
  /\.(?:png|jpg|jpeg|webp|avif|svg|woff2?|css|js)$/,
  /\/fonts\//
];

// Background Sync tags
const BG_SYNC_TAGS = {
  CREATE_EVENT: 'bg-sync-create-event',
  PAYMENT: 'bg-sync-payment',
  SALON_MESSAGE: 'bg-sync-salon-message'
};

// Periodic Background Sync
const PERIODIC_SYNC_TAG = 'periodic-sync-events';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Précacher en parallèle, ignorer les échecs individuels
      await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { credentials: 'same-origin' })).catch(() => {
            // Ressource optionnelle
          })
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Nettoyer les anciens caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
      
      // Enregistrer la Periodic Background Sync si supportée
      if ('periodicSync' in self.registration) {
        try {
          await self.registration.periodicSync.register(PERIODIC_SYNC_TAG, {
            minInterval: 24 * 60 * 60 * 1000 // 24h
          });
          console.log('[SW] Periodic Background Sync enregistré');
        } catch (err) {
          console.debug('[SW] Periodic Sync non disponible :', err.message);
        }
      }
    })()
  );
});

function isNetworkFirst(url) {
  return NETWORK_FIRST_PATTERNS.some((pattern) => pattern.test(url));
}

function isCacheFirst(url) {
  return CACHE_FIRST_PATTERNS.some((pattern) => pattern.test(url));
}

async function fetchWithCacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    // Revalider en arrière-plan
    fetch(request)
      .then((response) => {
        if (response.ok) cache.put(request, response.clone());
      })
      .catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('Hors ligne', { status: 503 });
  }
}

async function fetchWithNetworkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Fallback navigation
    if (request.mode === 'navigate') {
      const offline = await cache.match('/offline');
      if (offline) return offline;
    }
    return new Response('Hors ligne', { status: 503 });
  }
}

async function fetchWithStaleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

// Background Sync : rejouer les requêtes en file d'attente
async function processBackgroundSync(tag) {
  const db = await openSyncDB();
  const tx = db.transaction('sync-queue', 'readwrite');
  const store = tx.objectStore('sync-queue');
  const index = store.index('tag');
  const requests = await index.getAll(tag);
  
  for (const entry of requests) {
    try {
      const response = await fetch(entry.request.url, entry.request.options);
      if (response.ok) {
        await store.delete(entry.id);
        // Notifier le client du succès
        const clients = await self.clients.matchAll();
        clients.forEach(client => client.postMessage({
          type: 'BG_SYNC_SUCCESS',
          tag,
          id: entry.id
        }));
      }
    } catch (err) {
      console.debug('[SW] Background Sync retry later:', err.message);
      // Laisser en file pour prochaine tentative
    }
  }
  await tx.done;
}

// IndexedDB pour la file d'attente Background Sync
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('event-sync-db', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sync-queue')) {
        const store = db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
        store.createIndex('tag', 'tag', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Ajouter une requête à la file Background Sync
async function queueBackgroundSync(tag, requestData) {
  const db = await openSyncDB();
  const tx = db.transaction('sync-queue', 'readwrite');
  const store = tx.objectStore('sync-queue');
  await store.add({
    tag,
    request: requestData,
    timestamp: Date.now()
  });
  await tx.done;
  
  // Enregistrer le sync si pas déjà fait
  try {
    await self.registration.sync.register(tag);
  } catch (err) {
    console.debug('[SW] Sync register failed:', err.message);
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes cross-origin (CDN, Supabase storage, etc.)
  if (url.origin !== location.origin) {
    return;
  }

  // Navigation (HTML) → stale-while-revalidate
  if (request.mode === 'navigate') {
    event.respondWith(fetchWithStaleWhileRevalidate(request));
    return;
  }

  // API & données sensibles → network-first
  if (isNetworkFirst(url.pathname)) {
    event.respondWith(fetchWithNetworkFirst(request));
    return;
  }

  // Assets statiques → cache-first
  if (isCacheFirst(url.pathname)) {
    event.respondWith(fetchWithCacheFirst(request));
    return;
  }

  // Mutations POST/PUT/DELETE → network-first + background sync fallback
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          return response;
        } catch (err) {
          // Hors-ligne : mettre en file pour Background Sync
          const tag = url.pathname.includes('/evenements') && request.method === 'POST'
            ? BG_SYNC_TAGS.CREATE_EVENT
            : url.pathname.includes('/paiement') || url.pathname.includes('/commandes')
              ? BG_SYNC_TAGS.PAYMENT
              : BG_SYNC_TAGS.SALON_MESSAGE;
          
          const requestData = {
            url: request.url,
            options: {
              method: request.method,
              headers: Object.fromEntries(request.headers.entries()),
              body: request.method !== 'GET' ? await request.clone().text() : undefined,
              credentials: request.credentials
            }
          };
          await queueBackgroundSync(tag, requestData);
          
          return new Response(JSON.stringify({ 
            offline: true, 
            queued: true,
            message: 'Action mise en file d\'attente, sera envoyée dès la reconnexion'
          }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })()
    );
    return;
  }

  // Par défaut : stale-while-revalidate
  event.respondWith(fetchWithStaleWhileRevalidate(request));
});

// Background Sync events
self.addEventListener('sync', (event) => {
  if (event.tag.startsWith('bg-sync-')) {
    event.waitUntil(processBackgroundSync(event.tag));
  }
});

// Periodic Background Sync : rafraîchir la liste d'événements
self.addEventListener('periodicsync', (event) => {
  if (event.tag === PERIODIC_SYNC_TAG) {
    event.waitUntil(
      (async () => {
        try {
          // Préfetcher les événements à venir pour le cache
          const response = await fetch('/api/events?upcoming=true&limit=20', {
            credentials: 'same-origin'
          });
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put('/api/events?upcoming=true&limit=20', response.clone());
            
            // Notifier les clients
            const clients = await self.clients.matchAll();
            clients.forEach(client => client.postMessage({
              type: 'PERIODIC_SYNC_COMPLETE',
              tag: PERIODIC_SYNC_TAG
            }));
          }
        } catch (err) {
          console.debug('[SW] Periodic sync failed:', err.message);
        }
      })()
    );
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/app-icon-192.png',
    badge: '/app-icon-192.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || 'event-notification',
    renotify: true
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data;
  const action = event.action;
  
  let targetUrl = '/';
  
  if (action === 'view' && data.url) {
    targetUrl = data.url;
  } else if (action === 'dismiss') {
    return;
  } else if (data.url) {
    targetUrl = data.url;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Chercher une fenêtre existante
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        // Ouvrir nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  // Ré-abonner automatiquement si la subscription a expiré
  event.waitUntil(
    (async () => {
      try {
        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(self.VAPID_PUBLIC_KEY)
        });
        // Envoyer la nouvelle subscription au serveur
        await fetch('/api/push/subscription', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSubscription.toJSON())
        });
      } catch (err) {
        console.error('[SW] Push subscription change failed:', err);
      }
    })()
  );
});

// Écouter les messages du client
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Client demande un sync immédiat
  if (event.data?.type === 'TRIGGER_SYNC' && event.data.tag) {
    if (event.data.tag.startsWith('bg-sync-')) {
      event.waitUntil(processBackgroundSync(event.data.tag));
    } else if (event.data.tag === PERIODIC_SYNC_TAG) {
      event.waitUntil(
        (async () => {
          try {
            await self.registration.periodicSync.register(PERIODIC_SYNC_TAG, {
              minInterval: 0 // Force immediate
            });
          } catch {}
        })()
      );
    }
  }
  
  // Client envoie une subscription push
  if (event.data?.type === 'PUSH_SUBSCRIPTION') {
    // La subscription est gérée côté serveur via /api/push/subscription
  }
});

// Utilitaire pour convertir clé VAPID
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}