"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

/**
 * Enregistre le Service Worker PWA et gère les mises à jour.
 * Gère aussi les subscriptions Push Notifications.
 */
export function ServiceWorkerRegistration() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [pushSupported, setPushSupported] = useState(false);

  const subscribeToPush = useCallback(async () => {
    if (!registration || !pushSupported) return;
    
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.info("Notifications désactivées", {
          description: "Tu pourras les activer plus tard dans les réglages."
        });
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        )
      });

      // Envoyer au serveur
      const response = await fetch('/api/push/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON())
      });

      if (response.ok) {
        toast.success("Notifications activées", {
          description: "Tu recevras les rappels d'événements et nouveaux messages."
        });
      } else {
        throw new Error('Échec sauvegarde');
      }
    } catch (err) {
      console.error('[Push] Erreur subscription:', err);
      toast.error("Impossible d'activer les notifications");
    }
  }, [registration, pushSupported]);

  const unsubscribeFromPush = useCallback(async () => {
    if (!registration) return;
    
    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await fetch('/api/push/subscription', { method: 'DELETE' });
        toast.success("Notifications désactivées");
      }
    } catch (err) {
      console.error('[Push] Erreur unsubscription:', err);
    }
  }, [registration]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let cancelled = false;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (cancelled) return;
        setRegistration(reg);
        setPushSupported('pushManager' in reg);

        // Détecter une mise à jour disponible
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              toast("Nouvelle version disponible", {
                description: "Clique pour recharger et profiter des dernières améliorations.",
                action: {
                  label: "Recharger",
                  onClick: () => {
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                    window.location.reload();
                  },
                },
                duration: Infinity,
                className: "bg-bg border-border",
              });
            }
          });
        });

        // Écouter le contrôleur qui change (après skipWaiting)
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });

        // Écouter les messages du SW (sync complet, etc.)
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === 'PERIODIC_SYNC_COMPLETE') {
            // Rafraîchir silencieusement les données si sur la page explorer
            if (window.location.pathname === '/explorer') {
              window.dispatchEvent(new CustomEvent('events:refresh'));
            }
          }
          if (event.data?.type === 'BG_SYNC_SUCCESS') {
            toast.success("Action synchronisée", {
              description: "Tes modifications hors-ligne ont été envoyées."
            });
          }
        });
      })
      .catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.debug("[SW] Enregistrement ignoré :", err.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Exposer les fonctions pour les composants enfants
  useEffect(() => {
    if (registration) {
      (window as any).__swRegistration = {
        subscribeToPush,
        unsubscribeFromPush,
        registration
      };
    }
    return () => {
      delete (window as any).__swRegistration;
    };
  }, [registration, subscribeToPush, unsubscribeFromPush]);

  return null;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}