"use client";

import { useState, useTransition } from "react";
import { Plus, Tag, Megaphone, Send, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/states";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface PromoCodeItem {
  id: string;
  code: string;
  discountValue: number;
  discountKind: "percentage" | "fixed";
  usedCount: number;
  maxUses: number;
  isActive: boolean;
}

const DEFAULT_PROMOS: PromoCodeItem[] = [
  {
    id: "1",
    code: "EARLYBIRD20",
    discountValue: 20,
    discountKind: "percentage",
    usedCount: 42,
    maxUses: 50,
    isActive: true,
  },
  {
    id: "2",
    code: "TECHCOMMUNITY",
    discountValue: 10,
    discountKind: "percentage",
    usedCount: 15,
    maxUses: 100,
    isActive: true,
  },
];

export function OrgMarketingManager() {
  const [promos, setPromos] = useState<PromoCodeItem[]>(DEFAULT_PROMOS);
  const [showPromoModal, setShowPromoModal] = useState(false);

  const [code, setCode] = useState("");
  const [discountValue, setDiscountValue] = useState(15);
  const [discountKind, setDiscountKind] = useState<"percentage" | "fixed">("percentage");
  const [maxUses, setMaxUses] = useState(50);

  const [announcement, setAnnouncement] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCreatePromo(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      setError("Veuillez saisir un code promo (ex: PROMO20).");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const cleanCode = code.trim().toUpperCase();
        const newPromo: PromoCodeItem = {
          id: `promo-${Date.now()}`,
          code: cleanCode,
          discountValue,
          discountKind,
          usedCount: 0,
          maxUses,
          isActive: true,
        };

        const supabase = createSupabaseBrowserClient();
        const { data: authData } = await supabase.auth.getUser();

        if (authData?.user) {
          const { data: org } = await supabase
            .from("organizations")
            .select("id")
            .eq("owner_id", authData.user.id)
            .maybeSingle();

          if (org) {
            await supabase.from("promo_codes").insert({
              organization_id: org.id,
              code: cleanCode,
              discount_kind: discountKind,
              discount_value: discountValue,
              max_uses: maxUses,
              created_by: authData.user.id,
            } as any);
          }
        }

        setPromos((prev) => [newPromo, ...prev]);
        setShowPromoModal(false);
        setCode("");
        setSuccess(`Code promo ${cleanCode} créé avec succès !`);
      } catch (err: any) {
        setError("Erreur lors de la création du code promo.");
      }
    });
  }

  function handleSendAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!announcement.trim()) {
      setError("Veuillez entrer le texte de l'annonce.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: salons } = await supabase.from("salons").select("id").limit(1);

        if (salons && salons.length > 0 && salons[0]) {
          await supabase.from("posts").insert({
            salon_id: salons[0].id,
            content: announcement.trim(),
            kind: "announcement",
            is_pinned: true,
          } as any);
        }

        setAnnouncement("");
        setSuccess("Annonce diffusée avec succès dans le salon d'événement !");
      } catch (err: any) {
        setError("Erreur lors de la diffusion de l'annonce.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Marketing & Codes Promo</h1>
          <p className="text-sm text-fg-muted">
            Boostez les ventes avec des réductions ciblées et des annonces de salon.
          </p>
        </div>
        <Button onClick={() => setShowPromoModal(true)}>
          <Plus className="mr-2 size-4" /> Créer un code promo
        </Button>
      </div>

      {success ? (
        <Alert tone="success" title="Action réussie">
          {success}
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="danger" title="Erreur">
          {error}
        </Alert>
      ) : null}

      {showPromoModal ? (
        <Card className="border-2 border-primary/50 shadow-md">
          <CardHeader>
            <CardTitle>Nouveau Code de Réduction</CardTitle>
            <CardDescription>Définissez le code et la remise accordée.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg">Code Promo *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ex: VIP2026"
                  className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm font-mono uppercase focus:border-border-focus focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">Type de remise</label>
                  <select
                    value={discountKind}
                    onChange={(e) => setDiscountKind(e.target.value as any)}
                    className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed">Montant fixe (FCFA)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">Valeur *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">Limite d&apos;utilisations</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={maxUses}
                    onChange={(e) => setMaxUses(Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowPromoModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" loading={pending} loadingLabel="Création...">
                  Créer le code
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="size-4 text-primary" /> Codes Promo Actifs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {promos.map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                <div>
                  <span className="font-mono font-bold text-fg">{p.code}</span>
                  <p className="text-xs text-fg-muted">
                    {p.discountKind === "percentage" ? `${p.discountValue}%` : `${p.discountValue} FCFA`} de réduction · {p.usedCount}/{p.maxUses} utilisés
                  </p>
                </div>
                <Badge variant="success">Actif</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="size-4 text-primary" /> Annonce de Salon
            </CardTitle>
            <CardDescription>Envoyez un message épinglé dans le salon d&apos;un événement.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendAnnouncement} className="space-y-3">
              <textarea
                rows={3}
                required
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="ex: Rappel : Le cocktail VIP débutera à 18h00 dans la grande salle…"
                className="w-full rounded-md border border-border bg-transparent p-2.5 text-sm resize-none focus:border-border-focus focus:outline-none"
              />
              <Button type="submit" variant="secondary" className="w-full" loading={pending} loadingLabel="Diffusion...">
                <Send className="mr-2 size-4" /> Diffuser l&apos;annonce
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
