"use client";

import { ChevronDown, LayoutDashboard, LogOut, Settings, Shield, Ticket, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { ROUTES } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import type { HeaderUser } from "./header-types";

/* =============================================================================
   Menu du compte
   --------------------------------------------------------------------------
   * `aria-haspopup="menu"` et `aria-expanded` sur le déclencheur ;
   * fermeture au clic extérieur, à la touche Échap et au changement de page ;
   * les éléments sont de vrais liens (navigation), pas des `div` cliquables.
   ========================================================================== */

export function UserMenu({ user }: { user: HeaderUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    if (isSupabaseConfigured) {
      await createSupabaseBrowserClient().auth.signOut();
    }
    setOpen(false);
    router.push(ROUTES.home);
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1 rounded-full p-0.5 hover:bg-bg-muted"
      >
        <Avatar src={user.avatarUrl} name={user.displayName} size="sm" />
        <ChevronDown className="size-4 text-fg-subtle" aria-hidden="true" />
        <span className="sr-only">Ouvrir le menu du compte</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-surface-overlay shadow-lg"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold">{user.displayName}</p>
            {user.username ? (
              <p className="truncate text-xs text-fg-muted">@{user.username}</p>
            ) : null}
          </div>

          <div className="p-1.5">
            <MenuLink href={ROUTES.profile} icon={<UserRound className="size-4" />}>
              Mon profil
            </MenuLink>
            <MenuLink href={ROUTES.myTickets} icon={<Ticket className="size-4" />}>
              Mes billets
            </MenuLink>
            <MenuLink href={ROUTES.settings} icon={<Settings className="size-4" />}>
              Réglages
            </MenuLink>
            <MenuLink href={ROUTES.orgDashboard} icon={<LayoutDashboard className="size-4" />}>
              {user.isOrganizer ? "Espace organisateur" : "Devenir organisateur"}
            </MenuLink>
            {user.isAdmin ? (
              <MenuLink href={ROUTES.admin} icon={<Shield className="size-4" />}>
                Administration
              </MenuLink>
            ) : null}
          </div>

          <div className="border-t border-border p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg hover:bg-bg-muted"
            >
              <LogOut className="size-4 text-fg-subtle" aria-hidden="true" />
              Se déconnecter
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg hover:bg-bg-muted"
    >
      <span className="text-fg-subtle" aria-hidden="true">
        {icon}
      </span>
      {children}
    </Link>
  );
}