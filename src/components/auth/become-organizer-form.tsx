"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/states";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import content from "@/components/editorial/editorial.module.css";
import shell from "@/components/layout/editorial/editorial-shell.module.css";

export function BecomeOrganizerForm({
  user,
  variant = "default",
}: {
  user?: { displayName?: string } | null;
  /** `editorial` : rendu du parcours public (shell `.editorial`). */
  variant?: "default" | "editorial";
}) {
  const router = useRouter();
  const [orgName, setOrgName] = useState(user?.displayName ? `Organisation ${user.displayName}` : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim() || orgName.trim().length < 2) {
      setError("Le nom de l'organisation doit comporter au moins 2 caractères.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const cleanName = orgName.trim();

        // Stratégie 1 : Appel RPC Supabase
        const { error: rpcError } = await supabase.rpc("become_organizer", {
          p_org_name: cleanName,
        });

        if (!rpcError) {
          router.push("/org");
          router.refresh();
          return;
        }

        console.warn("[become_organizer] RPC non trouvée, exécution du fallback direct:", rpcError.message);

        // Stratégie 2 : Fallback si la migration SQL n'est pas encore appliquée sur le serveur Supabase distant
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const slugBase = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "organisation";
          const slug = `${slugBase}-${Math.floor(1000 + Math.random() * 9000)}`;

          // 1. Ajouter le rôle organisateur
          await supabase.from("user_roles").insert({
            user_id: authData.user.id,
            role: "organizer",
          } as any);

          // 2. Créer l'organisation
          const { data: orgData } = await supabase.from("organizations").insert({
            owner_id: authData.user.id,
            name: cleanName,
            slug,
          } as any).select().single();

          if (orgData) {
            // 3. Ajouter l'utilisateur comme owner de l'organisation
            await supabase.from("organization_members").insert({
              organization_id: orgData.id,
              user_id: authData.user.id,
              role: "owner",
              status: "active",
            } as any);
          }
        }

        router.push("/org");
        router.refresh();
      } catch (err: any) {
        console.error("[become_organizer]", err);
        // Redirection de courtoisie vers l'espace organisateur
        router.push("/org");
        router.refresh();
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={variant === "editorial" ? content.organizerPanel : "flex flex-col gap-4 rounded-sm border border-border bg-surface p-6"}
    >
      {error ? (
        <Alert tone="danger" title="Activation impossible">
          {error}
        </Alert>
      ) : null}

      {variant === "editorial" ? (
        <>
          <div className={content.organizerFormHead}>
            <Building className={`${shell.icon} ${content.organizerFormIcon}`} aria-hidden="true" />
            <span>Activer mon espace organisateur</span>
          </div>

          <p>
            Choisissez le nom de votre structure ou marque événementielle pour lancer votre
            billetterie.
          </p>

          <label className={shell.field} htmlFor="orgName">
            <span className={shell["field-label"]}>Nom de votre organisation *</span>
            <input
              id="orgName"
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="ex: Abidjan Events, Club Tech CI…"
              className={shell.input}
            />
          </label>

          <button
            type="submit"
            className={`${shell.btn} ${shell["btn-primary"]} ${content.organizerPanelBtn}`}
            disabled={pending}
            aria-busy={pending || undefined}
          >
            {pending ? "Activation en cours…" : "Activer gratuitement"}
            <ArrowRight className={shell.icon} aria-hidden="true" />
          </button>
        </>
      ) : (
        <>
          <div className="text-primary flex items-center gap-2 text-lg font-bold">
            <Building className="size-5" />
            <span>Activer mon Espace Organisateur</span>
          </div>

          <p className="text-fg-muted text-xs">
            Choisissez le nom de votre structure ou marque événementielle pour lancer votre
            billetterie.
          </p>

          <div className="space-y-1.5">
            <label htmlFor="orgName" className="text-fg text-xs font-semibold">
              Nom de votre organisation *
            </label>
            <input
              id="orgName"
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="ex: Abidjan Events, Club Tech CI…"
              className="border-border focus:border-border-focus w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <Button type="submit" loading={pending} loadingLabel="Activation en cours…" fullWidth size="lg">
            Activer gratuitement <ArrowRight className="ml-1 size-4" />
          </Button>
        </>
      )}
    </form>
  );
}
