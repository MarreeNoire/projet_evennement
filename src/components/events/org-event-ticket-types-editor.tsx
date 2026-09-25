"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Edit2, Ticket, Check, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccessLevelBadge } from "@/components/ui/badge";
import { Alert, EmptyState } from "@/components/ui/states";
import { formatPrice } from "@/lib/utils";
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

  function startEdit(ticket: EventTicketItem) {
    setEditingId(ticket.id);
    setEditName(ticket.name);
    setEditPrice(ticket.price);
    setEditQuantity(ticket.quantity);
    setEditAccessLevel(ticket.accessLevel);
    setEditDescription(ticket.description || "");
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
        price: Number(price) || 0,
        quantity: Number(quantity) || 1,
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
      setError("Le nom ne peut pas être vide.");
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await updateTicketTypeAction({
        ticketId,
        name: editName.trim(),
        price: Number(editPrice) || 0,
        quantity: Number(editQuantity) || 1,
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
                price: Number(editPrice) || 0,
                quantity: Number(editQuantity) || 1,
                accessLevel: editAccessLevel,
                description: editDescription.trim() || null,
              }
            : t
        )
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
        setError(res.error || "Impossible de supprimer la formule (des billets ont peut-être déjà été émis).");
        return;
      }

      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      setSuccess("Formule supprimée avec succès.");
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Ticket className="size-5 text-primary" /> Formules de Billetterie
          </CardTitle>
          <CardDescription>
            Gérez les tarifs, quotas et privilèges d&apos;accès spécifiques à cet événement.
          </CardDescription>
        </div>
        {!showAddForm && (
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="mr-1 size-4" /> Ajouter une formule
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
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

        {showAddForm && (
          <form onSubmit={handleCreateTicket} className="p-4 rounded-lg border border-primary/40 bg-surface space-y-3">
            <p className="font-medium text-sm text-fg">Nouvelle formule de billet</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-fg">Nom de la formule *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Pass VIP, Accès Early Bird"
                  className="w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-fg">Tarif (FCFA) *</label>
                <input
                  type="number"
                  min={0}
                  step={500}
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-fg">Quota de places *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-fg">Niveau d&apos;Accès</label>
                <select
                  value={accessLevel}
                  onChange={(e) => setAccessLevel(e.target.value as any)}
                  className="w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                >
                  <option value="standard">Standard (Accès général)</option>
                  <option value="vip">VIP (Accès privilégié / salon)</option>
                  <option value="vvip">VVIP (Accès total & coulisses)</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-fg">Description & Avantages</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ex: Cocktail de bienvenue, coupe-file"
                  className="w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => setShowAddForm(false)}>
                Annuler
              </Button>
              <Button type="submit" size="sm" loading={isPending} loadingLabel="Enregistrement...">
                Enregistrer la formule
              </Button>
            </div>
          </form>
        )}

        {tickets.length === 0 ? (
          <EmptyState
            icon={<Ticket className="size-6 text-fg-muted" />}
            title="Aucune formule configurée pour cet événement"
            description="Créez des formules pour permettre aux participants d&apos;acheter ou réserver leurs places."
            action={
              <Button size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="mr-1 size-4" /> Créer une formule
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-border border rounded-lg overflow-hidden">
            {tickets.map((t) => (
              <div key={t.id} className="p-3 sm:p-4 bg-surface hover:bg-surface-elevated/40 transition-colors">
                {editingId === t.id ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-semibold text-fg">Nom de la formule *</label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm focus:border-border-focus focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-fg">Tarif (FCFA) *</label>
                        <input
                          type="number"
                          min={0}
                          step={500}
                          required
                          value={editPrice}
                          onChange={(e) => setEditPrice(Number(e.target.value))}
                          className="w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm focus:border-border-focus focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-fg">Quota *</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(Number(e.target.value))}
                          className="w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm focus:border-border-focus focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-semibold text-fg">Niveau d&apos;Accès</label>
                        <select
                          value={editAccessLevel}
                          onChange={(e) => setEditAccessLevel(e.target.value as any)}
                          className="w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm focus:border-border-focus focus:outline-none"
                        >
                          <option value="standard">Standard</option>
                          <option value="vip">VIP</option>
                          <option value="vvip">VVIP</option>
                        </select>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-semibold text-fg">Description</label>
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm focus:border-border-focus focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button size="sm" variant="secondary" onClick={cancelEdit}>
                        <X className="mr-1 size-3.5" /> Annuler
                      </Button>
                      <Button size="sm" loading={isPending} onClick={() => handleSaveEdit(t.id)}>
                        <Check className="mr-1 size-3.5" /> Sauvegarder
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-fg text-sm">{t.name}</span>
                        <AccessLevelBadge level={t.accessLevel} />
                        <span className="font-bold text-fg text-sm ml-1">{formatPrice(t.price)}</span>
                      </div>
                      {t.description && (
                        <p className="text-xs text-fg-muted">{t.description}</p>
                      )}
                      <p className="text-xs text-fg-subtle">
                        Quota : <strong>{t.quantity} places</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button size="sm" variant="secondary" onClick={() => startEdit(t)}>
                        <Edit2 className="size-3.5 mr-1" /> Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-danger hover:text-danger hover:bg-danger/10"
                        onClick={() => handleDeleteTicket(t.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
