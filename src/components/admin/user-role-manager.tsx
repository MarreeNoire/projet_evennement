"use client";

import { useState, useTransition } from "react";
import { Shield, ShieldCheck, Users } from "lucide-react";

import { setUserRoleAction } from "@/lib/admin/actions";
import type { UserRole } from "@/types/database";

const roleLabels: Record<UserRole, string> = {
  participant: "Participant",
  organizer: "Organisateur",
  admin: "Administrateur",
};

const roleDescriptions: Record<UserRole, string> = {
  participant: "Accès membre standard à l’application.",
  organizer: "Accès à la création et à la gestion d’événements.",
  admin: "Accès à la gestion globale de la plateforme.",
};

const roleIcons = { participant: Users, organizer: ShieldCheck, admin: Shield };

export function UserRoleManager({
  userId,
  roles,
  organizerAccessFromOrganization,
  isCurrentUser,
}: {
  userId: string;
  roles: UserRole[];
  organizerAccessFromOrganization: boolean;
  isCurrentUser: boolean;
}) {
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateRole(role: UserRole, granted: boolean) {
    setMessage(null);
    setPendingRole(role);
    startTransition(async () => {
      try {
        const result = await setUserRoleAction(userId, role, granted);
        setMessage(result.error ?? result.success ?? "Rôle mis à jour.");
      } catch {
        setMessage("La modification du rôle a échoué. Actualisez la page puis réessayez.");
      } finally {
        setPendingRole(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {(["participant", "organizer", "admin"] as UserRole[]).map((role) => {
          const Icon = roleIcons[role];
          const assigned = roles.includes(role);
          const inheritedOrganizer = role === "organizer" && organizerAccessFromOrganization && !assigned;
          const checked = assigned || inheritedOrganizer;
          const disabled = isPending || inheritedOrganizer || (isCurrentUser && role === "admin" && assigned);

          return (
            <label key={role} className="flex min-h-16 items-start gap-3 rounded-lg border border-border p-3 sm:items-center">
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(event) => updateRole(role, event.target.checked)}
                className="mt-1 size-5 shrink-0 accent-primary sm:mt-0"
                aria-label={`${checked ? "Retirer" : "Attribuer"} le rôle ${roleLabels[role]}`}
              />
              <Icon className="mt-0.5 size-4 shrink-0 text-fg-subtle sm:mt-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-fg">{roleLabels[role]}</span>
                <span className="block text-xs text-fg-muted">{roleDescriptions[role]}</span>
                {inheritedOrganizer ? <span className="mt-1 block text-xs text-warning">Accès hérité d’une organisation : gérez-le depuis l’équipe de cette organisation.</span> : null}
                {isCurrentUser && role === "admin" && assigned ? <span className="mt-1 block text-xs text-fg-subtle">Votre propre accès admin est protégé sur cette fiche.</span> : null}
              </span>
              {pendingRole === role ? <span className="text-xs text-fg-muted">Enregistrement…</span> : null}
            </label>
          );
        })}
      </div>
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-fg-muted">{message}</p>
      <p className="text-xs text-fg-subtle">Les changements sont appliqués immédiatement et consignés dans le journal d’audit. Le dernier administrateur ne peut pas être retiré.</p>
    </div>
  );
}
