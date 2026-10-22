"use client";

import { memo, useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  BadgeCheck,
  Check,
  Link2,
  LoaderCircle,
  Megaphone,
  MessageSquare,
  Pin,
  Send,
  X,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import type { CommentWithAuthor, PostWithAuthor } from "@/lib/salons/types";
import { updateSalonPost } from "@/lib/salons/actions";
import { LIMITS } from "@/lib/constants";
import {
  CATEGORY_LABELS,
  LinkifiedContent,
  OrganizerBadge,
  type MentionOption,
  type ViewerInfo,
} from "@/components/salons/salon-shared";
import { CommentsOverlay } from "@/components/salons/comments-overlay";
import { MediaLightbox } from "@/components/salons/media-lightbox";
import { PostMenu } from "@/components/salons/post-menu";
import { PostReactions } from "@/components/salons/post-reactions";
import { formatRelative } from "@/lib/social/time";
import { cn } from "@/lib/utils";

/* =============================================================================
   Carte de publication du fil (refonte)
   --------------------------------------------------------------------------
   Carte douce arrondie : en-tête (avatar, nom, badge Organisateur, heure
   relative), contenu avec liens cliquables, galerie avec ratios fixes et
   lightbox plein écran, aperçu de 2 commentaires, barre d'actions (réaction,
   commenter, partager, enregistrer) et menu ⋯ par rôle. L'overlay de
   commentaires est embarqué : chaque publication ouvre son fil d'échanges.
   ========================================================================== */

const SAVED_POSTS_KEY = "event.salon.saved_posts.v1";

function readSavedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_POSTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export interface SalonPostCardProps {
  post: PostWithAuthor;
  /** Commentaires déjà chargés côté serveur (arbre). */
  comments?: CommentWithAuthor[];
  viewer: ViewerInfo;
  organizerIds: string[];
  members: MentionOption[];
  nowMs: number;
  /** Vers la publication par rapport à la dernière lecture (badge « Nouveau »). */
  isNew?: boolean;
}

function SalonPostCardImpl({
  post,
  comments = [],
  viewer,
  organizerIds,
  members,
  nowMs,
  isNew = false,
}: SalonPostCardProps) {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isOrganizerAuthor = Boolean(post.author_id && organizerIds.includes(post.author_id));
  const edited =
    new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 60_000;
  const media = useMemo(
    () => post.media.map((item) => ({ url: item.url, kind: item.kind })),
    [post.media],
  );

  /* État « enregistré » lu après peinture (mutation de localStorage interdite au rendu). */
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setSaved(readSavedIds().includes(post.id)));
    return () => window.cancelAnimationFrame(raf);
  }, [post.id]);

  /** Aperçu : les 2 réponses les plus récentes façon Instagram. */
  const preview = useMemo(() => {
    const flat = [...comments];
    const tip = flat[flat.length - 1];
    const penultimate = flat[flat.length - 2];
    return [penultimate, tip].filter(Boolean) as CommentWithAuthor[];
  }, [comments]);

  const share = async () => {
    const url = `${window.location.origin}/salons/${post.salon_id}?post=${post.id}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Publication du salon", url });
        return;
      } catch {
        /* annulé : on ne fait rien de visible */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setFeedback("Lien copié");
    } catch {
      setFeedback(url);
    }
    window.setTimeout(() => setFeedback(null), 2200);
  };

  const toggleSave = () => {
    const current = readSavedIds();
    const next = current.includes(post.id)
      ? current.filter((id) => id !== post.id)
      : [...current, post.id];
    try {
      window.localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(next.slice(-50)));
    } catch {
      /* quota : l'état visuel reste cohérent pour la session */
    }
    setSaved(next.includes(post.id));
  };

  const commentCount = post.comment_count;

  return (
    <article
      id={`post-${post.id}`}
      data-post-id={post.id}
      aria-label={`Publication de ${post.author?.display_name ?? "un membre"}`}
      className={cn(
        "bg-surface border-border group relative scroll-mt-24 rounded-2xl border shadow-xs transition-shadow duration-200",
        post.kind === "announcement" && "border-accent-subtle-fg/25 ring-accent-subtle-fg/10 ring-1",
      )}
    >
      {/* Bandeau épinglé / annonce */}
      {post.is_pinned || isNew || post.kind === "announcement" ? (
        <div className="flex flex-wrap items-center gap-1.5 px-4 pt-3 sm:px-5">
          {post.is_pinned ? (
            <span className="bg-bg-subtle text-fg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-bold tracking-[0.08em] uppercase">
              <Pin className="size-3" aria-hidden="true" /> Épinglé
            </span>
          ) : null}
          {post.kind === "announcement" ? (
            <span className="bg-accent-subtle text-accent-subtle-fg inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-bold tracking-[0.08em] uppercase">
              <Megaphone className="size-3" aria-hidden="true" /> Annonce
            </span>
          ) : null}
          {isNew ? (
            <span className="text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-bold tracking-[0.08em] uppercase">
              <span className="bg-primary size-1.5 rounded-full" aria-hidden="true" /> Nouveau
            </span>
          ) : null}
        </div>
      ) : null}

      {/* En-tête */}
      <header className="flex items-start gap-3 px-4 pt-3.5 pb-2 sm:px-5">
        <Avatar
          src={post.author?.avatar_url}
          name={post.author?.display_name ?? "Participant"}
          size="md"
          ring={isOrganizerAuthor}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-fg text-[15px] font-semibold">
              {post.author?.display_name ?? "Participant"}
            </span>
            {post.author?.is_verified ? (
              <BadgeCheck className="text-info size-4 shrink-0" aria-label="Profil vérifié" />
            ) : null}
            {isOrganizerAuthor ? <OrganizerBadge /> : null}
          </div>
          <div className="text-fg-subtle mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs">
            <span>{formatRelative(new Date(post.created_at), new Date(nowMs))}</span>
            {edited ? <span>· modifié</span> : null}
            <span aria-hidden="true">·</span>
            <span className={cn(CATEGORY_LABELS[post.category] && "font-medium")}>
              {CATEGORY_LABELS[post.category] ?? post.category}
            </span>
          </div>
        </div>
        {viewer.id ? (
          <PostMenu
            postId={post.id}
            salonId={post.salon_id}
            authorId={post.author_id}
            isPinned={post.is_pinned}
            viewer={viewer}
            onEdit={() => setEditing(true)}
          />
        ) : null}
      </header>

      {/* Corps */}
      <div className="px-4 pb-1 sm:px-5">
        {editing ? <PostEditInline postId={post.id} content={post.content} onDone={() => setEditing(false)} /> : null}
        {!editing && post.content ? (
          <LinkifiedContent
            text={post.content}
            className="text-fg text-[15px] leading-relaxed whitespace-pre-line"
          />
        ) : null}

        {/* Galerie : ratios réservés, zéro décalage de mise en page */}
        {media.length > 0 ? (
          <div
            className={cn(
              "bg-bg-subtle mt-3 grid gap-1 overflow-hidden rounded-xl",
              media.length === 1 && "grid-cols-1",
              media.length === 2 && "grid-cols-2",
              media.length >= 3 && "grid-cols-2 sm:grid-cols-2",
            )}
          >
            {media.slice(0, 4).map((item, index) => (
              <button
                key={`${item.url}-${index}`}
                type="button"
                onClick={() => setLightboxIndex(index)}
                aria-label={`Agrandir l’image ${index + 1} sur ${media.length}`}
                className={cn(
                  "bg-bg-subtle relative w-full overflow-hidden transition-opacity hover:opacity-95",
                  media.length === 1 ? "aspect-16/10" : "aspect-square",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={`Image ${index + 1} partagée dans le salon`}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 size-full object-cover"
                />
                {media.length > 4 && index === 3 ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-bold text-white">
                    +{media.length - 3}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}

        {/* Aperçu de 1-2 commentaires */}
        {preview.length > 0 ? (
          <div className="mt-3 space-y-1">
            {preview.map((comment) => (
              <button
                key={comment.id}
                type="button"
                onClick={() => setOverlayOpen(true)}
                className="hover:bg-bg-subtle/60 -mx-1 flex w-[calc(100%+0.5rem)] min-w-0 items-baseline gap-2 rounded-lg px-1 py-0.5 text-left"
              >
                <span className="text-fg shrink-0 text-[13px] font-semibold">
                  {comment.author?.display_name ?? "Participant"}
                  {comment.author_id && organizerIds.includes(comment.author_id) ? (
                    <OrganizerBadge subtle />
                  ) : null}
                </span>
                <span className="text-fg-muted min-w-0 truncate text-[13px]">
                  {comment.content.replace(/https?:\/\/\S+/g, "lien")}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setOverlayOpen(true)}
              className="text-fg-muted hover:text-primary mt-0.5 inline-flex items-center gap-1 rounded-lg px-1 py-0.5 text-[13px] font-semibold transition-colors"
            >
              Voir les {commentCount} commentaires
            </button>
          </div>
        ) : null}
      </div>

      {/* Barre d'actions */}
      <footer className="border-border/70 mt-2 flex items-center justify-between border-t px-2.5 py-1.5 sm:px-3.5">
        {viewer.id ? (
          <>
            <PostReactions
              postId={post.id}
              initialCount={post.reaction_count}
              initialReaction={post.my_reaction}
              initialHasReacted={post.has_reacted}
            />
            <button
              type="button"
              onClick={() => setOverlayOpen(true)}
              aria-label={`Commenter — ${commentCount} commentaire${commentCount > 1 ? "s" : ""}`}
              className="text-fg-muted press inline-flex min-h-10 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold transition-colors hover:bg-bg-muted hover:text-fg"
            >
              <MessageSquare className="size-4.5" aria-hidden="true" />
              {commentCount > 0 ? <span className="tabular-nums">{commentCount}</span> : null}
            </button>
            <button
              type="button"
              onClick={() => void share()}
              aria-label="Partager cette publication"
              className="text-fg-muted press inline-flex min-h-10 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold transition-colors hover:bg-bg-muted hover:text-fg"
            >
              <Send className="size-4.5" aria-hidden="true" />
              <span className="hidden sm:inline">Partager</span>
            </button>
            <button
              type="button"
              onClick={toggleSave}
              aria-pressed={saved}
              aria-label={saved ? "Retirer de mes enregistrements" : "Enregistrer cette publication"}
              className={cn(
                "press inline-flex min-h-10 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold transition-colors",
                saved ? "text-primary" : "text-fg-muted hover:bg-bg-muted hover:text-fg",
              )}
            >
              <Bookmark className={cn("size-4.5", saved && "fill-current")} aria-hidden="true" />
              <span className="hidden sm:inline">{saved ? "Enregistré" : "Enregistrer"}</span>
            </button>
          </>
        ) : (
          <>
            <PostReactions
              postId={post.id}
              initialCount={post.reaction_count}
              initialReaction={post.my_reaction}
              initialHasReacted={post.has_reacted}
              compact
            />
            <a
              href={`/connexion?redirect=${encodeURIComponent(`/salons/${post.salon_id}`)}`}
              className="text-primary inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold"
            >
              <Link2 className="size-4" aria-hidden="true" />
              Se connecter pour réagir
            </a>
            <span className="text-fg-subtle text-xs tabular-nums">{commentCount}</span>
          </>
        )}
      </footer>

      {/* Retour d'état partage */}
      {feedback ? (
        <p
          role="status"
          className="bg-surface border-border text-fg absolute bottom-14 left-1/2 z-20 -translate-x-1/2 rounded-full border px-3 py-1 text-xs font-medium shadow-md"
        >
          {feedback}
        </p>
      ) : null}

      {/* Lightbox */}
      <MediaLightbox
        open={lightboxIndex !== null}
        index={lightboxIndex}
        media={media}
        alt={`Publication de ${post.author?.display_name ?? "un membre"}`}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />

      {/* Overlay des commentaires (mobile : feuille tactile, desktop : dialogue centré) */}
      <CommentsOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        post={post}
        comments={comments}
        viewer={viewer}
        organizerIds={organizerIds}
        members={members}
        nowMs={nowMs}
      />
    </article>
  );
}

/* --------------------------- Édition inline -------------------------------- */

function PostEditInline({
  postId,
  content,
  onDone,
}: {
  postId: string;
  content: string;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState(content);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    const result = await updateSalonPost(postId, draft.trim());
    setPending(false);
    if (result.success) onDone();
    else setError(result.error ?? "La modification a échoué.");
  };

  return (
    <form onSubmit={save} className="bg-bg-subtle border-border mt-2 grid gap-2 rounded-xl border p-3">
      <label htmlFor={`edit-post-${postId}`} className="text-fg text-sm font-semibold">
        Modifier ta publication
      </label>
      <textarea
        id={`edit-post-${postId}`}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        maxLength={LIMITS.MAX_POST_LENGTH}
        rows={4}
        required
        disabled={pending}
        className="border-border-strong bg-surface focus:border-border-focus text-fg min-h-24 w-full resize-y rounded-lg border px-3 py-2.5 text-base leading-relaxed outline-none md:text-[15px]"
      />
      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <span className="text-fg-subtle text-xs tabular-nums">
          {draft.length}/{LIMITS.MAX_POST_LENGTH}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDone}
            disabled={pending}
            className="text-fg-muted hover:bg-bg-muted inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold"
          >
            <X className="size-3.5" aria-hidden="true" /> Annuler
          </button>
          <button
            type="submit"
            disabled={pending || !draft.trim() || draft.trim() === content}
            className="bg-primary-solid text-primary-solid-fg inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold disabled:opacity-50"
          >
            {pending ? (
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="size-3.5" aria-hidden="true" />
            )}
            Enregistrer
          </button>
        </div>
      </div>
    </form>
  );
}

export const SalonPostCard = memo(SalonPostCardImpl);
