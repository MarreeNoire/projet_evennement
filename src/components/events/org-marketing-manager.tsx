"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Plus, Tag, Megaphone, Send } from "lucide-react";

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
  maxUses: number | null;
  isActive: boolean;
}

const PROMOS_PER_PAGE = 5;

export function OrgMarketingManager({ events = [], initialPromos = [] }: { events?: { id: string; title: string }[]; initialPromos?: PromoCodeItem[] }) {
  const [promos, setPromos] = useState<PromoCodeItem[]>(initialPromos);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoPage, setPromoPage] = useState(1);

  const [code, setCode] = useState("");
  const [discountValue, setDiscountValue] = useState(15);
  const [discountKind, setDiscountKind] = useState<"percentage" | "fixed">("percentage");
  const [maxUses, setMaxUses] = useState(50);

  const [announcement, setAnnouncement] = useState("");
  const [eventId, setEventId] = useState(events[0]?.id ?? "");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const promoPageCount = Math.max(1, Math.ceil(promos.length / PROMOS_PER_PAGE));
  const currentPromoPage = Math.min(promoPage, promoPageCount);
  const pagePromos = promos.slice((currentPromoPage - 1) * PROMOS_PER_PAGE, currentPromoPage * PROMOS_PER_PAGE);

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
        const supabase = createSupabaseBrowserClient();
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) throw new Error("Session expirée");
        const { data: org, error: orgError } = await supabase
            .from("organizations")
            .select("id")
            .eq("owner_id", authData.user.id)
            .maybeSingle();
        if (orgError || !org) throw orgError ?? new Error("Organisation introuvable");
        const { data: inserted, error: insertError } = await supabase.from("promo_codes").insert({
              organization_id: org.id,
              code: cleanCode,
              discount_kind: discountKind,
              discount_value: discountValue,
              max_uses: maxUses,
              created_by: authData.user.id,
            } as any).select("id").single();
        if (insertError || !inserted) throw insertError ?? new Error("Code non enregistré");
        const newPromo: PromoCodeItem = { id: inserted.id, code: cleanCode, discountValue, discountKind, usedCount: 0, maxUses, isActive: true };

        setPromos((prev) => [newPromo, ...prev]);
        setPromoPage(1);
        setShowPromoModal(false);
        setCode("");
        setSuccess(`Code promo ${cleanCode} créé avec succès !`);
      } catch {
        setError("Erreur lors de la création du code promo.");
      }
    });
  }

  function handleSendAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!announcement.trim() || !eventId) {
      setError("Choisis un événement et saisis le texte de l'annonce.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: salon, error: salonsError } = await supabase.from("salons").select("id").eq("event_id", eventId).maybeSingle();
        if (salonsError || !salon) throw salonsError ?? new Error("Aucun salon lié à cet événement");
        const { error: postError } = await supabase.from("posts").insert({
            salon_id: salon.id,
            content: announcement.trim(),
            kind: "announcement",
            is_pinned: true,
          } as any);
        if (postError) throw postError;

        setAnnouncement("");
        setSuccess("Annonce diffusée avec succès dans le salon d'événement !");
      } catch {
        setError("Erreur lors de la diffusion de l'annonce.");
      }
    });
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Marketing & Codes Promo</h1>
          <p className="text-sm text-fg-muted">
            Boostez les ventes avec des réductions ciblées et des annonces de salon.
          </p>
        </div>
        <Button onClick={() => setShowPromoModal(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 size-4" /> Créer un code promo
        </Button>
      </div>

      {success ? (
        <Alert tone="success" title="Action réussie">
          {success}
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="danger" title="Erreur" floating onDismiss={() => setError(null)}>
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

      <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="size-4 text-primary" /> Codes Promo Actifs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {promos.length === 0 ? <p className="text-sm text-fg-muted">Aucun code promotionnel enregistré.</p> : null}
            {pagePromos.map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                <div>
                  <span className="font-mono font-bold text-fg">{p.code}</span>
                  <p className="text-xs text-fg-muted">
                    {p.discountKind === "percentage" ? `${p.discountValue}%` : `${p.discountValue} FCFA`} de réduction · {p.usedCount}/{p.maxUses ?? "∞"} utilisés
                  </p>
                </div>
                <Badge variant="success">Actif</Badge>
              </div>
            ))}
            {promos.length > PROMOS_PER_PAGE ? (
              <nav aria-label="Pagination des codes promo" className="flex items-center justify-between gap-3 border-t border-border pt-3">
                <p className="text-xs text-fg-muted" role="status" aria-live="polite">{(currentPromoPage - 1) * PROMOS_PER_PAGE + 1}–{Math.min(currentPromoPage * PROMOS_PER_PAGE, promos.length)} sur {promos.length}</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPromoPage((value) => Math.max(1, value - 1))} disabled={currentPromoPage === 1} aria-label="Page précédente" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border disabled:opacity-45"><ArrowLeft className="size-4" aria-hidden="true" /></button>
                  <span className="text-xs tabular-nums text-fg-muted">{currentPromoPage}/{promoPageCount}</span>
                  <button type="button" onClick={() => setPromoPage((value) => Math.min(promoPageCount, value + 1))} disabled={currentPromoPage === promoPageCount} aria-label="Page suivante" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border disabled:opacity-45"><ArrowRight className="size-4" aria-hidden="true" /></button>
                </div>
              </nav>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="size-4 text-primary" /> Annonce de Salon
            </CardTitle>
            <CardDescription>Envoyez un message épinglé dans le salon d&apos;un événement.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <form onSubmit={handleSendAnnouncement} className="space-y-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-fg">Événement *</span>
                <select required value={eventId} onChange={(e) => setEventId(e.target.value)} className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm">
                  <option value="">Choisir un événement</option>
                  {events.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </label>
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
