"use client";

import { useSyncExternalStore } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { HeaderUser } from "@/components/layout/header-types";

import {
  isStandaloneDisplay,
  subscribeToStandalone,
  serverStandaloneSnapshot,
} from "@/lib/pwa/standalone";

interface BottomNavStandaloneProps {
  user: HeaderUser | null;
}

export function BottomNavStandalone({ user }: BottomNavStandaloneProps) {
  const isStandalone = useSyncExternalStore(
    subscribeToStandalone,
    isStandaloneDisplay,
    serverStandaloneSnapshot,
  );

  if (!isStandalone) return null;

  return <BottomNav user={user} />;
}