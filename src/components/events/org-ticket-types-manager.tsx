"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Plus, Ticket } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccessLevelBadge as AccessBadge } from "@/components/ui/badge";
import { Alert, EmptyState } from "@/components/ui/states";
import { formatPrice } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface TicketTypeItem {
  id: string;
  eventId?: string;
  eventName?: string;
  name: string;
  description?: string | null;
  price: number;
  quantity: number;
  soldCount?: number;
  accessLevel: "standard" | "vip" | "vvip";
  isActive?: boolean;
}

const PAGE_SIZE = 6;

export function OrgTicketTypesManager({
  initialTickets = [],
  events = [],
}: {
  initialTickets?: TicketTypeItem[];
  events?: { id: string; title: string }[];
}) {
  const [tickets, setTickets] = useState<TicketTypeItem[]>(initialTickets);
  const [showModal, setShowModal] = useState(false);
  const [filterEventId, setFilterEventId] = useState("");
  const [page, setPage] = useState(1);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(5000);
  const [quantity, setQuantity] = useState(100);
  const [accessLevel, setAccessLevel] = useState<"standard" | "vip" | "vvip">("standard");
  const [eventId, setEventId] = useState(events[0]?.id ?? "");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const filteredTickets = filterEventId ? tickets.filter((ticket) => ticket.eventId === filterEventId) : tickets;
  const pageCount = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageTickets = filteredTickets.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Veuillez indiquer un nom de formule (ex: Pass Standard).");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        if (!eventId) throw new Error("Choisis un événement avant de créer la formule.");
        const supabase = createSupabaseBrowserClient();
        const { data: inserted, error: insertError } = await supabase.from("ticket_types").insert({
          event_id: eventId,
          name: name.trim(),
          description: description.trim() || null,
          price: Number(price),
          quantity: Number(quantity),
          access_level: accessLevel,
          is_active: true,
          covers_salon: true,
        } as any).select("id").single();
        if (insertError || !inserted) throw insertError ?? new Error("Création impossible");

        const newTicket: TicketTypeItem = {
          id: inserted.id,
          eventId,
          eventName: events.find((event) => event.id === eventId)?.title,
          name: name.trim(),
          description: description.trim() || null,
          price: Number(price) || 0,
          quantity: Number(quantity) || 50,
          soldCount: 0,
          accessLevel,
          isActive: true,
        };

        // Enregistrer via Supabase si connecté
        setTickets((prev) => [...prev, newTicket]);
        setFilterEventId(eventId);
        setPage(Math.ceil((tickets.length + 1) / PAGE_SIZE));
        setShowModal(false);
        setName("");
        setDescription("");
        setSuccess("Nouvelle formule de billet créée avec succès !");
      } catch {
        setError("Erreur lors de la création de la formule.");
      }
    });
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Gestion de la Billetterie</h1>
          <p className="text-sm text-fg-muted">
            Visualisez et gérez les formules de billets, tarifs en FCFA et quotas configurés.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 size-4" /> Créer une formule
        </Button>
      </div>

      {error ? (
        <Alert tone="danger" title="Erreur" floating onDismiss={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {success ? (
        <Alert tone="success" title="Succès">
          {success}
        </Alert>
      ) : null}

      {showModal ? (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Ajouter une formule de billet</CardTitle>
            <CardDescription>
              Configurez le tarif, le nombre de places et les privilèges d&apos;accès.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-fg">Événement *</label>
                  <select required value={eventId} onChange={(e) => setEventId(e.target.value)} disabled={!events.length} className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm">
                    <option value="">Choisir un événement</option>
                    {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-fg">Nom de la formule *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Pass VIP Networking, Entrée Standard"
                    className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">Tarif (FCFA) *</label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                  />
                  <p className="text-[11px] text-fg-muted">0 FCFA = Billet Gratuit</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">Quota / Quantité *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-fg">Niveau d&apos;Accès</label>
                  <select
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value as any)}
                    className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                  >
                    <option value="standard">Standard (Accès général)</option>
                    <option value="vip">VIP (Accès privilégié / salon)</option>
                    <option value="vvip">VVIP (Accès total & coulisses)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg">Description & Avantages</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ex: Accès buffet, badge VIP et place réservée"
                  className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" loading={pending} loadingLabel="Création...">
                  Enregistrer la formule
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {tickets.length === 0 ? (
        <EmptyState
          icon={<Ticket className="size-6 text-fg-muted" />}
          title="Aucune formule de billet configurée"
          description="Créez votre première formule de billet ou créez un événement pour provisionner automatiquement la billetterie."
          action={
            <Button onClick={() => setShowModal(true)}>
              <Plus className="mr-2 size-4" /> Créer une formule
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {events.length > 1 ? (
            <label className="block sm:max-w-sm">
              <span className="mb-1 block text-xs font-semibold text-fg-muted">Filtrer par événement</span>
              <select value={filterEventId} onChange={(event) => { setFilterEventId(event.target.value); setPage(1); }} className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm">
                <option value="">Tous les événements</option>
                {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
              </select>
            </label>
          ) : null}
          {filteredTickets.length ? <div className="grid gap-3 sm:grid-cols-2">
          {pageTickets.map((t) => (
            <Card key={t.id} className="overflow-hidden rounded-lg">
              <CardHeader className="flex flex-col items-start justify-between gap-2 p-3 sm:p-4 sm:pb-3 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <CardTitle className="text-lg">{t.name}</CardTitle>
                    <AccessBadge level={t.accessLevel} />
                  </div>
                  {t.eventName ? (
                    <p className="mt-0.5 text-xs font-medium text-primary flex items-center gap-1">
                      <Ticket className="size-3" /> {t.eventName}
                    </p>
                  ) : null}
                  {t.description ? (
                    <CardDescription className="mt-1">{t.description}</CardDescription>
                  ) : null}
                </div>
                <p className="font-display text-xl font-bold text-fg sm:shrink-0">{formatPrice(t.price)}</p>
              </CardHeader>
              <CardContent className="flex flex-col items-start justify-between gap-2 border-t border-border p-3 pt-3 text-xs text-fg-muted sm:flex-row sm:items-center sm:p-4 sm:pt-3">
                <span>
                  Quota : <strong>{t.quantity} places</strong> ({t.soldCount ?? 0} vendues)
                </span>
                <span className={t.isActive !== false ? "text-success font-medium" : "text-fg-muted"}>
                  {t.isActive !== false ? "En vente" : "Inactive"}
                </span>
              </CardContent>
            </Card>
          ))}
          </div> : <p className="rounded-lg border border-border bg-surface p-4 text-sm text-fg-muted">Aucune formule pour cet événement.</p>}
          {filteredTickets.length > PAGE_SIZE ? (
            <nav aria-label="Pagination des formules de billets" className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <p className="text-xs text-fg-muted" role="status" aria-live="polite">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredTickets.length)} sur {filteredTickets.length}</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} aria-label="Page précédente" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border disabled:opacity-45"><ArrowLeft className="size-4" aria-hidden="true" /></button>
                <span className="text-xs tabular-nums text-fg-muted">{currentPage}/{pageCount}</span>
                <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} aria-label="Page suivante" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border disabled:opacity-45"><ArrowRight className="size-4" aria-hidden="true" /></button>
              </div>
            </nav>
          ) : null}
        </div>
      )}
    </div>
  );
}
