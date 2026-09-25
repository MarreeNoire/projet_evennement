"use client";

import { useState, useTransition } from "react";
import { UserPlus, Shield, Mail, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/states";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "checkin_agent" | "moderator";
  roleLabel: string;
}

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: "1",
    name: "Organisation Principale",
    email: "contact@organisation.ci",
    role: "owner",
    roleLabel: "Propriétaire (Owner)",
  },
  {
    id: "2",
    name: "Agent Check-in 1",
    email: "checkin@organisation.ci",
    role: "checkin_agent",
    roleLabel: "Agent de contrôle",
  },
];

const ROLE_OPTIONS = [
  { value: "manager", label: "Gestionnaire" },
  { value: "checkin_agent", label: "Agent de contrôle" },
  { value: "moderator", label: "Modérateur" },
];

export function OrgTeamManager() {
  const [members, setMembers] = useState<TeamMember[]>(DEFAULT_MEMBERS);
  const [showModal, setShowModal] = useState(false);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "checkin_agent" | "moderator">("checkin_agent");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Veuillez saisir une adresse email valide.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const roleObj = ROLE_OPTIONS.find((r) => r.value === role);
        const namePart = email ? email.split("@")[0] || "Collaborateur" : "Collaborateur";
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

        const newMember: TeamMember = {
          id: `member-${Date.now()}`,
          name: formattedName,
          email: email.trim(),
          role,
          roleLabel: roleObj?.label || "Membre",
        };

        // Supabase insertion si connecté
        const supabase = createSupabaseBrowserClient();
        const { data: authData } = await supabase.auth.getUser();

        if (authData?.user) {
          const { data: org } = await supabase
            .from("organizations")
            .select("id")
            .eq("owner_id", authData.user.id)
            .maybeSingle();

          if (org) {
            await supabase.from("organization_members").insert({
              organization_id: org.id,
              invited_email: email.trim(),
              role,
              status: "pending",
              invited_by: authData.user.id,
            } as any);
          }
        }

        setMembers((prev) => [...prev, newMember]);
        setShowModal(false);
        setEmail("");
        setSuccess(`Invitation envoyée avec succès à ${email.trim()} !`);
      } catch (err: any) {
        setError("Erreur lors de l'envoi de l'invitation.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Membres de l&apos;Équipe</h1>
          <p className="text-sm text-fg-muted">
            Attribuez des rôles (Gestionnaire, Agent de check-in, Modérateur) à vos collaborateurs.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <UserPlus className="mr-2 size-4" /> Inviter un membre
        </Button>
      </div>

      {success ? (
        <Alert tone="success" title="Invitation transmise">
          {success}
        </Alert>
      ) : null}

      {showModal ? (
        <Card className="border-2 border-primary/50 shadow-md">
          <CardHeader>
            <CardTitle>Inviter un collaborateur</CardTitle>
            <CardDescription>
              Un email d&apos;invitation avec son rôle d&apos;accès lui sera transmis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              {error ? (
                <Alert tone="danger" title="Erreur">
                  {error}
                </Alert>
              ) : null}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg">Adresse Email du collaborateur *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="collaborateur@organisation.ci"
                  className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg">Rôle attribué *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" loading={pending} loadingLabel="Envoi...">
                  Envoyer l&apos;invitation
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membres Actifs & Collaborateurs</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <Avatar name={m.name} size="md" />
                <div>
                  <p className="font-semibold text-sm text-fg">{m.name}</p>
                  <p className="text-xs text-fg-subtle">{m.email}</p>
                </div>
              </div>
              <Badge variant={m.role === "owner" ? "accent" : "neutral"}>{m.roleLabel}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
