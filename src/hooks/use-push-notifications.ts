"use client";

import { useCallback, useEffect, useState } from "react";

export interface PushNotificationState {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  loading: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    supported: false,
    permission: 'default',
    subscribed: false,
    loading: true
  });

  const checkStatus = useCallback(async () => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      setState(s => ({ ...s, supported: false, loading: false }));
      return;
    }

    const permission = Notification.permission;
    setState(s => ({ ...s, permission }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setState({
        supported: true,
        permission,
        subscribed: !!subscription,
        loading: false
      });
    } catch {
      setState(s => ({ ...s, supported: true, loading: false }));
    }
  }, []);

  useEffect(() => {
    checkStatus();
    
    // Écouter les changements de permission
    const handlePermissionChange = () => {
      checkStatus();
    };
    
    if (typeof navigator !== "undefined" && navigator.permissions) {
      navigator.permissions.query({ name: 'notifications' as PermissionName })
        .then(permissionStatus => {
          permissionStatus.addEventListener('change', handlePermissionChange);
          return () => permissionStatus.removeEventListener('change', handlePermissionChange);
        });
    }
  }, [checkStatus]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    const swReg = (window as any).__swRegistration;
    if (!swReg?.subscribeToPush) {
      console.warn('Service Worker registration not ready');
      return false;
    }

    setState(s => ({ ...s, loading: true }));
    await swReg.subscribeToPush();
    await checkStatus();
    return state.subscribed;
  }, [checkStatus]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    const swReg = (window as any).__swRegistration;
    if (!swReg?.unsubscribeFromPush) {
      console.warn('Service Worker registration not ready');
      return false;
    }

    setState(s => ({ ...s, loading: true }));
    await swReg.unsubscribeFromPush();
    await checkStatus();
    return !state.subscribed;
  }, [checkStatus]);

  const toggle = useCallback(async () => {
    if (state.subscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  }, [state.subscribed, subscribe, unsubscribe]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    toggle,
    refresh: checkStatus
  };
}

// Hook pour envoyer des notifications depuis le client (ex: test)
export function useSendTestNotification() {
  const sendTest = useCallback(async () => {
    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broadcast: false,
          userIds: [], // Sera rempli par le serveur avec l'utilisateur courant
          payload: {
            title: "Test de notification",
            body: "Les notifications push fonctionnent correctement ! 🎉",
            icon: "/app-icon-192.png",
            tag: "test-notification",
            data: { test: true },
            actions: [
              { action: "view", title: "Ouvrir l'app" }
            ]
          }
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  return { sendTest };
}