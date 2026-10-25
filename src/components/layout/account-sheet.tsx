"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  UserRound,
} from "lucide-react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ROUTES } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { haptic } from "@/lib/ui/haptics";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import type { HeaderUser } from "./header-types";
import styles from "./mobile-chrome.module.css";

/* =============================================================================
   Feuille de compte — mobile
   --------------------------------------------------------------------------
   Ce qui n'existait que dans le menu desktop devient accessible au pouce :
   profil, notifications, badge, réglages, espace organisateur, administration
   (selon le rôle) et déconnexion.

   Réutilise `BottomSheet` : verrou de défilement, fermeture au glisser, au
   voile, à la croix et à Échap, retour du focus au déclencheur.
   ========================================================================== */

export function AccountSheet({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: HeaderUser;
}) {
  const router = useRouter();

  async function handleSignOut() {
    onClose();
    if (isSupabaseConfigured) {
      await createSupabaseBrowserClient().auth.signOut();
    }
    router.push(ROUTES.home);
    router.refresh();
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Compte"
      closeLabel="Fermer le menu du compte"
      variant="menu"
      scopeClassName={styles.sheetScope}
    >
      <div className={styles.sheetBody}>
        <SheetLink
          href={ROUTES.profile}
          label="Mon profil"
          icon={<UserRound className="size-[19px]" aria-hidden="true" />}
          onNavigate={onClose}
        />
        <SheetLink
          href={ROUTES.notifications}
          label="Notifications"
          icon={<Bell className="size-[19px]" aria-hidden="true" />}
          onNavigate={onClose}
        />
        <SheetLink
          href={ROUTES.myBadge}
          label="Mon badge"
          icon={<BadgeCheck className="size-[19px]" aria-hidden="true" />}
          onNavigate={onClose}
        />

        <p className={styles.groupLabel}>Compte</p>

        <SheetLink
          href={ROUTES.settings}
          label="Réglages"
          icon={<Settings className="size-[19px]" aria-hidden="true" />}
          onNavigate={onClose}
        />
        <SheetLink
          href={ROUTES.orgDashboard}
          label={user.isOrganizer ? "Espace organisateur" : "Devenir organisateur"}
          icon={<LayoutDashboard className="size-[19px]" aria-hidden="true" />}
          onNavigate={onClose}
        />
        {user.isAdmin ? (
          <SheetLink
            href={ROUTES.admin}
            label="Administration"
            icon={<Shield className="size-[19px]" aria-hidden="true" />}
            onNavigate={onClose}
          />
        ) : null}

        <p className={styles.groupLabel}>Session</p>

        <button type="button" onClick={handleSignOut} className={cn(styles.row, styles.danger)}>
          <span className={styles.rowIcon}>
            <LogOut className="size-[19px]" aria-hidden="true" />
          </span>
          <span className={styles.rowLabel}>Se déconnecter</span>
        </button>
      </div>

      <p className={styles.sheetFoot}>Glisse vers le bas pour fermer.</p>
    </BottomSheet>
  );
}

function SheetLink({
  href,
  label,
  icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      onPointerDown={() => haptic("light")}
      className={styles.row}
    >
      <span className={styles.rowIcon}>{icon}</span>
      <span className={styles.rowLabel}>{label}</span>
      <ChevronRight className={styles.chevron} aria-hidden="true" />
    </Link>
  );
}
