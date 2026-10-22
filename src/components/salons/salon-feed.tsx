"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  Inbox,
  LoaderCircle,
  Megaphone,
  MessageSquareDashed,
  Pin,
  WifiOff,
} from "lucide-react";

import type { CommentWithAuthor, PostWithAuthor } from "@/lib/salons/types";
import { createComment, markSalonReadForMember } from "@/lib/salons/actions";
import {
  CATEGORY_LABELS,
  POST_CATEGORY_ORDER,
  type MentionOption,
  type ViewerInfo,
} from "@/components/salons/salon-shared";
import { SalonPostCard } from "@/components/salons/salon-post-card";
import { PostComposer } from "@/components/salons/post-composer";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  bumpAttempt,
  dequeueComment,
  getOutboxSnapshot,
  getOutboxVersion,
  subscribeOutbox,
} from "@/lib/ui/offline-queue";
import { cn } from "@/lib/utils";

/* =============================================================================
   Fil des publications (refonte)
   --------------------------------------------------------------------------
   Composeur (invitation desktop + bouton flottant mobile), puces de filtrage
   (Tout / Épinglés / Annonces / Médias / Questions sans réponse / catégories),
   séparateur des non-lus, bouton « Voir les nouvelles publications » branché
   sur le temps réel (sans sauter la page), défilement infini avec squelettes,
   navigation clavier j/k, commentaires hors-ligne re-joués à la reconnexion.
   ========================================================================== */

const PAGE_SIZE = 20;

type FeedFilter = "all" | "pinned" | "announcements" | "media" | "unanswered";

const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "pinned", label: "Épinglés" },
  { key: "announcements", label: "Annonces" },
  { key: "media", label: "Médias" },
  { key: "unanswered", label: "Questions sans réponse" },
];

function feedOrder(a: PostWithAuthor, b: PostWithAuthor): number {
  if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
  return b.created_at.localeCompare(a.created_at);
}

export function SalonFeed({
  salonId,
  posts,
  commentsByPost,
  viewer,
  organizerIds,
  members,
  allowMedia,
  canAnnounce,
  nowMs,
  lastReadAt,
}: {
  salonId: string;
  posts: PostWithAuthor[];
  commentsByPost: Record<string, CommentWithAuthor[]>;
  viewer: ViewerInfo;
  organizerIds: string[];
  members: MentionOption[];
  allowMedia: boolean;
  canAnnounce: boolean;
  nowMs: number;
  lastReadAt: string | null;
}) {
  const router = useRouter();
  const [loaded, setLoaded] = useState<PostWithAuthor[]>(() => [...posts].sort(feedOrder));
  const [loadingMore, setLoadingMore] = useState(false);
  const [exhausted, setExhausted] = useState(posts.length < PAGE_SIZE);
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [pendingNew, setPendingNew] = useState(0);
  const [online, setOnline] = useState(true);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLButtonElement>(null);
  const loadedRef = useRef(loaded);
  const onlineRef = useRef(online);

  /* ------------------------------ Synchro refs ------------------------------ */

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      loadedRef.current = loaded;
      onlineRef.current = online;
    });
    return () => window.cancelAnimationFrame(raf);
  }, [loaded, online]);

  /* Réception des publications rafraîchies par le serveur : on ne réagit
     qu'à un vrai changement des posts SERVEUR (clé d'ids), jamais quand la
     liste locale a grandi par pagination — sinon les pages suivantes seraient
     écrasées à chaque rafraîchissement. */
  const serverKeyRef = useRef(posts.map((post) => post.id).join(","));
  useEffect(() => {
    const key = posts.map((post) => post.id).join(",");
    if (key === serverKeyRef.current) return;
    serverKeyRef.current = key;
    window.requestAnimationFrame(() => {
      setLoaded([...posts].sort(feedOrder));
      setExhausted(posts.length < PAGE_SIZE);
      setPendingNew(0);
    });
  }, [posts]);

  /* --------------------------- Réseau + hors-ligne --------------------------- */

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    const raf = window.requestAnimationFrame(sync);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const outboxCount = useSyncExternalStore(subscribeOutbox, getOutboxVersion, () => 0);

  /* ---------------------------- Marque radar : lu ---------------------------- */

  const firstUnreadIndex = useMemo(() => {
    if (!lastReadAt || !viewer.id) return null;
    const index = loaded.findIndex(
      (post) => new Date(post.created_at).getTime() > new Date(lastReadAt).getTime(),
    );
    /* les épinglés remontent en tête mais ne sont pas forcément des nouveautés */
    return index >= 0 ? index : null;
  }, [loaded, lastReadAt, viewer.id]);

  const hasUnread = firstUnreadIndex !== null;

  useEffect(() => {
    if (!viewer.id || !hasUnread) return;
    /* Marque « lu » pour LE membre courant (sans refresh : le séparateur reste). */
    window.setTimeout(() => {
      void markSalonReadForMember(salonId);
    }, 1200);
  }, [viewer.id, hasUnread, salonId]);

  /* ------------------------------- Temps réel -------------------------------- */

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    const channel = client.channel(`salon-posts:${salonId}`);
    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts", filter: `salon_id=eq.${salonId}` }, () => {
        setPendingNew((value) => value + 1);
      })
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [salonId]);

  const showNewPosts = () => {
    setPendingNew(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
    router.refresh();
  };

  /* --------------------------- Défilement infini ----------------------------- */

  const loadMore = useCallback(async () => {
    if (loadingMore || exhausted) return;
    setLoadingMore(true);
    try {
      const offset = loadedRef.current.length;
      const response = await fetch(
        `/api/salons/${salonId}/posts?offset=${offset}&limit=${PAGE_SIZE}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("chargement impossible");
      const data = (await response.json()) as { posts: PostWithAuthor[] };
      const fresh = data.posts ?? [];
      setLoaded((prev) => {
        const known = new Set(prev.map((post) => post.id));
        const merged = prev.concat(fresh.filter((post) => !known.has(post.id))).sort(feedOrder);
        return merged;
      });
      if (fresh.length < PAGE_SIZE) setExhausted(true);
    } catch {
      /* réseau instable : on réautorise la tentative au prochain passage */
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, exhausted, salonId]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || exhausted) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) void loadMore();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, exhausted]);

  /* ------------------------- Navigation clavier j/k -------------------------- */

  const onKeyDown = (event: React.KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
    if (event.key !== "j" && event.key !== "k") return;
    event.preventDefault();
    const list = loaded.filter(matchFilter(filter, categoryFilter));
    const currentId = focusedId ?? list[0]?.id ?? null;
    if (!currentId) return;
    const index = list.findIndex((post) => post.id === currentId);
    const next = event.key === "j" ? index + 1 : index - 1;
    const nextPost = list[Math.max(0, Math.min(next, list.length - 1))];
    if (!nextPost) return;
    setFocusedId(nextPost.id);
    document
      .getElementById(`post-${nextPost.id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  /* -------------------------------- Filtres ---------------------------------- */

  const filtered = useMemo(
    () => loaded.filter(matchFilter(filter, categoryFilter)),
    [loaded, filter, categoryFilter],
  );

  /* -------------------------------- Rendu ------------------------------------ */

  return (
    <div className="flex flex-col gap-5" onKeyDown={onKeyDown}>
      {/* Composeur / invitation */}
      {viewer.id ? (
        <PostComposer
          salonId={salonId}
          viewer={viewer}
          allowMedia={allowMedia}
          canAnnounce={canAnnounce}
        />
      ) : (
        <div className="border-border flex flex-col gap-3 rounded-2xl border border-dashed px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-fg-muted text-sm">
            Connecte-toi pour publier, réagir et suivre ce salon.
          </p>
          <a
            href={`/connexion?redirect=${encodeURIComponent(`/salons/${salonId}`)}`}
            className="bg-primary-solid text-primary-solid-fg inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-bold"
          >
            Se connecter
          </a>
        </div>
      )}

      {/* Indicateurs réseau + file hors-ligne */}
      {(!online || outboxCount > 0) && viewer.id ? (
        <p
          role="status"
          className="bg-warning-subtle text-accent-subtle-fg flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold"
        >
          <WifiOff className="size-3.5" aria-hidden="true" />
          {!online
            ? `Hors ligne — ${outboxCount > 0 ? `${outboxCount} commentaire${outboxCount > 1 ? "s" : ""} en file d’attente` : "le fil chargé reste consultable"}`
            : `${outboxCount} commentaire${outboxCount > 1 ? "s" : ""} en attente d’envoi…`}
        </p>
      ) : null}

      {/* Puces de filtrage */}
      <nav aria-label="Filtrer les publications" className="flex flex-col gap-2">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              aria-pressed={filter === item.key}
              className={cn(
                "press shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors duration-150",
                filter === item.key
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-fg-muted hover:text-fg",
              )}
            >
              {item.key === "pinned" ? <Pin className="mr-1 inline size-3.5" aria-hidden="true" /> : null}
              {item.key === "announcements" ? (
                <Megaphone className="mr-1 inline size-3.5" aria-hidden="true" />
              ) : null}
              {item.label}
            </button>
          ))}
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {POST_CATEGORY_ORDER.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategoryFilter(categoryFilter === key ? null : key)}
              aria-pressed={categoryFilter === key}
              className={cn(
                "press shrink-0 rounded-full border px-3 py-1.5 text-2xs font-semibold transition-colors duration-150",
                categoryFilter === key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-fg-muted hover:text-fg",
              )}
            >
              {CATEGORY_LABELS[key]}
            </button>
          ))}
        </div>
      </nav>

      {/* « Voir les nouvelles publications » (n'apparaît qu'avec du vrai temps réel) */}
      {pendingNew > 0 ? (
        <div className="sticky top-16 z-30 flex justify-center">
          <button
            type="button"
            onClick={showNewPosts}
            className="bg-accent-solid text-accent-solid-fg press shadow-xl inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold"
          >
            <MessageSquareDashed className="size-4" aria-hidden="true" />
            Voir les nouvelles publications
            <span className="bg-accent-solid-fg/20 inline-flex rounded-full px-1.5 py-0.5 font-semibold tabular-nums">
              {pendingNew}
            </span>
          </button>
        </div>
      ) : null}

      {/* Fil */}
      <div
        role="feed"
        aria-busy={loadingMore}
        aria-label="Publications du salon"
        className="flex gap-5"
      >
        <div className="flex min-w-0 flex-col gap-4">
          {filtered.length === 0 && !loadingMore ? (
            <FeedEmpty
              filter={filter}
              onReset={() => {
                setFilter("all");
                setCategoryFilter(null);
              }}
            />
          ) : null}

          {filtered.map((post, index) => (
            <div key={post.id}>
              {index === firstUnreadIndex ? (
                <div
                  role="separator"
                  aria-label="Publications non lues"
                  className="mb-4 flex items-center gap-3 first:mb-0"
                >
                  <span className="bg-accent-subtle-fg/30 h-px flex-1" aria-hidden="true" />
                  <span className="text-accent-subtle-fg bg-accent-subtle text-2xs rounded-full px-2.5 py-1 font-bold tracking-[0.08em] whitespace-nowrap uppercase">
                    Non lu depuis ta dernière visite
                  </span>
                  <span className="bg-accent-subtle-fg/30 h-px flex-1" aria-hidden="true" />
                </div>
              ) : null}
              <div className={cn(focusedId === post.id && "rounded-2xl ring-2 ring-border-focus")}>
                <SalonPostCard
                  post={post}
                  comments={commentsByPost[post.id] ?? []}
                  viewer={viewer}
                  organizerIds={organizerIds}
                  members={members}
                  nowMs={nowMs}
                  isNew={firstUnreadIndex !== null && index >= firstUnreadIndex}
                />
              </div>
            </div>
          ))}

          {loadingMore ? <FeedSkeleton /> : null}

          {!exhausted && !loadingMore ? (
            <button
              ref={sentinelRef}
              type="button"
              onClick={() => void loadMore()}
              className="text-primary bg-surface border-border mx-auto inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold shadow-sm"
            >
              <LoaderCircle className="size-4" aria-hidden="true" />
              Charger plus de publications
            </button>
          ) : null}
        </div>
      </div>

      {/* Rejoueur des commentaires hors-ligne */}
      {viewer.id ? <OfflineCommentsWatcher postIds={loaded.map((post) => post.id)} online={online} /> : null}
    </div>
  );
}

/* ------------------------------ Utilitaires --------------------------------- */

function matchFilter(
  filter: FeedFilter,
  categoryFilter: string | null,
): (post: PostWithAuthor) => boolean {
  return (post) => {
    if (categoryFilter && post.category !== categoryFilter) return false;
    switch (filter) {
      case "pinned":
        return post.is_pinned;
      case "announcements":
        return post.kind === "announcement";
      case "media":
        return post.media.length > 0;
      case "unanswered":
        return post.category === "question";
      default:
        return true;
    }
  };
}function FeedEmpty({
  filter,
  onReset,
}: {
  filter: FeedFilter;
  onReset: () => void;
}) {
  if (filter !== "all") {
    return (
      <div className="border-border bg-surface flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-12 text-center">
        <span className="bg-bg-subtle text-fg-muted inline-flex size-12 items-center justify-center rounded-full">
          <Inbox className="size-5" aria-hidden="true" />
        </span>
        <p className="text-fg text-sm font-semibold">Aucune publication ici pour l’instant</p>
        <p className="text-fg-muted text-xs">Le reste du fil contient peut-être ce que tu cherches.</p>
        <button
          type="button"
          onClick={onReset}
          className="text-primary mt-1 text-xs font-semibold hover:underline"
        >
          Voir tout le fil
        </button>
      </div>
    );
  }
  return (
    <div className="border-border bg-surface flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center">
      <span className="bg-primary/10 text-primary inline-flex size-14 items-center justify-center rounded-full">
        <MessageSquareDashed className="size-6" aria-hidden="true" />
      </span>
      <p className="text-fg text-base font-semibold">Le salon attend son premier message</p>
      <p className="text-fg-muted max-w-72 text-sm">
        Sois la première personne à publier : une info, une photo, une question — tout définit
        l’ambiance de l’événement.
      </p>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      {[0, 1, 2].map((index) => (
        <div key={index} className="bg-surface border-border animate-pulse rounded-2xl border p-5">
          <div className="flex items-center gap-3">
            <div className="bg-bg-muted size-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="bg-bg-muted h-3.5 w-32 rounded-full" />
              <div className="bg-bg-muted h-3 w-20 rounded-full" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="bg-bg-muted h-3.5 w-full rounded-full" />
            <div className="bg-bg-muted h-3.5 w-4/5 rounded-full" />
          </div>
          <div className="bg-bg-muted mt-4 h-40 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/* ----------------------- Rejoueur hors-ligne -------------------------------- */

function OfflineCommentsWatcher({ postIds, online }: { postIds: string[]; online: boolean }) {
  const router = useRouter();
  const idsRef = useRef("");

  useEffect(() => {
    idsRef.current = postIds.join(",");
  }, [postIds]);

  useEffect(() => {
    let running = false;
    const drain = async () => {
      if (running) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      running = true;
      try {
        const known = new Set(idsRef.current.split(",").filter(Boolean));
        const queue = getOutboxSnapshot();
        for (const entry of queue) {
          /* Ne rejoue que les commentaires de CE salon : les autres attendent
             leur salon actif. Après 4 échecs, l'entrée reste visible dans le
             compteur d'attente (aucune perte silencieuse). */
          if (!known.has(entry.postId)) continue;
          const result = await createComment(entry.postId, entry.content, entry.parentId ?? undefined);
          if (result.success) {
            dequeueComment(entry.id);
            router.refresh();
          } else if (entry.attempts >= 4) {
            /* conservé en file : jamais perdu silencieusement */
          } else {
            bumpAttempt(entry.id);
            break; /* on reprendra au prochain cycle */
          }
        }
      } finally {
        running = false;
      }
    };

    const interval = window.setInterval(() => void drain(), 30_000);
    const onOnline = () => void drain();
    window.addEventListener("online", onOnline);
    if (online) window.setTimeout(() => void drain(), 4000);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", onOnline);
    };
  }, [online, router]);

  return null;
}
