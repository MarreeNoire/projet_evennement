"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Save,
  CheckCircle2,
  Eye,
  Globe,
  Lock,
  ImagePlus,
  Trash2,
  X,
  Loader2,
  Star,
  Calendar,
  MapPin,
  Tag,
  ChevronRight,
  Sliders,
  Image as ImageIcon,
  Ticket,
  Wallet,
  TrendingUp,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  QrCode,
  Sparkles,
  Info,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/states";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { OrgEventTicketTypesEditor, type EventTicketItem } from "./org-event-ticket-types-editor";
import { cn, formatNumber, formatPercent, formatPrice, formatDateRange } from "@/lib/utils";
import { CATEGORIES, getCategoryLabel, EVENT_STATUS_LABELS, type EventStatus, LIMITS } from "@/lib/constants";
import {
  deleteEventAction,
  setEventStatusAction,
  updateEventDetailsAction,
  updateEventCoverAction,
  updateEventGalleryAction,
} from "@/lib/events/actions";
import { uploadEventCover } from "@/lib/events/upload-cover";

export interface EventStatsRow {
  tickets_sold: number;
  gross_revenue: number;
  checked_in: number;
  capacity: number | null;
}

export interface OrgEventDetailProps {
  id: string;
  initialTitle?: string;
  initialDescription?: string | null;
  initialCategory?: string;
  initialVenue?: string;
  initialCity?: string;
  initialStatus?: string;
  initialSlug?: string;
  initialStartAt?: string;
  initialEndAt?: string;
  initialCapacity?: number | null;
  initialCoverUrl?: string | null;
  initialGalleryUrls?: string[];
  stats?: EventStatsRow | null;
  initialTickets?: EventTicketItem[];
}

export function OrgEventDetailEditor({
  id,
  initialTitle = "",
  initialDescription = "",
  initialCategory = "concerts",
  initialVenue = "",
  initialCity = "Abidjan",
  initialStatus = "draft",
  initialSlug = "",
  initialStartAt = "",
  initialEndAt = "",
  initialCapacity = null,
  initialCoverUrl = null,
  initialGalleryUrls = [],
  stats = null,
  initialTickets = [],
}: OrgEventDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"details" | "ticketing" | "media" | "settings">("details");

  // Form states
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription || "");
  const [category, setCategory] = useState(initialCategory || "concerts");
  const [venue, setVenue] = useState(initialVenue);
  const [city, setCity] = useState(initialCity);
  const [status, setStatus] = useState(initialStatus);
  const [startAt, setStartAt] = useState(initialStartAt);
  const [endAt, setEndAt] = useState(initialEndAt);
  const [isFinished, setIsFinished] = useState(false);

  // Image management state
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl);
  const [gallery, setGallery] = useState<string[]>(initialGalleryUrls);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const [pending, startTransition] = useTransition();
  const [statusPending, startStatusTransition] = useTransition();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const ACCEPT = LIMITS.ACCEPTED_IMAGE_TYPES.join(",");
  const MAX_GALLERY_IMAGES = 6;

  // Track if form is modified
  const isDirty =
    title !== initialTitle ||
    description !== (initialDescription || "") ||
    category !== (initialCategory || "concerts") ||
    venue !== initialVenue ||
    city !== initialCity ||
    startAt !== initialStartAt ||
    endAt !== initialEndAt;

  // Calculé après le montage : évite les écarts d'hydratation
  useEffect(() => {
    const endsAt = endAt ? new Date(endAt).getTime() : Number.NaN;
    setIsFinished(!Number.isNaN(endsAt) && endsAt <= Date.now());
  }, [endAt]);

  const ticketsSold = stats?.tickets_sold ?? 0;
  const capacity = stats?.capacity ?? initialCapacity ?? null;
  const grossRevenue = stats?.gross_revenue ?? 0;
  const checkedIn = stats?.checked_in ?? 0;
  const fillRate = capacity && capacity > 0 ? ticketsSold / capacity : null;
  const checkinRate = ticketsSold > 0 ? checkedIn / ticketsSold : 0;

  function checkFile(file: File): string | null {
    if (!(LIMITS.ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      return "Format non pris en charge : utilisez JPG, PNG, WebP ou AVIF.";
    }
    if (file.size > LIMITS.MAX_COVER_BYTES) {
      return "Image trop volumineuse : 5 Mo maximum par image.";
    }
    return null;
  }

  async function handleCoverFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setSuccess(null);
    const invalid = checkFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (!id) return;

    startTransition(async () => {
      const upload = await uploadEventCover(file, id);
      if (!upload.ok || !upload.url) {
        setError(upload.error ?? "Envoi de l'image impossible.");
        return;
      }
      const result = await updateEventCoverAction(id, upload.url);
      if (!result.ok) {
        setError(result.error ?? "Enregistrement de la couverture impossible.");
        return;
      }
      setCoverUrl(upload.url);
      setSuccess("Image de couverture mise à jour avec succès.");
    });
  }

  async function handleGalleryFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setSuccess(null);
    const incoming = [...files];
    for (const file of incoming) {
      const invalid = checkFile(file);
      if (invalid) {
        setError(`« ${file.name} » : ${invalid}`);
        return;
      }
    }
    if (gallery.length + incoming.length > MAX_GALLERY_IMAGES) {
      setError(`Galerie limitée à ${MAX_GALLERY_IMAGES} images au total.`);
      return;
    }
    if (!id) return;

    startTransition(async () => {
      const urls: string[] = [];
      for (const file of incoming) {
        const upload = await uploadEventCover(file, id);
        if (upload.ok && upload.url) {
          urls.push(upload.url);
        } else {
          setError(upload.error ?? "Envoi d'une des images impossible.");
          return;
        }
      }
      const next = [...gallery, ...urls].slice(0, MAX_GALLERY_IMAGES);
      const result = await updateEventGalleryAction(id, next);
      if (!result.ok) {
        setError(result.error ?? "Enregistrement de la galerie impossible.");
        return;
      }
      setGallery(next);
      setSuccess("Galerie photos mise à jour.");
    });
  }

  function removeCover() {
    if (!id) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateEventCoverAction(id, null);
      if (!result.ok) {
        setError(result.error ?? "Suppression de la couverture impossible.");
        return;
      }
      setCoverUrl(null);
      setSuccess("Image de couverture retirée.");
    });
  }

  function removeGalleryUrl(url: string) {
    if (!id) return;
    setError(null);
    setSuccess(null);
    const next = gallery.filter((item) => item !== url);
    startTransition(async () => {
      const result = await updateEventGalleryAction(id, next);
      if (!result.ok) {
        setError(result.error ?? "Suppression impossible.");
        return;
      }
      setGallery(next);
    });
  }

  function promoteToCover(url: string) {
    if (!id) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateEventCoverAction(id, url);
      if (!result.ok) {
        setError(result.error ?? "Mise en couverture impossible.");
        return;
      }
      setCoverUrl(url);
      setSuccess("Image définie comme couverture principale.");
    });
  }

  function handleToggleStatus() {
    startStatusTransition(async () => {
      const newStatus = status === "published" ? "draft" : "published";
      const result = await setEventStatusAction(id, newStatus);
      if (!result.ok) {
        setError(result.error ?? "Échec du changement de statut.");
        return;
      }

      setStatus(newStatus);
      setSuccess(
        newStatus === "published"
          ? "Événement publié ! Il est désormais visible du public."
          : "Événement repassé en brouillon.",
      );
    });
  }

  function handleDelete() {
    if (
      !window.confirm(
        "Supprimer définitivement cet événement ? Cette action est irréversible et retirera tous les paramètres associés.",
      )
    ) {
      return;
    }

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await deleteEventAction(id);
      if (!result.ok) {
        setError(result.error ?? "Suppression impossible.");
        return;
      }
      router.push("/org/evenements");
      router.refresh();
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setWarning(null);

    startTransition(async () => {
      const result = await updateEventDetailsAction({
        eventId: id,
        title,
        description,
        category,
        city,
        venueName: venue,
        startAt,
        endAt,
      });

      if (!result.ok) {
        setError(result.error ?? "Échec de la mise à jour.");
        return;
      }

      if (result.warning) {
        setWarning(result.warning);
      }
      setSuccess("Modifications enregistrées avec succès !");
    });
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Fil d'Ariane & Navigation haute */}
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-fg-muted">
        <Link href="/org" className="hover:text-fg transition-colors">
          Espace Organisateur
        </Link>
        <ChevronRight className="size-3 text-fg-subtle" />
        <Link href="/org/evenements" className="hover:text-fg transition-colors">
          Événements
        </Link>
        <ChevronRight className="size-3 text-fg-subtle" />
        <span className="text-fg font-medium truncate max-w-[200px] sm:max-w-md">{title}</span>
      </nav>

      {/* Notifications / Alertes */}
      {error && (
        <Alert tone="danger" title="Erreur" floating onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert tone="success" title="Opération réussie" onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {warning && (
        <Alert tone="warning" title="À noter" onDismiss={() => setWarning(null)}>
          {warning}
        </Alert>
      )}

      {isFinished && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-warning">
          <AlertTriangle className="size-5 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold">Cet événement est terminé</p>
            <p className="text-xs text-warning/90 leading-relaxed">
              La date de fin est dépassée. Les événements passés ne sont plus affichés dans Explorer ou
              sur l&apos;accueil. Pour prolonger ou réactiver l&apos;événement, modifiez la date de
              fin dans l&apos;onglet « Détails &amp; Horaires » puis enregistrez.
            </p>
          </div>
        </div>
      )}

      {/* Header Héro de l'événement */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-surface/95 to-surface-raised p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4 sm:gap-5 min-w-0">
            {/* Miniature Cover */}
            <div className="relative size-16 sm:size-20 rounded-xl overflow-hidden border border-border-strong bg-bg-muted shrink-0 shadow-inner">
              {coverUrl ? (
                <Image src={coverUrl} alt={title} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                  <Calendar className="size-8" />
                </div>
              )}
            </div>

            {/* Titre & Metadatas */}
            <div className="min-w-0 space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-fg truncate">
                  {title}
                </h1>
                <Badge
                  variant={
                    status === "published"
                      ? isFinished
                        ? "neutral"
                        : "success"
                      : "warning"
                  }
                  className="capitalize font-semibold"
                >
                  {isFinished ? "Terminé" : EVENT_STATUS_LABELS[status as EventStatus] ?? status}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-fg-muted">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-primary" />
                  {startAt && endAt ? formatDateRange(startAt, endAt) : "Dates à définir"}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary" />
                  {venue ? `${venue}, ${city}` : city}
                </span>
                <span className="flex items-center gap-1.5">
                  <Tag className="size-3.5 text-primary" />
                  {getCategoryLabel(category)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions rapides d'en-tête */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            {initialSlug && (
              <ButtonLink
                href={`/evenements/${initialSlug}`}
                target="_blank"
                variant="secondary"
                size="sm"
                className="gap-1.5 shadow-xs"
              >
                <Eye className="size-3.5" /> Voir la fiche publique
                <ExternalLink className="size-3 opacity-60" />
              </ButtonLink>
            )}

            <Button
              variant={status === "published" ? "secondary" : "primary"}
              size="sm"
              onClick={handleToggleStatus}
              loading={statusPending}
              loadingLabel={status === "published" ? "Dépublication…" : "Publication…"}
              className="gap-1.5 shadow-xs"
            >
              {status === "published" ? (
                <>
                  <Lock className="size-3.5" /> Dépublier
                </>
              ) : (
                <>
                  <Globe className="size-3.5" /> Publier
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              loading={pending}
              className="text-danger hover:bg-danger/10 hover:text-danger px-2.5"
              title="Supprimer définitivement l'événement"
              aria-label="Supprimer définitivement l'événement"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Cartes KPI / Statistiques */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Billets vendus */}
        <Card className="p-4 sm:p-5 transition-all hover:border-border-strong hover:shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs sm:text-sm font-medium text-fg-muted">Billets Vendus</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Ticket className="size-4" />
            </span>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-fg mt-2 tabular-nums">
            {formatNumber(ticketsSold)}
          </p>
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-full rounded-full bg-bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (fillRate ?? 0) * 100)}%` }}
              />
            </div>
            <p className="text-2xs text-fg-subtle">
              {capacity ? `sur ${formatNumber(capacity)} places au total` : "Capacité illimitée"}
            </p>
          </div>
        </Card>

        {/* Revenus générés */}
        <Card className="p-4 sm:p-5 transition-all hover:border-border-strong hover:shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs sm:text-sm font-medium text-fg-muted">Revenus Générés</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Wallet className="size-4" />
            </span>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-emerald-500 mt-2 tabular-nums">
            {formatPrice(grossRevenue)}
          </p>
          <div className="mt-2">
            <p className="text-2xs text-fg-subtle">Total net des commandes payées</p>
          </div>
        </Card>

        {/* Taux de Remplissage */}
        <Card className="p-4 sm:p-5 transition-all hover:border-border-strong hover:shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs sm:text-sm font-medium text-fg-muted">Remplissage</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <TrendingUp className="size-4" />
            </span>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-amber-500 mt-2 tabular-nums">
            {fillRate === null ? "—" : formatPercent(fillRate)}
          </p>
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-full rounded-full bg-bg-muted overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (fillRate ?? 0) * 100)}%` }}
              />
            </div>
            <p className="text-2xs text-fg-subtle">
              {capacity ? `${formatNumber(Math.max(0, capacity - ticketsSold))} places restantes` : "Sans quota max"}
            </p>
          </div>
        </Card>

        {/* Check-in & Entrées */}
        <Card className="p-4 sm:p-5 transition-all hover:border-border-strong hover:shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs sm:text-sm font-medium text-fg-muted">Check-in</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-sky-500 mt-2 tabular-nums">
            {formatNumber(checkedIn)}
          </p>
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-full rounded-full bg-bg-muted overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, checkinRate * 100)}%` }}
              />
            </div>
            <p className="text-2xs text-fg-subtle">
              {formatPercent(checkinRate)} des billets vendus validés
            </p>
          </div>
        </Card>
      </div>

      {/* Barre d'onglets de gestion */}
      <div className="flex overflow-x-auto border-b border-border gap-2 pb-px no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap",
            activeTab === "details"
              ? "border-primary text-primary"
              : "border-transparent text-fg-muted hover:text-fg hover:border-border",
          )}
        >
          <Sliders className="size-4" />
          Détails &amp; Horaires
          {isDirty && (
            <span className="size-2 rounded-full bg-primary" title="Modifications non enregistrées" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ticketing")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap",
            activeTab === "ticketing"
              ? "border-primary text-primary"
              : "border-transparent text-fg-muted hover:text-fg hover:border-border",
          )}
        >
          <Ticket className="size-4" />
          Billetterie &amp; Tarifs
          {initialTickets.length > 0 && (
            <span className="rounded-full bg-bg-muted px-2 py-0.5 text-2xs font-bold text-fg-muted">
              {initialTickets.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("media")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap",
            activeTab === "media"
              ? "border-primary text-primary"
              : "border-transparent text-fg-muted hover:text-fg hover:border-border",
          )}
        >
          <ImageIcon className="size-4" />
          Photos &amp; Visuels
          <span className="rounded-full bg-bg-muted px-2 py-0.5 text-2xs font-bold text-fg-muted">
            {(coverUrl ? 1 : 0) + gallery.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap",
            activeTab === "settings"
              ? "border-primary text-primary"
              : "border-transparent text-fg-muted hover:text-fg hover:border-border",
          )}
        >
          <ShieldAlert className="size-4" />
          Paramètres &amp; Raccourcis
        </button>
      </div>

      {/* Contenu de l'onglet 1 : Détails & Horaires */}
      {activeTab === "details" && (
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="border-b border-border/70 p-5 sm:p-6 bg-surface/50">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="size-5 text-primary" /> Informations Générales
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Définissez le nom, la catégorie et la présentation de votre événement.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nom de l'événement"
                  required
                  hint="Nom accrocheur et reconnaissable"
                  className="sm:col-span-2"
                >
                  <Input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex: Festival des Rythmes d'Abidjan"
                  />
                </Field>

                <Field label="Catégorie" required hint="Facilite la recherche dans Explorer">
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label="Ville principale"
                  required
                  hint="Ville où se déroule l'événement"
                >
                  <Input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="ex: Abidjan, Bouaké, Yamoussoukro"
                  />
                </Field>

                <Field
                  label="Lieu / Adresse précise"
                  hint="Salle, complexe ou adresse pour les participants"
                  className="sm:col-span-2"
                >
                  <Input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="ex: Palais de la Culture, Salle Anoumabo, Treichville"
                  />
                </Field>

                <Field
                  label="Description complète de l'événement"
                  hint="Présentation détaillée, artistes, programme et informations pratiques"
                  className="sm:col-span-2"
                >
                  <Textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez votre événement : ambiance, invités, code vestimentaire, parking..."
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b border-border/70 p-5 sm:p-6 bg-surface/50">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Calendar className="size-5 text-primary" /> Dates &amp; Horaires
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Renseignez la période durant laquelle se déroule l&apos;événement.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Date & heure de début"
                  required
                  hint="Heure à laquelle les portes s'ouvrent"
                >
                  <Input
                    type="datetime-local"
                    required
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                  />
                </Field>

                <Field
                  label="Date & heure de fin"
                  required
                  hint="Fin officielle de l'événement"
                >
                  <Input
                    type="datetime-local"
                    required
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                  />
                </Field>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-surface-raised p-3 text-xs text-fg-muted border border-border">
                <Info className="size-4 text-primary shrink-0" />
                <span>
                  Important : Dès que la date de fin est dépassée, l&apos;événement est marqué comme
                  terminé et retiré automatiquement des résultats de recherche publique.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Barre d'action d'enregistrement */}
          <div className="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-xl border border-border bg-surface/95 p-4 shadow-lg backdrop-blur-md">
            <div className="text-xs">
              {isDirty ? (
                <span className="font-medium text-warning flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-warning animate-pulse" />
                  Vous avez des modifications non enregistrées
                </span>
              ) : (
                <span className="text-fg-subtle">Toutes les modifications sont enregistrées</span>
              )}
            </div>

            <Button
              type="submit"
              loading={pending}
              loadingLabel="Enregistrement..."
              className="gap-2 shadow-sm"
            >
              <Save className="size-4" /> Enregistrer les modifications
            </Button>
          </div>
        </form>
      )}

      {/* Contenu de l'onglet 2 : Billetterie & Formules */}
      {activeTab === "ticketing" && (
        <OrgEventTicketTypesEditor eventId={id} initialTickets={initialTickets} />
      )}

      {/* Contenu de l'onglet 3 : Photos & Visuels */}
      {activeTab === "media" && (
        <div className="space-y-6">
          {/* Image de couverture principale */}
          <Card className="shadow-sm">
            <CardHeader className="border-b border-border/70 p-5 sm:p-6 bg-surface/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <ImageIcon className="size-5 text-primary" /> Image de Couverture
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-0.5">
                    Image principale affichée sur l&apos;accueil, dans Explorer et en tête de la fiche événement.
                  </CardDescription>
                </div>
                {coverUrl && (
                  <Badge variant="success" className="hidden sm:inline-flex">
                    Couverture active
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-4">
              {coverUrl ? (
                <div className="relative aspect-16/9 w-full overflow-hidden rounded-xl border border-border bg-bg-muted shadow-sm">
                  <Image src={coverUrl} alt="Couverture principale" fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={pending}
                      className="bg-white/90 text-black hover:bg-white backdrop-blur-sm shadow-md"
                    >
                      <ImagePlus className="size-4 mr-1.5" /> Remplacer
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={removeCover}
                      disabled={pending}
                      className="shadow-md"
                      aria-label="Supprimer la couverture"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={pending}
                  className={cn(
                    "flex flex-col items-center justify-center w-full aspect-16/9 rounded-xl border-2 border-dashed border-border-strong bg-surface-sunken/40 hover:bg-surface-raised hover:border-primary/50 transition-all p-6 text-center cursor-pointer",
                    pending && "cursor-wait opacity-60",
                  )}
                >
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                    {pending ? (
                      <Loader2 className="size-6 animate-spin" />
                    ) : (
                      <ImagePlus className="size-6" />
                    )}
                  </div>
                  <p className="font-semibold text-sm text-fg">Ajouter une image de couverture</p>
                  <p className="text-xs text-fg-muted mt-1 max-w-sm">
                    Format recommandé : 16:9 (1920x1080 px). Formats acceptés : JPG, PNG, WebP ou AVIF (5 Mo max).
                  </p>
                </button>
              )}

              <input
                ref={coverInputRef}
                type="file"
                accept={ACCEPT}
                className="sr-only"
                onChange={(e) => {
                  handleCoverFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </CardContent>
          </Card>

          {/* Galerie d'illustrations */}
          <Card className="shadow-sm">
            <CardHeader className="border-b border-border/70 p-5 sm:p-6 bg-surface/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="size-5 text-primary" /> Galerie Photos
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-0.5">
                    Ajoutez jusqu&apos;à {MAX_GALLERY_IMAGES} photos pour illustrer l&apos;ambiance, le lieu et les intervenants.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-fg-muted">
                    {gallery.length} / {MAX_GALLERY_IMAGES} photos
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={pending || gallery.length >= MAX_GALLERY_IMAGES}
                    className="gap-1.5"
                  >
                    <ImagePlus className="size-4" /> Ajouter
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              {gallery.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface-sunken/30 p-8 text-center">
                  <p className="text-sm font-medium text-fg-muted">Aucune photo dans la galerie</p>
                  <p className="text-xs text-fg-subtle mt-1">
                    Les photos de la salle, des éditions précédentes ou des artistes rassurent et incitent à réserver.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-4 gap-1.5"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <ImagePlus className="size-4" /> Ajouter des photos
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {gallery.map((url, idx) => (
                    <div
                      key={`${url}-${idx}`}
                      className="group relative aspect-4/3 overflow-hidden rounded-xl border border-border bg-bg-muted shadow-xs transition-all"
                    >
                      <Image
                        src={url}
                        alt={`Photo de galerie ${idx + 1}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 flex items-end justify-between p-2.5">
                        <button
                          type="button"
                          onClick={() => promoteToCover(url)}
                          disabled={pending}
                          title="Définir comme couverture principale"
                          className="flex size-7 items-center justify-center rounded-md bg-white/20 text-white hover:bg-white/40 backdrop-blur-xs transition-colors"
                        >
                          <Star className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeGalleryUrl(url)}
                          disabled={pending}
                          title="Retirer cette photo"
                          className="flex size-7 items-center justify-center rounded-md bg-danger/80 text-white hover:bg-danger transition-colors"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={galleryInputRef}
                type="file"
                accept={ACCEPT}
                multiple
                className="sr-only"
                onChange={(e) => {
                  handleGalleryFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contenu de l'onglet 4 : Paramètres & Raccourcis */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="border-b border-border/70 p-5 sm:p-6 bg-surface/50">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Globe className="size-5 text-primary" /> Statut &amp; Visibilité
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Contrôlez si cet événement est accessible au public ou gardé en brouillon.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border p-4 bg-surface">
                <div>
                  <p className="font-semibold text-sm text-fg">
                    Statut actuel :{" "}
                    <span className="text-primary font-bold">
                      {status === "published" ? "Publié et actif" : "Brouillon privé"}
                    </span>
                  </p>
                  <p className="text-xs text-fg-muted mt-0.5">
                    {status === "published"
                      ? "L'événement est visible dans Explorer et sur votre profil organisateur."
                      : "L'événement est privé : personne ne peut le voir ni commander de billets."}
                  </p>
                </div>

                <Button
                  variant={status === "published" ? "secondary" : "primary"}
                  onClick={handleToggleStatus}
                  loading={statusPending}
                  className="gap-2 shrink-0"
                >
                  {status === "published" ? (
                    <>
                      <Lock className="size-4" /> Passer en brouillon
                    </>
                  ) : (
                    <>
                      <Globe className="size-4" /> Publier l&apos;événement
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b border-border/70 p-5 sm:p-6 bg-surface/50">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <QrCode className="size-5 text-primary" /> Outils d&apos;Événement
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Raccourcis vers les espaces opérationnels de votre événement.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-3 sm:grid-cols-2 p-5 sm:p-6">
              <ButtonLink
                href="/org/check-in"
                variant="secondary"
                className="min-h-14 justify-start p-3 text-left"
              >
                <QrCode className="mr-3 size-5 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-xs sm:text-sm text-fg">Scanner de Check-in</p>
                  <p className="text-2xs text-fg-subtle">Valider les billets à l&apos;entrée le jour J</p>
                </div>
              </ButtonLink>

              {initialSlug && (
                <ButtonLink
                  href={`/evenements/${initialSlug}/salon`}
                  variant="secondary"
                  className="min-h-14 justify-start p-3 text-left"
                >
                  <Sparkles className="mr-3 size-5 text-primary shrink-0" />
                  <div>
                    <p className="font-semibold text-xs sm:text-sm text-fg">Salon Communautaire</p>
                    <p className="text-2xs text-fg-subtle">Échanger avec les participants et intervenants</p>
                  </div>
                </ButtonLink>
              )}
            </CardContent>
          </Card>

          {/* Zone de Danger */}
          <Card className="border-danger/30 shadow-sm">
            <CardHeader className="border-b border-danger/20 p-5 sm:p-6 bg-danger/5">
              <CardTitle className="text-lg font-bold text-danger flex items-center gap-2">
                <ShieldAlert className="size-5" /> Zone de Danger
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Actions irréversibles relatives à la gestion de cet événement.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-sm text-fg">Supprimer cet événement</p>
                  <p className="text-xs text-fg-muted mt-0.5 max-w-md">
                    Une fois supprimé, l&apos;événement ainsi que ses tarifs seront effacés. Seuls les événements sans commandes validées peuvent être supprimés.
                  </p>
                </div>

                <Button
                  variant="danger"
                  onClick={handleDelete}
                  loading={pending}
                  className="gap-2 shrink-0"
                >
                  <Trash2 className="size-4" /> Supprimer l&apos;événement
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
