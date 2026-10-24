"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useTheme } from "@/components/providers/app-providers";

interface PushSubscriptionState {
  subscribed: boolean;
  loading: boolean;
  permission: NotificationPermission;
}

export function PushNotificationsSettings() {
  const { resolvedTheme } = useTheme();
  const [state, setState] = useState<PushSubscriptionState>({
    subscribed: false,
    loading: true,
    permission: 'default'
  });

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    const permission = Notification.permission;
    setState(s => ({ ...s, permission }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setState({
        subscribed: !!subscription,
        loading: false,
        permission
      });
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  };

  const handleToggle = async () => {
    if (state.loading) return;

    const swReg = (window as any).__swRegistration;
    if (!swReg) {
      console.warn('Service Worker non prêt');
      return;
    }

    setState(s => ({ ...s, loading: true }));

    if (state.subscribed) {
      await swReg.unsubscribeFromPush();
    } else {
      await swReg.subscribeToPush();
    }

    await checkSubscriptionStatus();
  };

  if (state.loading) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span className="text-sm text-fg-muted">Vérification des notifications…</span>
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';
  const bgColor = isDark ? 'bg-void-900' : 'bg-surface';
  const borderColor = isDark ? 'border-white/10' : 'border-border';

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${borderColor} ${bgColor}`}>
      <div className="flex items-center gap-3">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
          state.subscribed ? 'bg-primary/10 text-primary' : 'bg-muted text-fg-muted'
        }`}>
          {state.subscribed ? <Bell className="size-5" /> : <BellOff className="size-5" />}
        </div>
        <div>
          <h3 className="font-medium text-sm">Notifications push</h3>
          <p className="text-xs text-fg-muted mt-0.5">
            {state.subscribed 
              ? "Reçois les rappels d'événements et nouveaux messages" 
              : "Active pour recevoir les alertes importantes"}
          </p>
          {state.permission === 'denied' && (
            <p className="text-xs text-destructive mt-1">
              Bloqué par le navigateur → Réglages du site pour autoriser
            </p>
          )}
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={state.loading || state.permission === 'denied'}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          state.subscribed ? 'bg-primary' : 'bg-muted'
        } ${state.permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
        role="switch"
        aria-checked={state.subscribed}
        aria-label={state.subscribed ? "Désactiver les notifications" : "Activer les notifications"}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            state.subscribed ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}