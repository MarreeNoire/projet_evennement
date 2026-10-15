"use client";

import {
  BarChart3,
  Calendar,
  LayoutDashboard,
  Megaphone,
  QrCode,
  Settings,
  Ticket,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

import { DashboardMobileNavigation } from "@/components/layout/dashboard-mobile-navigation";

const items = [
  { href: "/org", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/org/evenements", label: "Événements", icon: Calendar },
  { href: "/org/billetterie", label: "Billetterie", icon: Ticket },
  { href: "/org/participants", label: "Participants", icon: Users },
  { href: "/org/check-in", label: "Check-in", icon: QrCode },
  { href: "/org/analytics", label: "Statistiques", icon: BarChart3 },
  { href: "/org/marketing", label: "Marketing", icon: Megaphone },
  { href: "/org/equipe", label: 'Équipe', icon: UserCheck },
  { href: "/org/paiements", label: "Paiements", icon: Wallet },
  { href: "/org/parametres", label: "Paramètres", icon: Settings },
];

export function OrgMobileNavigation() {
  return (
    <DashboardMobileNavigation
      items={items}
      title="Espace organisateur"
      homeLabel="Retour au site public"
      accent="org"
    />
  );
}
