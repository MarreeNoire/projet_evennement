"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ellipsis, Heart, LoaderCircle, Pencil, Trash2, X } from "lucide-react";

import {
  deleteComment,
  setCommentHidden,
  toggleReaction,
  updateComment,
} from "@/lib/salons/actions";
import { Avatar } from "@/components/ui/avatar";
import {
  isOrganizerRole,
  LinkifiedContent,
  OrganizerBadge,
  type ViewerInfo,
} from "@/components/salons/salon-shared";
import type { CommentWithAuthor } from "@/lib/salons/types";
import { formatRelative } from "@/lib/social/time";
import { cn } from "@/lib/utils";

/* =============================================================================
   Un commentaire (ou une réponse aplatie)
   --------------------------------------------------------------------------
   Avatar + bulle douce (fond teinté, coins arrondis), badge de rôle, heure
   relative, ligne d'actions discrète (J'aime · Répondre · ⋯). Les réponses
   d'organisateur sont mises en valeur. Édition en ligne pour le sien,
   suppression et masquage pour les organisateurs. Mention « modifié ».
   ========================================================================== */

export function CommentItem({
  comment,
  viewer,
  organizerIds,
  salonId,
  isReply = false,
  replyToName,
  nowMs,
  onReply,
  compact = false,
}: {
  comment: CommentWithAuthor;
  viewer: ViewerInfo;
  organizerIds: string[];
  salonId: string;
  isReply?: boolean;
  /** Auteur du parent, pour la mention @Nom des réponses aplaties. */
  replyToName?: string;
  nowMs: number;
  onReply: (comment: CommentWithAuthor) => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const [count, setCount] = useState(comment.reaction_count ?? 0);
  const [mine, setMine] = useState(comment.my_reaction ?? null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLSpanElement>(null);

  const authorName = comment.author?.display_name ?? "Participant";
  const isOrganizerAuthor = Boolean(comment.author_id && organizerIds.includes(comment.author_id));
  const isMine = Boolean(viewer.id) && viewer.id === comment.author_id;
  const canModerate = isOrganizerRole(viewer.role);
  const edited =
    comment.updated_at &&
    comment.created_at &&
    new Date(comment.updated_at).getTime() - new Date(comment.created_at).getTime() > 60_000;

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const react = async () => {
    const next = mine ?? "like";
    const previous = mine;
    const previousCount = count;
    if (previous === next) {
      setMine(null);
      setCount((value) => Math.max(0, value - 1));
    } else {
      setMine(next);
      setCount((value) => value + 1);
    }
    const { success } = await toggleReaction("comment", comment.id, next);
    if (!success) {
      setMine(previous);
      setCount(previousCount);
    }
  };

  const saveEdit = async () => {
    const value = draft.trim();
    if (!value || saving) return;
    setSaving(true);
    const result = await updateComment(comment.id, value);
    setSaving(false);
    if (result.success) {
      setEditing(false);
      router.refresh();
    }
  };

  const removeOwn = async () => {
    if (deleting) return;
    setDeleting(true);
    const result = await deleteComment(comment.id);
    if (result.success) router.refresh();
    setDeleting(false);
  };

  const moderateHide = async () => {
    setMenuOpen(false);
    const result = await setCommentHidden(salonId, comment.id, true);
    if (result.success) router.refresh();
  };

  return (
    <article
      data-comment-id={comment.id}
      className={cn("group flex min-w-0 gap-2.5", isReply && "gap-2")}
    >
      <Avatar src={comment.author?.avatar_url} name={authorName} size="sm" />

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 transition-colors",
            isOrganizerAuthor
              ? "bg-accent-subtle/70 ring-1 ring-accent-subtle-fg/10"
              : "bg-bg-subtle",
            isReply && "rounded-bl-md",
          )}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-fg text-[15px] font-semibold">{authorName}</span>
            {isOrganizerAuthor ? <OrganizerBadge subtle /> : null}
            {replyToName ? (
              <span className="text-primary text-xs font-semibold">@{replyToName}</span>
            ) : null}
            <span className="text-fg-subtle text-xs">{formatRelative(new Date(comment.created_at), new Date(nowMs))}</span>
            {edited ? <span className="text-fg-subtle text-xs italic">· modifié</span> : null}
          </div>

          {editing ? (
            <div className="mt-1.5 flex flex-col gap-1.5">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={2}
                aria-label="Modifier le commentaire"
                className="border-border bg-surface text-fg focus:border-border-focus w-full resize-none rounded-xl border px-3 py-2 text-[15px] leading-relaxed outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setDraft(comment.content);
                  }}
                  className="text-fg-muted rounded-lg px-2 py-1 text-xs font-semibold hover:bg-bg-muted"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => void saveEdit()}
                  disabled={saving}
                  className="bg-primary-solid text-primary-solid-fg inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-60"
                >
                  {saving ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> : null}
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <LinkifiedContent
              text={comment.content}
              className="text-fg mt-0.5 text-[15px] leading-relaxed"
            />
          )}
        </div>

        {/* Ligne d'actions discrète */}
        <div className="text-fg-muted -ml-1.5 mt-0.5 flex items-center gap-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => void react()}
            aria-pressed={mine !== null}
            className={cn(
              "rounded-lg px-1.5 py-1 transition-colors hover:bg-bg-muted",
              mine ? "text-danger" : "hover:text-fg",
            )}
          >
            <span className="inline-flex items-center gap-1">
              <Heart
                className={cn("size-3.5", mine && "fill-current scale-110 transition-transform duration-200")}
                aria-hidden="true"
              />
              {count > 0 ? <span className="tabular-nums">{count}</span> : "J'aime"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onReply(comment)}
            className="hover:bg-bg-muted rounded-lg px-1.5 py-1 transition-colors hover:text-fg"
          >
            Répondre
          </button>

          {(isMine || canModerate) && !compact ? (
            <span className="relative inline-flex" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                aria-label="Actions du commentaire"
                aria-expanded={menuOpen}
                className="rounded-lg p-1 transition-colors hover:bg-bg-muted hover:text-fg"
              >
                <Ellipsis className="size-3.5" aria-hidden="true" />
              </button>
              {menuOpen ? (
                <span
                  role="menu"
                  className="bg-surface border-border absolute top-full left-0 z-30 mt-1 w-44 rounded-xl border p-1 shadow-lg"
                >
                  {isMine ? (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          setDraft(comment.content);
                          setEditing(true);
                        }}
                        className="text-fg-muted hover:bg-bg-muted hover:text-fg flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" /> Modifier
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void removeOwn()}
                        className="text-danger hover:bg-bg-muted flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium"
                      >
                        {deleting ? (
                          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        )}{" "}
                        Supprimer
                      </button>
                    </>
                  ) : null}
                  {canModerate && !isMine ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void moderateHide()}
                      className="text-fg-muted hover:bg-bg-muted hover:text-fg flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium"
                    >
                      <X className="size-3.5" aria-hidden="true" /> Masquer
                    </button>
                  ) : null}
                </span>
              ) : null}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
