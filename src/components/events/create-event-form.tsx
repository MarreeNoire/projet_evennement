"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle2, Plus, Trash2, Ticket } from "lucide-react";

import { EventImagesManager, type PendingImage } from "./event-images-manager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/states";
import { CATEGORIES } from "@/lib/constants";
import { saveEventDraftAction, updateEventCoverAction, updateEventGalleryAction } from "@/lib/events/actions";
import { uploadEventCover } from "@/lib/events/upload-cover";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface TicketDraft {
  name: string;
  description: string;
  price: number | "";
  quantity: number | "";
  accessLevel: "standard" | "vip" | "vvip";
}

const DEFAULT_TICKET_DRAFTS: TicketDraft[] = [
  {
    name: "Pass Standard",
    description: "Accès général à l'événement et aux conférences.",
    price: "",
    quantity: "",
    accessLevel: "standard",
  },
];

export function CreateEventForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]?.slug ?? "technologie");
  const [city, setCity] = useState("Abidjan");
  const [venueName, setVenueName] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  // Billetterie intégrée
  const [tickets, setTickets] = useState<TicketDraft[]>(DEFAULT_TICKET_DRAFTS);

  // Images : choisies avant l'enregistrement, envoyées juste après la création
  // (la RLS du bucket `event-covers` exige que l'événement existe déjà).
  const [pendingCover, setPendingCover] = useState<PendingImage | null>(null);
  const [pendingGallery, setPendingGallery] = useState<PendingImage[]>([]);
  const [uploadState, setUploadState] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [recoveryHref, setRecoveryHref] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  /**
   * Par défaut l'événement est publié : c'est la seule façon de le voir
   * apparaître dans Explorer (la vue publique exclut les brouillons).
   */
  const [publishNow, setPublishNow] = useState(true);

  function handleAddTicket() {
    setTickets((prev) => [
      ...prev,
      {
        name: prev.length === 1 ? "Pass VIP" : `Formule #${prev.length + 1}`,
        description: "",
        price: "",
        quantity: "",
        accessLevel: prev.length === 1 ? "vip" : "standard",
      },
    ]);
  }

  function handleRemoveTicket(index: number) {
    if (tickets.length <= 1) {
      setError("Vous devez définir au moins une formule de billet pour l'événement.");
      return;
    }
    setTickets((prev) => prev.filter((_, i) => i !== index));
  }

  function handleUpdateTicket<K extends keyof TicketDraft>(
    index: number,
    field: K,
    value: TicketDraft[K],
  ) {
    setTickets((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index]!, [field]: value };
      return copy;
    });
  }

  /** Redirige vers la liste des événements une fois l'enregistrement terminé. */
  function redirectToEvents(delay = 900) {
    setTimeout(() => {
      router.push("/org/evenements");
      router.refresh();
    }, delay);
  }

  async function savePendingImages(eventId: string, publishAfterCover: boolean): Promise<string | null> {
    if (!pendingCover) return "Ajoutez une image de couverture avant d’enregistrer l’événement.";

    setUploadState("Envoi des images…");
    try {
      let coverUrl: string | null = null;
      const galleryUrls: string[] = [];

      const coverUpload = await uploadEventCover(pendingCover.file, eventId);
      if (!coverUpload.ok || !coverUpload.url) {
        return coverUpload.error ?? "L’image de couverture n’a pas pu être envoyée.";
      }
      coverUrl = coverUpload.url;

      for (const item of pendingGallery) {
        const upload = await uploadEventCover(item.file, eventId);
        if (!upload.ok || !upload.url) {
          return upload.error ?? "Une image de la galerie n’a pas pu être envoyée.";
        }
        galleryUrls.push(upload.url);
      }

      if (galleryUrls.length > 0) {
        const result = await updateEventGalleryAction(eventId, galleryUrls);
        if (!result.ok) return result.error ?? "La galerie n’a pas pu être associée à l’événement.";
      }

      const coverResult = await updateEventCoverAction(eventId, coverUrl, publishAfterCover);
      if (!coverResult.ok) {
        return coverResult.error ?? "La couverture n’a pas pu être associée à l’événement.";
      }

      return null;
    } catch (uploadError: unknown) {
      return uploadError instanceof Error
        ? uploadError.message
        : "Les images n’ont pas pu être enregistrées.";
    } finally {
      setUploadState(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Veuillez renseigner le titre de l'événement.");
      return;
    }

    if (!startAt) {
      setError("Veuillez indiquer au moins la date et l'heure de début.");
      return;
    }

    if (!pendingCover) {
      setError("Ajoutez une image de couverture avant de créer l’événement, même pour l’enregistrer en brouillon.");
      return;
    }

    // Validation des formules de billets
    if (tickets.length === 0) {
      setError("Veuillez configurer au moins une formule de billet.");
      return;
    }

    for (let i = 0; i < tickets.length; i++) {
      const t = tickets[i]!;
      if (!t.name.trim()) {
        setError(`Veuillez donner un nom à la formule de billet n°${i + 1}.`);
        return;
      }
      if (t.price === "" || !Number.isFinite(t.price) || t.price < 0) {
        setError(`Veuillez saisir un prix valide pour la formule "${t.name}" (0 si elle est gratuite).`);
        return;
      }
      if (t.quantity === "" || !Number.isInteger(t.quantity) || t.quantity < 1) {
        setError(`Veuillez saisir un quota entier supérieur à 0 pour la formule "${t.name}".`);
        return;
      }
    }

    // Explorer n'affiche que les événements dont la fin est à venir : on bloque
    // tout de suite une date passée, au lieu de créer un événement invisible.
    const endValue = endAt || startAt;
    if (new Date(endValue).getTime() <= Date.now()) {
      setError(
        "La date de fin doit être dans le futur : Explorer n'affiche que les événements à venir.",
      );
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        // 1. Tenter l'action serveur avec les billets
        const res = await saveEventDraftAction({
          title,
          category,
          city,
          venueName,
          description,
          startAt,
          endAt,
          tickets: tickets.map((t) => ({
            name: t.name,
            description: t.description || undefined,
            price: Number(t.price),
            quantity: Number(t.quantity),
            accessLevel: t.accessLevel,
          })),
        });

        if (res.ok) {
          if (res.eventId) {
            const imageError = await savePendingImages(res.eventId, publishNow);
            if (imageError) {
              setRecoveryHref(`/org/evenements/${res.eventId}`);
              setError(`L’événement a été enregistré en brouillon, mais sa couverture n’a pas pu être enregistrée${publishNow ? " ou il n’a pas pu être publié" : ""} : ${imageError}`);
              return;
            }
          }

          setSuccess(
            publishNow
              ? "Votre événement et sa billetterie sont publiés : ils apparaissent maintenant dans Explorer."
              : "Votre événement a été enregistré comme brouillon avec sa billetterie.",
          );
          redirectToEvents();
          return;
        }

        console.warn("[CreateEventForm] Action serveur a échoué, tentative via le client Supabase:", res.error);

        // 2. Stratégie de secours : Client Supabase du navigateur direct
        const supabase = createSupabaseBrowserClient();
        const { data: authData } = await supabase.auth.getUser();

        if (authData?.user) {
          const user = authData.user;
          const slugBase = title
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-") || "evenement";
          const slug = `${slugBase}-${Math.floor(1000 + Math.random() * 9000)}`;

          // Récupérer ou créer l'organisation
          const { data: org } = await supabase
            .from("organizations")
            .select("id")
            .eq("owner_id", user.id)
            .maybeSingle();

          let orgId = org?.id;

          if (!orgId) {
            const { data: newOrg } = await supabase
              .from("organizations")
              .insert({
                owner_id: user.id,
                name: `Organisation ${user.email || "Evenement"}`,
                slug: `org-${Math.floor(1000 + Math.random() * 9000)}`,
              } as any)
              .select("id")
              .single();
            orgId = newOrg?.id;
          }

          if (orgId) {
            const startAtIso = new Date(startAt).toISOString();
            const endAtIso = endAt
              ? new Date(endAt).toISOString()
              : new Date(new Date(startAt).getTime() + 2 * 3600 * 1000).toISOString();

            const { data: createdEvent, error: insertErr } = await supabase
              .from("events")
              .insert({
                organization_id: orgId,
                created_by: user.id,
                title: title.trim(),
                slug,
                category,
                city: city.trim() || "Abidjan",
                venue_name: venueName.trim() || null,
                address: venueName.trim() || null,
                description: description.trim() || null,
                start_at: startAtIso,
                end_at: endAtIso,
                status: "draft",
                published_at: null,
                salon_privacy: "members",
                currency: "XOF",
                min_price: 0,
                max_price: 0,
              } as any)
              .select("id")
              .single();

            if (!insertErr && createdEvent) {
              // Insérer les billets
              const ticketRows = tickets.map((t, idx) => ({
                event_id: createdEvent.id,
                name: t.name.trim(),
                description: t.description.trim() || null,
                price: Math.max(0, Math.round(Number(t.price) || 0)),
                quantity: Math.max(1, Math.round(Number(t.quantity) || 50)),
                access_level: t.accessLevel,
                position: idx,
                is_active: true,
                covers_salon: true,
              }));

              await supabase.from("ticket_types").insert(ticketRows as any);

              const imageError = await savePendingImages(createdEvent.id, publishNow);
              if (imageError) {
                setRecoveryHref(`/org/evenements/${createdEvent.id}`);
                setError(`L’événement a été enregistré en brouillon, mais les images n’ont pas été sauvegardées : ${imageError}`);
                return;
              }

              setSuccess(
                publishNow
                  ? "Votre événement et sa billetterie sont publiés : ils apparaissent maintenant dans Explorer."
                  : "Votre événement a été enregistré comme brouillon avec sa billetterie.",
              );
              redirectToEvents();
              return;
            }
          }
        }

        // 3. Fallback stockage local (si déconnecté / mode démo)
        const localDrafts = JSON.parse(localStorage.getItem("rassemble_draft_events") || "[]");
        localDrafts.unshift({
          id: `draft-${Date.now()}`,
          title: title.trim(),
          category,
          city: city.trim() || "Abidjan",
          venue_name: venueName.trim() || "À déterminer",
          description: description.trim(),
          start_at: startAt,
          end_at: endAt,
          status: "draft",
          tickets,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem("rassemble_draft_events", JSON.stringify(localDrafts));

        setSuccess(
          "Enregistré localement (hors ligne) : l'événement devra être recréé en ligne pour être publié.",
        );
        redirectToEvents();
      } catch (err: any) {
        console.error("[CreateEventForm] Client save error:", err);
        setError("Erreur lors de l'enregistrement de l'événement. Veuillez réessayer.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <Alert tone="danger" title="Erreur de validation" floating onDismiss={() => setError(null)}>
          <div className="space-y-2">
            <p>{error}</p>
            {recoveryHref ? (
              <ButtonLink href={recoveryHref} variant="secondary" size="sm">
                Ouvrir la fiche de l’événement
              </ButtonLink>
            ) : null}
          </div>
        </Alert>
      ) : null}

      {success ? (
        <Alert tone="success" title={publishNow ? "Événement publié" : "Brouillon enregistré"}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-success" />
            <span>{success} Redirection…</span>
          </div>
        </Alert>
      ) : null}

      {uploadState ? (
        <p role="status" className="text-xs font-medium text-fg-muted">
          {uploadState}
        </p>
      ) : null}

      {/* Illustrations : couverture + galerie. Les fichiers sont gardés en
          mémoire puis envoyés vers `event-covers` après la création. */}
      <EventImagesManager
        mode="create"
        pendingCover={pendingCover}
        pendingGallery={pendingGallery}
        onPendingCoverChange={setPendingCover}
        onPendingGalleryChange={setPendingGallery}
      />

      {/* Informations Générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Générales</CardTitle>
          <CardDescription>Titre, catégorie et description de l'événement.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-xs font-semibold text-fg">
              Titre de l'événement *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Abidjan Tech Forum 2026"
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="category" className="text-xs font-semibold text-fg">
                Catégorie *
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="city" className="text-xs font-semibold text-fg">
                Ville *
              </label>
              <input
                id="city"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="ex: Abidjan"
                className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="venueName" className="text-xs font-semibold text-fg">
              Lieu / Adresse précise
            </label>
            <input
              id="venueName"
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="ex: Sofitel Hôtel Ivoire, Cocody"
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="text-xs font-semibold text-fg">
              Description détaillée
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Présentez le programme, les intervenants et le déroulement…"
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Dates et Horaires */}
      <Card>
        <CardHeader>
          <CardTitle>Dates et Horaires</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="startAt" className="text-xs font-semibold text-fg">
              Date & Heure de début *
            </label>
            <input
              id="startAt"
              type="datetime-local"
              required
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="endAt" className="text-xs font-semibold text-fg">
              Date & Heure de fin
            </label>
            <input
              id="endAt"
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Billetterie & Formules de billets */}
      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-3 pb-3 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Ticket className="size-5 text-primary" /> Billetterie & Tarifs
            </CardTitle>
            <CardDescription>
              Définissez les formules de billets disponibles (gratuit ou payant en FCFA).
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full shrink-0 sm:w-auto"
            onClick={handleAddTicket}
            disabled={pending || Boolean(success)}
          >
            <Plus className="mr-1.5 size-4" /> Ajouter une formule
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {tickets.map((ticket, index) => (
            <div
              key={index}
              className="relative rounded-lg border border-border bg-surface-raised/40 p-4 space-y-3 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Formule #{index + 1}
                </span>
                {tickets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTicket(index)}
                    className="text-fg-muted hover:text-danger text-xs flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="size-3.5" /> Supprimer
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-fg">Nom de la formule *</label>
                  <input
                    type="text"
                    required
                    value={ticket.name}
                    onChange={(e) => handleUpdateTicket(index, "name", e.target.value)}
                    placeholder="ex: Pass Général, Entrée Libre, Pass VIP"
                    className="w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-fg">Prix (FCFA)</label>
                  <input
                    type="number"
                    step={1}
                    value={ticket.price}
                    onChange={(e) => handleUpdateTicket(index, "price", e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                  />
                  <p className="text-[11px] text-fg-muted">0 = Gratuit</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-fg">Quota (Places) *</label>
                  <input
                    type="number"
                    step={1}
                    value={ticket.quantity}
                    onChange={(e) => handleUpdateTicket(index, "quantity", e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-fg">Niveau d'accès</label>
                  <select
                    value={ticket.accessLevel}
                    onChange={(e) =>
                      handleUpdateTicket(index, "accessLevel", e.target.value as "standard" | "vip" | "vvip")
                    }
                    className="w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                  >
                    <option value="standard">Standard (Accès général)</option>
                    <option value="vip">VIP (Accès salon / loge)</option>
                    <option value="vvip">VVIP (Accès total & coulisses)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-fg">Description & Avantages (optionnel)</label>
                  <input
                    type="text"
                    value={ticket.description}
                    onChange={(e) => handleUpdateTicket(index, "description", e.target.value)}
                    placeholder="ex: Accès cocktail, rang premium, goodies exclusifs"
                    className="w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Publication */}
      <Card>
        <CardContent className="flex items-start gap-3 pt-5">
          <input
            id="publishNow"
            type="checkbox"
            checked={publishNow}
            onChange={(e) => setPublishNow(e.target.checked)}
            disabled={pending || Boolean(success)}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          <div>
            <label htmlFor="publishNow" className="text-sm font-semibold text-fg">
              Publier immédiatement dans Explorer et ouvrir la billetterie
            </label>
            <p className="mt-0.5 text-xs text-fg-muted">
              Seuls les événements publiés et à venir apparaissent dans Explorer. Les visiteurs pourront
              immédiatement commander des billets dès la création.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <ButtonLink href="/org/evenements" variant="secondary">
          Annuler
        </ButtonLink>
        <Button
          type="submit"
          className="w-full sm:w-auto"
          loading={pending}
          loadingLabel="Enregistrement..."
          disabled={Boolean(success || recoveryHref)}
        >
          <Save className="mr-2 size-4" />
          {publishNow ? "Créer l'événement et sa billetterie" : "Enregistrer le brouillon"}
        </Button>
      </div>
    </form>
  );
}
