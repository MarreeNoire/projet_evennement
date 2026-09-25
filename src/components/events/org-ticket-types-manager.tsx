"use client";

import { useState, useTransition } from "react";
import { Plus, Edit, Ticket } from "lucide-react";

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

export function OrgTicketTypesManager({
  initialTickets = [],
}: {
  initialTickets?: TicketTypeItem[];
}) {
  const [tickets, setTickets] = useState<TicketTypeItem[]>(initialTickets);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(5000);
  const [quantity, setQuantity] = useState(100);
  const [accessLevel, setAccessLevel] = useState<"standard" | "vip" | "vvip">("standard");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Veuillez indiquer un nom de formule (ex: Pass Standard).");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const newTicket: TicketTypeItem = {
          id: `ticket-${Date.now()}`,
          name: name.trim(),
          description: description.trim() || null,
          price: Number(price) || 0,
          quantity: Number(quantity) || 50,
          soldCount: 0,
          accessLevel,
          isActive: true,
        };

        // Enregistrer via Supabase si connecté
        const supabase = createSupabaseBrowserClient();
        const { data: authData } = await supabase.auth.getUser();

        if (authData?.user) {
          const { data: events } = await supabase
            .from("events")
            .select("id, title")
            .order("created_at", { ascending: false })
            .limit(1);

          const latestEvent = events?.[0];
          if (latestEvent) {
            newTicket.eventId = latestEvent.id;
            newTicket.eventName = latestEvent.title;

            await supabase.from("ticket_types").insert({
              event_id: latestEvent.id,
              name: name.trim(),
              description: description.trim() || null,
              price: Number(price) || 0,
              quantity: Number(quantity) || 50,
              access_level: accessLevel,
              is_active: true,
              covers_salon: true,
            } as any);
          }
        }

        setTickets((prev) => [...prev, newTicket]);
        setShowModal(false);
        setName("");
        setDescription("");
        setSuccess("Nouvelle formule de billet créée avec succès !");
      } catch (err: any) {
        setError("Erreur lors de la création de la formule.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Gestion de la Billetterie</h1>
          <p className="text-sm text-fg-muted">
            Visualisez et gérez les formules de billets, tarifs en FCFA et quotas configurés.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 size-4" /> Créer une formule
        </Button>
      </div>

      {error ? (
        <Alert tone="danger" title="Erreur">
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
        <div className="grid gap-4">
          {tickets.map((t) => (
            <Card key={t.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
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
                <p className="font-display text-xl font-bold text-fg">{formatPrice(t.price)}</p>
              </CardHeader>
              <CardContent className="border-t border-border pt-4 flex items-center justify-between text-xs text-fg-muted">
                <span>
                  Quota : <strong>{t.quantity} places</strong> ({t.soldCount ?? 0} vendues)
                </span>
                <span className={t.isActive !== false ? "text-success font-medium" : "text-fg-muted"}>
                  {t.isActive !== false ? "En vente" : "Inactive"}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
