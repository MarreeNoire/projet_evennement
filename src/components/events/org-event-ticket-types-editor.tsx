"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Edit2, Ticket, Check, X, Sparkles, Layers, AlertCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccessLevelBadge } from "@/components/ui/badge";
import { Alert, EmptyState } from "@/components/ui/states";
import { Field, Input, Select } from "@/components/ui/field";
import { formatNumber, formatPrice, cn } from "@/lib/utils";
import {
  createTicketTypeAction,
  updateTicketTypeAction,
  deleteTicketTypeAction,
} from "@/lib/events/actions";

export interface EventTicketItem {
  id: string;
  eventId: string;
  name: string;
  description?: string | null;
  price: number;
  quantity: number;
  accessLevel: "standard" | "vip" | "vvip";
  isActive?: boolean;
}

export function OrgEventTicketTypesEditor({
  eventId,
  initialTickets = [],
}: {
  eventId: string;
  initialTickets: EventTicketItem[];
}) {
  const [tickets, setTickets] = useState<EventTicketItem[]>(initialTickets);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New ticket state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(5000);
  const [quantity, setQuantity] = useState(100);
  const [accessLevel, setAccessLevel] = useState<"standard" | "vip" | "vvip">("standard");

  // Edit ticket state
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState(0);
  const [editQuantity, setEditQuantity] = useState(0);
  const [editAccessLevel, setEditAccessLevel] = useState<"standard" | "vip" | "vvip">("standard");
  const [editDescription, setEditDescription] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalCapacity = tickets.reduce((acc, t) => acc + (Number(t.quantity) || 0), 0);
  const totalPotentialRevenue = tickets.reduce(
    (acc, t) => acc + (Number(t.price) || 0) * (Number(t.quantity) || 0),
    0,
  );

  function startEdit(ticket: EventTicketItem) {
    setEditingId(ticket.id);
    setEditName(ticket.name);
    setEditPrice(ticket.price);
    setEditQuantity(ticket.quantity);
    setEditAccessLevel(ticket.accessLevel);
    setEditDescription(ticket.description || "");
    setShowAddForm(false);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Veuillez indiquer un nom pour la formule.");
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await createTicketTypeAction({
        eventId,
        name: name.trim(),
        price: Math.max(0, Number(price) || 0),
        quantity: Math.max(1, Number(quantity) || 1),
        accessLevel,
        description: description.trim() || undefined,
      });

      if (!res.ok || !res.ticket) {
        setError(res.error || "Impossible de créer la formule.");
        return;
      }

      setTickets((prev) => [
        ...prev,
        {
          id: res.ticket.id,
          eventId: res.ticket.event_id,
          name: res.ticket.name,
          description: res.ticket.description,
          price: res.ticket.price,
          quantity: res.ticket.quantity,
          accessLevel: res.ticket.access_level,
          isActive: res.ticket.is_active,
        },
      ]);

      setShowAddForm(false);
      setName("");
      setDescription("");
      setPrice(5000);
      setQuantity(100);
      setSuccess("Formule ajoutée avec succès !");
    });
  }

  function handleSaveEdit(ticketId: string) {
    if (!editName.trim()) {
      setError("Le nom de la formule ne peut pas être vide.");
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await updateTicketTypeAction({
        ticketId,
        name: editName.trim(),
        price: Math.max(0, Number(editPrice) || 0),
        quantity: Math.max(1, Number(editQuantity) || 1),
        accessLevel: editAccessLevel,
        description: editDescription.trim() || undefined,
      });

      if (!res.ok) {
        setError(res.error || "Impossible de modifier la formule.");
        return;
      }

      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                name: editName.trim(),
                price: Math.max(0, Number(editPrice) || 0),
                quantity: Math.max(1, Number(editQuantity) || 1),
                accessLevel: editAccessLevel,
                description: editDescription.trim() || null,
              }
            : t,
        ),
      );

      setEditingId(null);
      setSuccess("Formule mise à jour avec succès !");
    });
  }

  function handleDeleteTicket(ticketId: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette formule de billet ?")) {
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await deleteTicketTypeAction(ticketId);
      if (!res.ok) {
        setError(
          res.error ||
            "Impossible de supprimer la formule (des billets ont peut-être déjà été émis).",
        );
        return;
      }

      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      setSuccess("Formule supprimée avec succès.");
    });
  }

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="border-b border-border/70 p-5 sm:p-6 bg-surface/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2.5 text-lg sm:text-xl font-bold">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Ticket className="size-4" />
              </span>
              Formules de Billetterie
            </CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm">
              Configurez vos tarifs, quotas de places et niveaux d&apos;accès VIP pour cet événement.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {tickets.length > 0 && (
              <div className="hidden text-right lg:block pr-2">
                <p className="text-2xs text-fg-subtle font-medium uppercase tracking-wider">
                  Capacité cumulée
                </p>
                <p className="text-sm font-bold text-fg">
                  {formatNumber(totalCapacity)} places{" "}
                  <span className="text-xs font-normal text-fg-muted">
                    ({formatPrice(totalPotentialRevenue)})
                  </span>
                </p>
              </div>
            )}

            {!showAddForm && (
              <Button size="sm" onClick={() => setShowAddForm(true)} className="gap-1.5 shadow-sm">
                <Plus className="size-4" /> Ajouter une formule
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-5">
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

        {/* Formulaire d'ajout d'une nouvelle formule */}
        {showAddForm && (
          <div className="rounded-xl border border-primary/30 bg-gradient-to-b from-primary/5 via-surface to-surface p-5 sm:p-6 shadow-md transition-all">
            <div className="flex items-center justify-between border-b border-border/70 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h4 className="font-semibold text-sm sm:text-base text-fg">
                  Nouvelle formule de billet
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-fg-subtle hover:text-fg p-1 rounded-md transition-colors"
                aria-label="Fermer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nom de la formule"
                  required
                  hint="Ex: Pass Standard, VIP, Early Bird"
                  className="sm:col-span-2"
                >
                  <Input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Pass Conférence + Soirée VIP"
                  />
                </Field>

                <Field
                  label="Tarif unitaire (FCFA)"
                  required
                  hint="0 pour un billet gratuit"
                >
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step={500}
                      required
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-fg-subtle pointer-events-none">
                      FCFA
                    </span>
                  </div>
                </Field>

                <Field
                  label="Quota de places"
                  required
                  hint="Nombre max de billets disponibles"
                >
                  <Input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </Field>

                <Field
                  label="Niveau d'accès"
                  hint="Détermine les privilèges et badges au check-in"
                  className="sm:col-span-2"
                >
                  <Select
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value as "standard" | "vip" | "vvip")}
                  >
                    <option value="standard">Standard — Accès général à l&apos;événement</option>
                    <option value="vip">VIP — Accès coupe-file / salon privé</option>
                    <option value="vvip">VVIP — Accès illimité & coulisses</option>
                  </Select>
                </Field>

                <Field
                  label="Description & Avantages inclus"
                  hint="Optionnel : visible par les participants lors de l'achat"
                  className="sm:col-span-2"
                >
                  <Input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ex: Boisson de bienvenue offerte, badge nominatif, place assise réservée"
                  />
                </Field>
              </div>

              {/* Encadré indicateur de potentiel */}
              <div className="flex items-center justify-between rounded-lg bg-surface-raised px-4 py-3 border border-border text-xs text-fg-muted">
                <span>
                  Estimation de revenu pour cette formule :{" "}
                  <strong className="text-fg font-semibold">
                    {formatPrice(Math.max(0, price) * Math.max(0, quantity))}
                  </strong>
                </span>
                <span className="text-fg-subtle">
                  ({formatNumber(quantity)} billet{quantity > 1 ? "s" : ""})
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" size="sm" loading={isPending} loadingLabel="Enregistrement...">
                  <Check className="size-4 mr-1.5" /> Enregistrer la formule
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des formules de billets */}
        {tickets.length === 0 ? (
          <EmptyState
            icon={<Ticket className="text-primary size-7" />}
            title="Aucune formule de billet configurée"
            description="Créez vos tarifs et quotas pour permettre aux participants d'acheter ou de réserver leurs places sur votre événement."
            action={
              <Button size="sm" onClick={() => setShowAddForm(true)} className="gap-1.5">
                <Plus className="size-4" /> Créer une formule
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {tickets.map((t) => {
              const isEditing = editingId === t.id;
              const potential = t.price * t.quantity;

              if (isEditing) {
                return (
                  <div
                    key={t.id}
                    className="rounded-xl border border-primary/40 bg-surface p-5 sm:p-6 shadow-md transition-all space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <h4 className="font-semibold text-sm sm:text-base text-fg flex items-center gap-2">
                        <Edit2 className="size-4 text-primary" /> Modifier la formule « {t.name} »
                      </h4>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-fg-subtle hover:text-fg p-1 rounded-md"
                        aria-label="Annuler"
                      >
                        <X className="size-4" />
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Nom de la formule" required className="sm:col-span-2">
                        <Input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </Field>

                      <Field label="Tarif (FCFA)" required>
                        <div className="relative">
                          <Input
                            type="number"
                            min={0}
                            step={500}
                            required
                            value={editPrice}
                            onChange={(e) => setEditPrice(Number(e.target.value))}
                            className="pr-16"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-fg-subtle pointer-events-none">
                            FCFA
                          </span>
                        </div>
                      </Field>

                      <Field label="Quota de places" required>
                        <Input
                          type="number"
                          min={1}
                          required
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(Number(e.target.value))}
                        />
                      </Field>

                      <Field label="Niveau d'accès" className="sm:col-span-2">
                        <Select
                          value={editAccessLevel}
                          onChange={(e) =>
                            setEditAccessLevel(e.target.value as "standard" | "vip" | "vvip")
                          }
                        >
                          <option value="standard">Standard</option>
                          <option value="vip">VIP</option>
                          <option value="vvip">VVIP</option>
                        </Select>
                      </Field>

                      <Field label="Description & Avantages" className="sm:col-span-2">
                        <Input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                        />
                      </Field>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-2">
                      <Button size="sm" variant="secondary" onClick={cancelEdit}>
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        loading={isPending}
                        onClick={() => handleSaveEdit(t.id)}
                        className="gap-1.5"
                      >
                        <Check className="size-4" /> Mettre à jour
                      </Button>
                    </div>
                  </div>
                );
              }

              const accentBorderColor =
                t.accessLevel === "vvip"
                  ? "border-l-purple-500"
                  : t.accessLevel === "vip"
                    ? "border-l-amber-500"
                    : "border-l-primary";

              return (
                <div
                  key={t.id}
                  className={cn(
                    "group relative flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-xs transition-all hover:border-border-strong hover:shadow-sm sm:flex-row sm:items-center border-l-4",
                    accentBorderColor,
                  )}
                >
                  <div className="min-w-0 space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-display text-base sm:text-lg font-bold text-fg">
                        {t.name}
                      </span>
                      <AccessLevelBadge level={t.accessLevel} />
                    </div>

                    {t.description && (
                      <p className="text-xs text-fg-muted line-clamp-2 max-w-xl">
                        {t.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-subtle pt-1">
                      <span className="flex items-center gap-1 font-medium text-fg">
                        <Layers className="size-3.5 text-primary" />
                        {formatNumber(t.quantity)} places disponibles
                      </span>
                      <span>•</span>
                      <span>Potentiel : {formatPrice(potential)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center border-t border-border/60 pt-3 sm:border-t-0 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="font-display text-xl sm:text-2xl font-bold text-fg tabular-nums tracking-tight">
                        {t.price === 0 ? "Gratuit" : formatPrice(t.price)}
                      </p>
                      <p className="text-2xs text-fg-subtle">par participant</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => startEdit(t)}
                        className="h-8 gap-1 px-2.5 text-xs"
                      >
                        <Edit2 className="size-3.5" /> Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={isPending}
                        className="h-8 px-2 text-danger hover:bg-danger/10 hover:text-danger"
                        onClick={() => handleDeleteTicket(t.id)}
                        aria-label={`Supprimer la formule ${t.name}`}
                        title="Supprimer la formule"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
