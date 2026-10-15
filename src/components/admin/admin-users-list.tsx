"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 10;

export interface AdminUserListItem {
  id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
  username: string | null;
  is_verified: boolean;
  created_at: string;
}

export function AdminUsersList({
  profiles,
  rolesByUser,
  rolesLoadError,
}: {
  profiles: AdminUserListItem[];
  rolesByUser: Record<string, string[]>;
  rolesLoadError: boolean;
}) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(profiles.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageProfiles = profiles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <ul className="divide-y divide-border">
        {pageProfiles.map((profile) => {
          const userRoles = rolesByUser[profile.id] ?? [];
          return (
            <li key={profile.id} className="flex flex-col gap-2.5 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">{profile.display_name || profile.full_name || "Compte sans nom"}</p>
                <p className="truncate text-xs text-fg-muted">{profile.email || (profile.username ? `@${profile.username}` : "E-mail non renseigné")}</p>
                <p className="mt-1 text-xs text-fg-subtle">Inscrit le {new Date(profile.created_at).toLocaleDateString("fr-FR")}{profile.is_verified ? " · Profil vérifié" : ""}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2" aria-label="Rôles">
                {rolesLoadError ? <Badge variant="warning">Rôles indisponibles</Badge> : userRoles.length ? userRoles.map((role) => <Badge key={role} variant={role === "admin" ? "danger" : role === "organizer" ? "accent" : "neutral"}>{role === "admin" ? "Administrateur" : role === "organizer" ? "Organisateur" : "Participant"}</Badge>) : <Badge variant="neutral">Aucun rôle</Badge>}
                <Link href={`/admin/utilisateurs/${profile.id}`} className="inline-flex min-h-11 items-center gap-1 rounded-md border border-border px-3 text-xs font-semibold text-fg hover:bg-bg-muted"><Users className="size-3.5" aria-hidden="true" /> Gérer</Link>
              </div>
            </li>
          );
        })}
      </ul>
      {profiles.length > PAGE_SIZE ? (
        <nav aria-label="Pagination des utilisateurs" className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-xs text-fg-muted" role="status" aria-live="polite">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, profiles.length)} sur {profiles.length}</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} aria-label="Page précédente" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border disabled:opacity-45"><ArrowLeft className="size-4" aria-hidden="true" /></button>
            <span className="text-xs tabular-nums text-fg-muted">{currentPage}/{pageCount}</span>
            <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} aria-label="Page suivante" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border disabled:opacity-45"><ArrowRight className="size-4" aria-hidden="true" /></button>
          </div>
        </nav>
      ) : null}
    </>
  );
}
