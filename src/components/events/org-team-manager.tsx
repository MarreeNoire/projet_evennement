"use client";

import { useState, useTransition } from "react";
import {
  UserPlus,
  Shield,
  QrCode,
  MessageSquare,
  Crown,
  Search,
  Check,
  X,
  Trash2,
  Edit2,
  Loader2,
  Info,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/states";
import { Field, Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
  searchAppUsersAction,
  inviteTeamMemberAction,
  updateTeamMemberRoleAction,
  removeTeamMemberAction,
  type SearchUserProfile,
} from "@/lib/team/actions";
import { ORG_ROLE_LABELS } from "@/lib/constants";

export interface TeamMember {
  id: string;
  userId?: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: "owner" | "manager" | "checkin_agent" | "moderator";
  roleLabel: string;
  status?: string;
  joinedAt?: string;
}

const ROLES_INFO = [
  {
    role: "manager" as const,
    label: "Gestionnaire",
    icon: Shield,
    color: "text-primary bg-primary/10 border-primary/30",
    badgeVariant: "primary" as const,
    description: "Accès étendu : création et modification d'événements, gestion de la billetterie, statistiques, check-in et modération.",
  },
  {
    role: "checkin_agent" as const,
    label: "Agent de contrôle",
    icon: QrCode,
    color: "text-info bg-info-subtle border-info/30",
    badgeVariant: "info" as const,
    description: "Accès opérationnel : scanner de QR code et validation des billets à l'entrée lors des événements (/org/check-in).",
  },
  {
    role: "moderator" as const,
    label: "Modérateur",
    icon: MessageSquare,
    color: "text-info bg-info-subtle border-info/30",
    badgeVariant: "info" as const,
    description: "Accès communautaire : modération des échanges dans les salons de l'événement, signalements et respect des règles.",
  },
];

export function OrgTeamManager({
  organizationId = "",
  organizationName = "Mon Organisation",
  initialMembers = [],
  currentUserRole = "owner",
}: {
  organizationId?: string;
  organizationName?: string;
  initialMembers?: TeamMember[];
  currentUserRole?: "owner" | "manager" | "checkin_agent" | "moderator";
}) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Search in-app users state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUserProfile[]>([]);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<"manager" | "checkin_agent" | "moderator">("manager");

  // Edit role state
  const [newRole, setNewRole] = useState<"manager" | "checkin_agent" | "moderator">("manager");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canEditTeam = currentUserRole === "owner" || currentUserRole === "manager";

  async function handleSearchUsers(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setError("Veuillez saisir au moins 2 caractères pour rechercher un membre.");
      return;
    }

    setError(null);
    setSearchStatus(null);
    setIsSearching(true);
    try {
      const res = await searchAppUsersAction(searchQuery, organizationId);
      if (!res.ok) {
        setError(res.error || "Erreur de recherche.");
        setSearchResults([]);
      } else {
        const users = res.users ?? [];
        setSearchResults(users);
        if (users.length === 0) {
          setSearchStatus("Aucun utilisateur visible dans la recherche ne correspond à ce nom, pseudo ou email.");
        } else {
          setSearchStatus(`${users.length} utilisateur${users.length > 1 ? "s" : ""} trouvé${users.length > 1 ? "s" : ""}. Sélectionnez la bonne personne.`);
        }
      }
    } catch {
      setError("Erreur lors de la recherche.");
      setSearchResults([]);
      setSearchStatus(null);
    } finally {
      setIsSearching(false);
    }
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) {
      setError("Veuillez rechercher et sélectionner un utilisateur de l'application.");
      return;
    }

    if (!organizationId) {
      setError("Organisation non identifiée.");
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await inviteTeamMemberAction({
        organizationId,
        targetUserId: selectedUser.id,
        role: selectedRole,
      });

      if (!res.ok || !res.member) {
        setError(res.error || "Impossible d'ajouter ce membre.");
        return;
      }

      setMembers((prev) => [
        ...prev.filter((m) => m.userId !== selectedUser.id),
        res.member,
      ]);

      setShowInviteModal(false);
      setSelectedUser(null);
      setSearchQuery("");
      setSearchResults([]);
      setSuccess(
        `${selectedUser.displayName} a été ajouté(e) avec succès à l'équipe en tant que ${ORG_ROLE_LABELS[selectedRole]} ! Une notification lui a été transmise dans l'application.`,
      );
    });
  }

  function handleUpdateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMember || !organizationId) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await updateTeamMemberRoleAction({
        organizationId,
        memberId: editingMember.id,
        role: newRole,
      });

      if (!res.ok) {
        setError(res.error || "Impossible de modifier le rôle.");
        return;
      }

      setMembers((prev) =>
        prev.map((m) =>
          m.id === editingMember.id
            ? { ...m, role: newRole, roleLabel: ORG_ROLE_LABELS[newRole] }
            : m,
        ),
      );

      setEditingMember(null);
      setSuccess(`Le rôle de ${editingMember.name} a été mis à jour avec succès en ${ORG_ROLE_LABELS[newRole]}.`);
    });
  }

  function handleRemoveMember(member: TeamMember) {
    if (!organizationId) return;
    if (member.role === "owner") {
      alert("Le propriétaire de l'organisation ne peut pas être retiré.");
      return;
    }

    if (
      !confirm(
        `Êtes-vous sûr de vouloir retirer ${member.name} de l'équipe ? Cette personne perdra immédiatement ses accès à l'organisation.`,
      )
    ) {
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await removeTeamMemberAction({
        organizationId,
        memberId: member.id,
      });

      if (!res.ok) {
        setError(res.error || "Impossible de retirer ce membre.");
        return;
      }

      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setSuccess(`${member.name} a été retiré(e) de l'équipe.`);
    });
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-fg">
            Équipe de l&apos;Organisation
          </h1>
          <p className="text-sm text-fg-muted mt-1">
            Gérez les collaborateurs de <strong className="text-fg font-semibold">{organizationName}</strong> et
            attribuez-leur les rôles applicatifs dédiés.
          </p>
        </div>

        {canEditTeam && (
          <Button
            onClick={() => {
              setShowInviteModal(true);
              setError(null);
              setSelectedUser(null);
              setSearchQuery("");
              setSearchResults([]);
            }}
            className="w-full sm:w-auto gap-2 shadow-sm"
          >
            <UserPlus className="size-4" /> Inviter via l&apos;application
          </Button>
        )}
      </div>

      {/* Notifications / Alertes */}
      {error && (
        <Alert tone="danger" title="Attention" floating onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert tone="success" title="Opération réussie" onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Guide des Rôles Fonctionnels */}
      <div className="grid gap-4 sm:grid-cols-3">
        {ROLES_INFO.map((info) => {
          const Icon = info.icon;
          return (
            <Card key={info.role} className="p-4 sm:p-5 relative overflow-hidden transition-all hover:border-border-strong hover:shadow-xs">
              <div className="flex items-center gap-3 mb-2.5">
                <span className={cn("flex size-9 items-center justify-center rounded-lg border", info.color)}>
                  <Icon className="size-4.5" />
                </span>
                <div>
                  <h3 className="font-display text-sm font-bold text-fg">{info.label}</h3>
                  <Badge variant={info.badgeVariant} size="sm">
                    {info.role}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-fg-muted leading-relaxed">{info.description}</p>
            </Card>
          );
        })}
      </div>

      {/* Modal / Formulaire d'invitation In-App */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-lg shadow-2xl border-2 border-primary/40 bg-surface">
            <CardHeader className="border-b border-border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <UserPlus className="size-5 text-primary" /> Inviter un membre dans l&apos;équipe
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Recherchez un utilisateur inscrit sur l&apos;application. Une notification lui sera envoyée directement.
                  </CardDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="p-1 rounded-md text-fg-subtle hover:text-fg"
                  aria-label="Fermer"
                >
                  <X className="size-5" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Étape 1 : Recherche d'utilisateur */}
              <form onSubmit={handleSearchUsers} className="space-y-2">
                <label className="text-xs font-semibold text-fg">
                  1. Rechercher un utilisateur sur l&apos;application *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-subtle" />
                    <input
                      type="text"
                      placeholder="Nom, pseudo (@username) ou email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Rechercher un utilisateur par nom, pseudo ou email"
                      className="w-full h-10 rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-border-focus focus:outline-none"
                    />
                  </div>
                  <Button type="submit" variant="secondary" disabled={isSearching} className="gap-1.5 shrink-0">
                    {isSearching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                    Rechercher
                  </Button>
                </div>
                <p className="text-2xs text-fg-subtle">
                  Tapez au moins 2 caractères du nom d&apos;utilisateur ou de son profil.
                </p>
                <p className="text-xs text-fg-muted" role="status" aria-live="polite">
                  {isSearching ? "Recherche en cours…" : searchStatus}
                </p>
              </form>

              {/* Résultats de recherche */}
              {searchResults.length > 0 && !selectedUser && (
                <div className="rounded-xl border border-border bg-surface-sunken p-2 max-h-52 overflow-y-auto divide-y divide-border/60">
                  <p className="text-2xs font-semibold uppercase text-fg-subtle px-3 py-1">
                    Utilisateurs trouvés ({searchResults.length})
                  </p>
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(user);
                        setError(null);
                      }}
                      className="w-full flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-surface-raised transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={user.displayName} src={user.avatarUrl || undefined} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-fg truncate">{user.displayName}</p>
                          <p className="text-xs text-fg-subtle truncate">
                            {user.username ? `@${user.username}` : user.email || "Utilisateur"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-primary shrink-0">Choisir</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Utilisateur sélectionné */}
              {selectedUser && (
                <div className="rounded-xl border border-primary/40 bg-primary/5 p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={selectedUser.displayName} src={selectedUser.avatarUrl || undefined} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-fg truncate">{selectedUser.displayName}</p>
                      <p className="text-xs text-fg-muted truncate">
                        {selectedUser.username ? `@${selectedUser.username}` : selectedUser.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                    className="text-xs text-fg-muted hover:text-fg"
                  >
                    Changer
                  </Button>
                </div>
              )}

              {/* Étape 2 : Choix du rôle */}
              <form onSubmit={handleInvite} className="space-y-4 pt-2">
                <Field label="2. Attribuer un rôle dans l'équipe" required>
                  <Select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as any)}
                  >
                    <option value="manager">Gestionnaire — Gestion complète des événements &amp; billetterie</option>
                    <option value="checkin_agent">Agent de contrôle — Scanner de billets à l&apos;entrée (/org/check-in)</option>
                    <option value="moderator">Modérateur — Modération des salons communautaires</option>
                  </Select>
                </Field>

                <div className="rounded-lg bg-surface-raised border border-border p-3 text-xs text-fg-muted flex items-start gap-2">
                  <Info className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Ce collaborateur sera immédiatement activé et recevra une alerte dans l&apos;application pour accéder à son espace. Aucun email externe n&apos;est envoyé.
                  </span>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowInviteModal(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    loading={pending}
                    disabled={!selectedUser}
                    className="gap-1.5"
                  >
                    <Check className="size-4" /> Ajouter à l&apos;équipe
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de modification de rôle */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md shadow-2xl border-border bg-surface">
            <CardHeader className="border-b border-border p-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Edit2 className="size-4 text-primary" /> Modifier le rôle de {editingMember.name}
                </CardTitle>
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="p-1 rounded-md text-fg-subtle hover:text-fg"
                >
                  <X className="size-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleUpdateRole} className="space-y-4">
                <Field label="Nouveau rôle attribué" required>
                  <Select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                  >
                    <option value="manager">Gestionnaire</option>
                    <option value="checkin_agent">Agent de contrôle</option>
                    <option value="moderator">Modérateur</option>
                  </Select>
                </Field>

                <div className="flex justify-end gap-2.5 pt-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setEditingMember(null)}>
                    Annuler
                  </Button>
                  <Button type="submit" size="sm" loading={pending} className="gap-1.5">
                    <Check className="size-4" /> Mettre à jour
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des Membres de l'Équipe */}
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="border-b border-border/70 p-4 sm:p-5 bg-surface/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base sm:text-lg font-bold">Membres Actifs</CardTitle>
              <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
                {members.length}
              </span>
            </div>
            <p className="text-xs text-fg-subtle hidden sm:block">
              Tous les membres ont été invités et validés au sein de l&apos;application
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {members.map((member) => {
              const isOwner = member.role === "owner";
              const roleInfo = ROLES_INFO.find((r) => r.role === member.role);
              const RoleIcon = isOwner ? Crown : roleInfo?.icon || Shield;

              return (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 transition-colors hover:bg-surface-raised/50"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <Avatar
                      name={member.name}
                      src={member.avatarUrl || undefined}
                      size="lg"
                      className="border border-border shrink-0 shadow-xs"
                    />

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-base font-bold text-fg truncate">
                          {member.name}
                        </span>

                        {isOwner ? (
                          <Badge variant="accent" className="font-bold gap-1 bg-amber-500/15 text-amber-600 border-amber-500/30">
                            <Crown className="size-3" /> Propriétaire
                          </Badge>
                        ) : (
                          <Badge variant={roleInfo?.badgeVariant || "neutral"} className="gap-1">
                            <RoleIcon className="size-3" />
                            {member.roleLabel || ORG_ROLE_LABELS[member.role] || member.role}
                          </Badge>
                        )}

                        <span className="inline-flex items-center gap-1 text-2xs text-success font-semibold bg-success-subtle px-2 py-0.5 rounded-full">
                          <span className="size-1.5 rounded-full bg-success" /> Actif
                        </span>
                      </div>

                      <p className="text-xs text-fg-muted truncate">{member.email || "Utilisateur de l'application"}</p>
                    </div>
                  </div>

                  {/* Actions sur le membre */}
                  {canEditTeam && !isOwner && (
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingMember(member);
                          setNewRole(member.role as any);
                        }}
                        className="h-8 gap-1 px-2.5 text-xs"
                      >
                        <Edit2 className="size-3.5" /> Changer le rôle
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveMember(member)}
                        className="h-8 px-2 text-danger hover:bg-danger/10 hover:text-danger"
                        title="Retirer de l'équipe"
                        aria-label={`Retirer ${member.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
