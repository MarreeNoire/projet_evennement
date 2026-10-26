"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, Inbox, LoaderCircle, RotateCcw, X } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createComment } from "@/lib/salons/actions";
import type { CommentWithAuthor, PostWithAuthor } from "@/lib/salons/types";
import { Avatar } from "@/components/ui/avatar";
import {
  LinkifiedContent,
  type MentionOption,
  type ViewerInfo,
} from "@/components/salons/salon-shared";
import { CommentComposer } from "@/components/salons/comment-composer";
import { CommentItem } from "@/components/salons/comment-item";
import { enqueueComment } from "@/lib/ui/offline-queue";
import { formatRelative } from "@/lib/social/time";
import { cn } from "@/lib/utils";

/* =============================================================================
   Overlay des commentaires — la zone refaite de zéro
   --------------------------------------------------------------------------
   Mobile  (< md)  : feuille quasi plein écran, poignée de glissement, fermeture
                     par swipe vers le bas, saisie collée au-dessus du clavier
                     (visualViewport + safe areas).
   Desktop (≥ md)  : boîte de dialogue centrée (42 rem), comme le reste du web.
   Temps réel      : canal Supabase par publication (INSERT/UPDATE → refresh
                     doux) + présence « x personnes écrivent… » ; dégrade
                     silencieusement si la diffusion temps réel n'est pas
                     configurée côté base.
   Optimiste       : envoi immédiat avec état « en cours », file hors-ligne,
                     bouton Réessayer en cas d'échec, brouillon conservé.
   Tri             : Pertinents (organisateurs puis aimés) ou Récents.
   ========================================================================== */

interface ExtraComment {
  id: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  status: "sending" | "queued" | "error";
}

type SortMode = "pertinents" | "recents";

export function CommentsOverlay({
  open,
  onClose,
  post,
  comments,
  viewer,
  organizerIds,
  members,
  nowMs,
}: {
  open: boolean;
  onClose: () => void;
  post: Pick<PostWithAuthor, "id" | "salon_id" | "comment_count">;
  /** Arbre fourni par le serveur (racines + réponses) */
  comments: CommentWithAuthor[];
  viewer: ViewerInfo;
  organizerIds: string[];
  members: MentionOption[];
  nowMs: number;
}) {
  const router = useRouter();
  const [sort, setSort] = useState<SortMode>("pertinents");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [extras, setExtras] = useState<ExtraComment[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [dragY, setDragY] = useState<number | null>(null);
  const [kbInset, setKbInset] = useState(0);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingStampRef = useRef(0);
  const extractionRef = useRef(0);
  const dragStartRef = useRef<number | null>(null);

  const signed = Boolean(viewer.id);

  /*                        
                        Cycle de vie                            
                        */

  /* Bloque le scroll du fond pendant l'ouverture (impératif, conservé). */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /* Échap = fermer. */
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  /* Clavier visuel : la feuille remonte au-dessus de la saisie (iOS). */
  useEffect(() => {
    if (!open) return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const sync = () => {
      /* Le clavier visuel ne concerne que le tactile ; sur desktop, on garde
         la boîte centrée intacte. */
      if (!window.matchMedia("(max-width: 767px)").matches) {
        setKbInset(0);
        return;
      }
      const inset = Math.max(
        0,
        Math.min(window.innerHeight - viewport.height, 320),
      );
      setKbInset(inset);
    };
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    sync();
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
    };
  }, [open]);

  /* Temps réel : présence (typing) + postgres_changes (nouveaux). */
  useEffect(() => {
    if (!open || !post.id) return;
    const client = createSupabaseBrowserClient();
    const channel = client.channel(`salon-comments:${post.id}`);

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, { name?: string; typing?: boolean }[]>;
        const names = new Set<string>();
        for (const entries of Object.values(state)) {
          for (const entry of entries ?? []) {
            if (entry?.typing && entry?.name && entry.name !== viewer.name) {
              names.add(entry.name);
            }
          }
        }
        setTypingNames([...names].slice(0, 3));
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `post_id=eq.${post.id}` },
        () => router.refresh(),
      )
      .subscribe();
    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      void client.removeChannel(channel);
    };
  }, [open, post.id, viewer.name, router]);

  /* « x personnes écrivent… » via la présence, throttlée. */
  const broadcastTyping = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const now = Date.now();
    if (now - typingStampRef.current < 1400) return;
    typingStampRef.current = now;
    void channel.track({ name: viewer.name ?? "Membre", typing: true });
    window.setTimeout(() => {
      void channelRef.current?.track({ name: viewer.name ?? "Membre", typing: false });
    }, 2600);
  }, [viewer.name]);

  /*                          
                        Arbre & tri                              
                        */

  const flattened = useMemo(() => {
    const byId = new Map<string, CommentWithAuthor>();
    const visit = (comment: CommentWithAuthor) => {
      byId.set(comment.id, comment);
      (comment.replies ?? []).forEach(visit);
    };
    comments.forEach(visit);
    return byId;
  }, [comments]);

  /** Descendants aplatis d'une racine (une seule indentation, @Nom ensuite). */
  const descendantsOf = useCallback(
    (root: CommentWithAuthor): { comment: CommentWithAuthor; replyToName: string | null }[] => {
      const out: { comment: CommentWithAuthor; replyToName: string | null }[] = [];
      const visit = (parent: CommentWithAuthor) => {
        for (const reply of parent.replies ?? []) {
          const parentName =
            flattened.get(reply.parent_id ?? "")?.author?.display_name ?? null;
          out.push({ comment: reply, replyToName: parentName });
          visit(reply);
        }
      };
      visit(root);
      return out.sort((a, b) => a.comment.created_at.localeCompare(b.comment.created_at));
    },
    [flattened],
  );

  const roots = useMemo(() => {
    if (sort === "recents") {
      return [...comments].sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    const score = (comment: CommentWithAuthor) => {
      const organizer = comment.author_id && organizerIds.includes(comment.author_id) ? 100_000 : 0;
      const likes = (comment.reaction_count ?? 0) * 1_000;
      const replies = Math.min(comment.replies?.length ?? 0, 99) * 10;
      return organizer + likes + replies;
    };
    return [...comments].sort(
      (a, b) => score(b) - score(a) || b.created_at.localeCompare(a.created_at),
    );
  }, [comments, organizerIds, sort]);

  /** Répartition des commentaires optimistes : sous une racine, ou orphelins. */
  const groupedExtras = useMemo(() => {
    const byRoot = new Map<string, ExtraComment[]>();
    const orphan: ExtraComment[] = [];
    const descendantToRoot = new Map<string, string>();
    for (const root of comments) {
      for (const { comment } of descendantsOf(root)) {
        descendantToRoot.set(comment.id, root.id);
      }
    }
    for (const extra of visibleExtras(extras, comments, viewer.id)) {
      const target = extra.parentId
        ? (flattened.has(extra.parentId) ? (descendantToRoot.get(extra.parentId) ?? extra.parentId) : null)
        : null;
      if (target) {
        const list = byRoot.get(target) ?? [];
        list.push(extra);
        byRoot.set(target, list);
      } else {
        orphan.push(extra);
      }
    }
    return { byRoot, orphan, getForRoot: (id: string) => byRoot.get(id) ?? [] };
  }, [extras, comments, viewer.id, descendantsOf, flattened]);

  /*                          
                        Envoi optimiste                            
                        */

  const onSend = useCallback(
    async (text: string, mentions: string[]) => {
      const parentId = replyTo?.id ?? null;
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      extractionRef.current += 1;
      const extraId = `extra-${extractionRef.current}`;
      const created: ExtraComment = {
        id: extraId,
        parentId,
        content: text,
        createdAt: new Date().toISOString(),
        status: offline ? "queued" : "sending",
      };
      setExtras((prev) => [...prev, created]);
      setReplyTo(null);

      if (offline) {
        enqueueComment({ postId: post.id, parentId, content: text });
        return true; /* mis en file : le watcher rejouera à la reconnexion */
      }

      const result = await createComment(post.id, text, parentId ?? undefined, mentions);
      if (result.success) {
        window.setTimeout(() => router.refresh(), 120);
        return true;
      }
      setExtras((prev) =>
        prev.map((extra) => (extra.id === extraId ? { ...extra, status: "error" } : extra)),
      );
      return false; /* le composer garde le texte */
    },
    [replyTo, post.id, router],
  );

  const retryExtra = useCallback(
    async (extra: ExtraComment) => {
      setExtras((prev) =>
        prev.map((item) => (item.id === extra.id ? { ...item, status: "sending" } : item)),
      );
      const result = await createComment(post.id, extra.content, extra.parentId ?? undefined);
      if (result.success) {
        window.setTimeout(() => router.refresh(), 120);
      } else {
        setExtras((prev) =>
          prev.map((item) => (item.id === extra.id ? { ...item, status: "error" } : item)),
        );
      }
    },
    [post.id, router],
  );

  /*                          
                        Poignée de glissement                        
                        */

  const startDrag = (event: React.PointerEvent) => {
    if (event.pointerType !== "touch") return;
    dragStartRef.current = event.clientY;
  };
  const moveDrag = (event: React.PointerEvent) => {
    if (event.pointerType !== "touch" || dragStartRef.current === null) return;
    setDragY(Math.max(0, event.clientY - dragStartRef.current));
  };
  const endDrag = () => {
    if (dragStartRef.current === null) return;
    const dragged = dragY ?? 0;
    dragStartRef.current = null;
    setDragY(null);
    if (dragged > 120) onClose();
  };

  /*                          
                        Rendu                              
                        */

  if (!open) return null;

  const totalCount = post.comment_count + visibleExtras(extras, comments, viewer.id).length;
  const isDragging = dragY !== null;

  const renderNode = (
    role: "root" | "reply",
    key: string,
    node: { comment: CommentWithAuthor; replyToName: string | null } | null,
    extra: ExtraComment | null,
  ) => {
    if (node) {
      return (
        <div key={key} className="min-w-0">
          <CommentItem
            comment={node.comment}
            viewer={viewer}
            organizerIds={organizerIds}
            salonId={post.salon_id}
            isReply={role === "reply"}
            replyToName={node.replyToName ?? undefined}
            nowMs={nowMs}
            onReply={(comment) => {
              const name = comment.author?.display_name ?? "ce commentaire";
              setReplyTo({ id: comment.id, name });
            }}
          />
        </div>
      );
    }
    if (extra) {
      return (
        <ExtraRow
          key={key}
          extra={extra}
          viewer={viewer}
          nowMs={nowMs}
          onRetry={() => void retryExtra(extra)}
        />
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-[60]" data-comments-overlay={post.id}>
      {/* Fond dimmable */}
      <button
        type="button"
        aria-label="Fermer"
        tabIndex={-1}
        className="animate-in fade-in  absolute inset-0 cursor-default bg-black/45 duration-200"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Commentaires · ${totalCount}`}
        className={cn(
          "bg-surface animate-in fade-in  absolute flex flex-col overflow-hidden shadow-2xl ring-1 ring-black/5 duration-200 max-md:slide-in-from-bottom-6",
          /* Mobile : feuille quasi plein écran, sous la zone sûre de l'encoche. */
          "max-md:inset-x-0 max-md:bottom-0 max-md:top-[max(2rem,env(safe-area-inset-top))] max-md:rounded-t-3xl",
          /* Desktop : vraie boîte de dialogue centrée, pas un tiroir de téléphone. */
          "md:left-1/2 md:top-1/2 md:h-[min(80dvh,46rem)] md:w-[42rem] md:max-w-[calc(100vw-4rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl",
          !isDragging && "transition-transform duration-200 ease-[var(--ease-out-soft)]",
        )}
        style={{
          transform: dragY !== null ? `translateY(${dragY}px)` : undefined,
          /* Clavier visuel : on remonte le bas du panneau, on ne translate pas
             tout l'écran (sinon l'en-tête sort de la fenêtre). */
          bottom: kbInset > 0 ? kbInset : undefined,
        }}
      >
        {/* En-tête + poignée de glissement */}
        <div
          className="border-border relative shrink-0 cursor-grab touch-none border-b px-4 pt-2 pb-2.5 md:cursor-default active:cursor-grabbing"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <span
            aria-hidden="true"
            className="bg-border mx-auto mb-2 block h-1.5 w-10 rounded-full md:hidden"
          />
          <div className="flex items-center justify-between">
            <h2 className="text-fg text-sm font-bold tracking-wide">Commentaires</h2>
            <div className="flex items-center gap-1.5">
              <span className="text-fg-subtle text-xs font-semibold tabular-nums">{totalCount}</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer les commentaires"
                className="text-fg-muted press hover:bg-bg-muted inline-flex size-11 items-center justify-center rounded-full"
              >
                <X className="size-4.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Tri + indicateur de saisie */}
        <div className="border-border flex shrink-0 items-center justify-between gap-2 border-b px-4 py-2">
          <div role="tablist" aria-label="Trier les commentaires" className="bg-bg-subtle flex gap-1 rounded-full p-1">
            {(
              [
                { key: "pertinents", label: "Pertinents" },
                { key: "recents", label: "Récents" },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={sort === item.key}
                onClick={() => setSort(item.key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
                  sort === item.key ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          {typingNames.length > 0 ? (
            <p className="text-primary inline-flex items-center gap-1.5 text-xs font-semibold" aria-live="polite">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-current" />
              </span>
              {typingNames.length} écrivent…
            </p>
          ) : null}
        </div>

        {/* Fil */}
        <div
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          className="flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-3"
        >
          {roots.length === 0 && groupedExtras.orphan.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <span className="bg-primary/10 text-primary inline-flex size-14 items-center justify-center rounded-full">
                <Inbox className="size-6" aria-hidden="true" />
              </span>
              <p className="text-fg text-sm font-semibold">Soyez le premier à réagir</p>
              <p className="text-fg-muted max-w-60 text-xs">
                Pose une question, partage un coup de cœur, échange avec les organisateurs ici.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-5">
            {roots.map((root) => {
              const allReplies = descendantsOf(root);
              const expanded = expandedIds.has(root.id);
              const shownReplies = expanded ? allReplies : allReplies.slice(0, 2);
              const rootExtras = groupedExtras.getForRoot(root.id);
              const hasThreadColumn = shownReplies.length > 0 || rootExtras.length > 0;

              return (
                <div key={root.id} className="min-w-0">
                  {renderNode("root", root.id, { comment: root, replyToName: null }, null)}

                  {hasThreadColumn ? (
                    <div className="border-border mt-1.5 w-min min-w-full space-y-2.5 border-l-2 pl-3 md:ml-4">
                      {shownReplies.map((reply) => renderNode("reply", reply.comment.id, reply, null))}
                      {rootExtras.map((extra) => renderNode("reply", extra.id, null, extra))}
                    </div>
                  ) : null}

                  {allReplies.length > shownReplies.length ? (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(root.id)) next.delete(root.id);
                          else next.add(root.id);
                          return next;
                        })
                      }
                      aria-expanded={expanded}
                      className="text-primary ml-9 mt-2 inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                    >
                      <ArrowDown
                        className={cn("size-3.5 transition-transform duration-200", expanded && "rotate-180")}
                        aria-hidden="true"
                      />
                      {expanded ? "Masquer les réponses" : `Voir les ${allReplies.length - shownReplies.length} réponses`}
                    </button>
                  ) : null}
                </div>
              );
            })}

            {/* Commentaires optimistes sans parent visible */}
            {groupedExtras.orphan.map((extra) => renderNode("root", extra.id, null, extra))}
          </div>
        </div>

        {/* Composer */}
        {signed ? (
          <CommentComposer
            draftKey={`salon.comment.${post.id}`}
            viewer={viewer}
            members={members}
            onSend={onSend}
            onTyping={broadcastTyping}
            replyingTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
          />
        ) : (
          <div
            className="border-border border-t p-4 text-sm"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            <p className="text-fg-muted">
              <a
                href={`/connexion?redirect=${encodeURIComponent(`/salons/${post.salon_id}`)}`}
                className="text-primary font-semibold underline underline-offset-2"
              >
                Connecte-toi
              </a>{" "}
              pour participer à la conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Utilitaires ------------------------------- */

/** Extras toujours pertinentes : jamais echo du serveur, jamais marquées comme erreur seule. */
function visibleExtras(
  extras: ExtraComment[],
  comments: CommentWithAuthor[],
  viewerId: string | null,
): ExtraComment[] {
  if (extras.length === 0 || !viewerId) return [];
  const server = new Set<string>();
  const visit = (comment: CommentWithAuthor) => {
    if (comment.author_id === viewerId) server.add(comment.content);
    (comment.replies ?? []).forEach(visit);
  };
  comments.forEach(visit);
  return extras.filter((extra) => extra.status !== "error" && !server.has(extra.content));
}

/* -------------------------- Ligne optimiste -------------------------------- */

function ExtraRow({
  extra,
  viewer,
  nowMs,
  onRetry,
}: {
  extra: ExtraComment;
  viewer: ViewerInfo;
  nowMs: number;
  onRetry: () => void;
}) {
  return (
    <article className="flex min-w-0 gap-2.5">
      <Avatar src={viewer.avatarUrl} name={viewer.name} size="sm" />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "rounded-2xl rounded-bl-md px-3.5 py-2.5 transition-opacity",
            extra.status === "error" ? "bg-danger-subtle" : "bg-bg-subtle opacity-80",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-fg text-[15px] font-semibold">{viewer.name}</span>
            <span className="text-fg-subtle text-xs">
              {extra.status === "queued"
                ? "en attente de réseau"
                : formatRelative(new Date(extra.createdAt), new Date(nowMs))}
            </span>
            {extra.status === "sending" ? (
              <LoaderCircle className="text-fg-subtle size-3.5 animate-spin" aria-hidden="true" />
            ) : null}
          </div>
          <LinkifiedContent text={extra.content} className="text-fg mt-0.5 text-[15px] leading-relaxed" />
          {extra.status === "error" ? (
            <button
              type="button"
              onClick={onRetry}
              className="text-danger mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" /> Réessayer
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
