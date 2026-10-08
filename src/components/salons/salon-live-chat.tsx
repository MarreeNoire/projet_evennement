"use client";

import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  Check,
  Circle,
  LoaderCircle,
  MessageCircle,
  Pencil,
  Reply,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { Avatar } from "@/components/ui/avatar";
import {
  deleteSalonChatMessage,
  editSalonChatMessage,
  sendSalonChatMessage,
  toggleSalonChatReaction,
} from "@/lib/salons/actions";
import type { SalonChatMessageWithAuthor } from "@/lib/salons/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const REACTIONS = [
  { key: "heart", emoji: "❤️", label: "J'aime" },
  { key: "laugh", emoji: "😂", label: "Amusant" },
  { key: "fire", emoji: "🔥", label: "Marquant" },
  { key: "clap", emoji: "👏", label: "Bravo" },
  { key: "wow", emoji: "😮", label: "Surprenant" },
] as const;

type SalonProfile = { id: string; display_name: string; avatar_url: string | null };

export function SalonLiveChat({
  salonId,
  messages: initialMessages,
  profile,
}: {
  salonId: string;
  messages: SalonChatMessageWithAuthor[];
  profile: SalonProfile | null;
}) {
  const router = useRouter();
  const [messages] = useOptimistic(initialMessages);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingExpiry = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const previousIds = useRef(new Set(initialMessages.map((message) => message.id)));
  const nearBottom = useRef(true);
  const profileId = profile?.id;
  const profileName = profile?.display_name;

  useEffect(() => {
    const previous = previousIds.current;
    const arriving = initialMessages.filter((message) => !previous.has(message.id));
    previousIds.current = new Set(initialMessages.map((message) => message.id));

    let frame: number | undefined;
    if (arriving.length) {
      if (nearBottom.current) {
        frame = requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
          setNewCount(0);
        });
      } else {
        frame = requestAnimationFrame(() => setNewCount((count) => count + arriving.length));
      }
    } else if (previous.size === 0 && initialMessages.length > 0) {
      frame = requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }));
    }

    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [initialMessages]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const expiryTimers = typingExpiry.current;
    const channel = supabase
      .channel(`salon-live:${salonId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "salon_chat_messages",
          filter: `salon_id=eq.${salonId}`,
        },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "salon_chat_reactions",
          filter: `salon_id=eq.${salonId}`,
        },
        () => router.refresh(),
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<
          string,
          Array<{ user_id?: string; display_name?: string }>
        >;
        const people = Object.values(state).flat();
        setOnlineCount(Object.keys(state).length);
        setTypingNames((current) =>
          current.filter((name) => people.some((person) => person.display_name === name)),
        );
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const update = payload as { user_id?: string; display_name?: string; typing?: boolean };
        if (!update.user_id || update.user_id === profileId || !update.display_name) return;
        const name = update.display_name;
        const previousTimeout = typingExpiry.current.get(update.user_id);
        if (previousTimeout) clearTimeout(previousTimeout);

        if (update.typing) {
          setTypingNames((current) => (current.includes(name) ? current : [...current, name]));
          typingExpiry.current.set(
            update.user_id,
            setTimeout(() => {
              setTypingNames((current) => current.filter((item) => item !== name));
              typingExpiry.current.delete(update.user_id!);
            }, 1800),
          );
        } else {
          setTypingNames((current) => current.filter((item) => item !== name));
          typingExpiry.current.delete(update.user_id);
        }
      });

    channelRef.current = channel;
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED" && profileId && profileName) {
        void channel.track({ user_id: profileId, display_name: profileName });
      }
    });

    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      for (const timeout of expiryTimers.values()) clearTimeout(timeout);
      expiryTimers.clear();
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [profileId, profileName, router, salonId]);

  const visibleMessages = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    if (!query) return messages;
    return messages.filter((message) => message.content.toLocaleLowerCase("fr").includes(query));
  }, [messages, search]);

  const replyMessage = messages.find((message) => message.id === replyTo) ?? null;

  function broadcastTyping(typing: boolean) {
    if (!profile || !channelRef.current) return;
    void channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: profile.id, display_name: profile.display_name, typing },
    });
  }

  function handleContentChange(value: string) {
    setContent(value);
    if (!value.trim()) {
      broadcastTyping(false);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      return;
    }
    broadcastTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => broadcastTyping(false), 1300);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = content.trim();
    if (!value || !profile || pending) return;
    setError(null);
    broadcastTyping(false);

    startTransition(async () => {
      const result = editingId
        ? await editSalonChatMessage(editingId, value)
        : await sendSalonChatMessage(salonId, value, replyTo);

      if (!result.success) {
        setError(result.error ?? "Le message n'a pas pu être envoyé.");
        return;
      }

      setContent("");
      setReplyTo(null);
      setEditingId(null);
      nearBottom.current = true;
      setNewCount(0);
      router.refresh();
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    });
  }

  function startReply(message: SalonChatMessageWithAuthor) {
    setEditingId(null);
    setContent("");
    setReplyTo(message.id);
    document.getElementById("salon-live-chat-input")?.focus();
  }

  function startEdit(message: SalonChatMessageWithAuthor) {
    setReplyTo(null);
    setEditingId(message.id);
    setContent(message.content);
    document.getElementById("salon-live-chat-input")?.focus();
  }

  function cancelComposeMode() {
    setReplyTo(null);
    setEditingId(null);
    setContent("");
  }

  function handleReaction(messageId: string, reaction: (typeof REACTIONS)[number]["key"]) {
    if (!profile) return;
    startTransition(async () => {
      const result = await toggleSalonChatReaction(salonId, messageId, reaction);
      if (result.success) router.refresh();
      else setError(result.error ?? "La réaction n'a pas pu être enregistrée.");
    });
  }

  function handleDelete(messageId: string) {
    startTransition(async () => {
      const result = await deleteSalonChatMessage(messageId);
      if (result.success) router.refresh();
      else setError(result.error ?? "Le message n'a pas pu être supprimé.");
    });
  }

  return (
    <section className="border-border bg-surface flex min-h-[70dvh] flex-col overflow-hidden rounded-2xl border shadow-sm">
      <header className="border-border flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-primary-subtle text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
            <MessageCircle className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-fg truncate text-sm font-bold sm:text-base">
              La conversation du salon
            </h2>
            <div className="text-fg-muted mt-0.5 flex items-center gap-1.5 text-xs">
              <Circle className="size-2 fill-emerald-500 text-emerald-500" aria-hidden="true" />
              {onlineCount} en ligne
              {typingNames.length > 0 ? (
                <span aria-live="polite" className="truncate">
                  · {typingNames.slice(0, 2).join(", ")}
                  {typingNames.length > 2 ? ` et ${typingNames.length - 2} autre(s)` : ""} écrit
                  {typingNames.length > 1 ? "vent" : ""}…
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setSearchOpen((open) => !open);
            setSearch("");
          }}
          aria-label={searchOpen ? "Fermer la recherche" : "Rechercher dans le chat"}
          aria-expanded={searchOpen}
          className="text-fg-muted hover:bg-bg-muted hover:text-fg flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors"
        >
          {searchOpen ? <X className="size-4" /> : <Search className="size-4" />}
        </button>
      </header>

      {searchOpen ? (
        <div className="border-border bg-bg-subtle border-b px-4 py-3 sm:px-5">
          <label htmlFor="salon-chat-search" className="sr-only">
            Rechercher un message
          </label>
          <input
            id="salon-chat-search"
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher dans les derniers messages…"
            className="border-border bg-surface focus:border-primary w-full rounded-xl border px-3 py-2.5 text-base outline-none sm:text-sm"
          />
          <p className="text-fg-subtle mt-1.5 text-xs">
            {search
              ? `${visibleMessages.length} résultat(s) dans les 80 derniers messages`
              : "Recherche dans les 80 derniers messages"}
          </p>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        onScroll={(event) => {
          const element = event.currentTarget;
          nearBottom.current =
            element.scrollHeight - element.scrollTop - element.clientHeight < 120;
          if (nearBottom.current) setNewCount(0);
        }}
        className="bg-bg-subtle/60 relative flex-1 space-y-4 overflow-y-auto px-3 py-5 sm:px-5"
        aria-label="Messages du salon"
      >
        {newCount > 0 ? (
          <button
            type="button"
            onClick={() => {
              nearBottom.current = true;
              setNewCount(0);
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            className="bg-primary-solid text-primary-solid-fg sticky top-1 z-10 mx-auto flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-lg"
          >
            {newCount} nouveau{newCount > 1 ? "x" : ""} message{newCount > 1 ? "s" : ""}
            <ArrowDown className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}

        {visibleMessages.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="bg-primary-subtle text-primary mb-3 flex size-12 items-center justify-center rounded-2xl">
              <MessageCircle className="size-5" aria-hidden="true" />
            </div>
            <h3 className="text-fg font-semibold">
              {search ? "Aucun message trouvé" : "Lance la conversation"}
            </h3>
            <p className="text-fg-muted mt-1 max-w-sm text-sm">
              {search
                ? "Essaie un autre mot dans les messages récents."
                : "Présente-toi, pose une question ou aide les autres participants à préparer l'événement."}
            </p>
          </div>
        ) : (
          visibleMessages.map((message, index) => {
            const previous = visibleMessages[index - 1];
            const showDate = !previous || !isSameDay(previous.created_at, message.created_at);
            const own = profile?.id === message.author_id;
            const name = message.author?.display_name ?? "Participant";
            const parent = messages.find((item) => item.id === message.reply_to);

            return (
              <div key={message.id}>
                {showDate ? <DateDivider date={message.created_at} /> : null}
                <article
                  id={`salon-message-${message.id}`}
                  className={cn("group flex gap-2.5", own && "flex-row-reverse")}
                >
                  {own ? null : (
                    <Avatar
                      src={message.author?.avatar_url}
                      name={name}
                      size="sm"
                      className="mt-1 shrink-0"
                    />
                  )}
                  <div className={cn("max-w-[88%] min-w-0 sm:max-w-[78%]", own && "items-end")}>
                    <div className={cn("mb-1 flex items-baseline gap-2", own && "justify-end")}>
                      <span className="text-fg text-xs font-semibold">{own ? "Toi" : name}</span>
                      <time className="text-fg-subtle text-[11px]" dateTime={message.created_at}>
                        {formatClock(message.created_at)}
                      </time>
                      {message.edited_at ? (
                        <span className="text-fg-subtle text-[10px]">modifié</span>
                      ) : null}
                    </div>

                    <div
                      className={cn(
                        "border-border rounded-2xl border px-3.5 py-2.5 shadow-sm sm:px-4",
                        own
                          ? "bg-primary-solid text-primary-solid-fg rounded-tr-md"
                          : "bg-surface text-fg rounded-tl-md",
                      )}
                    >
                      {message.reply_to ? (
                        <button
                          type="button"
                          onClick={() =>
                            document
                              .getElementById(`salon-message-${message.reply_to}`)
                              ?.scrollIntoView({ behavior: "smooth", block: "center" })
                          }
                          className={cn(
                            "mb-2 block w-full border-l-2 pl-2 text-left text-xs opacity-80",
                            own ? "border-white/60" : "border-primary",
                          )}
                        >
                          <span className="block font-semibold">
                            En réponse à {parent?.author?.display_name ?? "un participant"}
                          </span>
                          <span className="line-clamp-1">
                            {parent?.content ?? "Message précédent"}
                          </span>
                        </button>
                      ) : null}
                      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>

                    <div
                      className={cn("mt-1 flex flex-wrap items-center gap-1", own && "justify-end")}
                    >
                      {REACTIONS.map(({ key, emoji, label }) => {
                        const count = message.reactions.filter(
                          (item) => item.reaction === key,
                        ).length;
                        const selected = message.my_reactions.includes(key);
                        if (count === 0 && !selected) return null;
                        return (
                          <button
                            key={key}
                            type="button"
                            disabled={!profile || pending}
                            onClick={() => handleReaction(message.id, key)}
                            aria-label={`${label}, ${count}${selected ? ", sélectionné" : ""}`}
                            aria-pressed={selected}
                            className={cn(
                              "border-border bg-surface inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs transition-colors",
                              selected && "border-primary bg-primary-subtle",
                            )}
                          >
                            <span aria-hidden="true">{emoji}</span>
                            <span className="text-fg-muted">{count}</span>
                          </button>
                        );
                      })}

                      {profile ? (
                        <div className="flex items-center opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                          <div
                            className="flex items-center"
                            role="group"
                            aria-label="Réagir au message"
                          >
                            {REACTIONS.map(({ key, emoji, label }) => (
                              <button
                                key={key}
                                type="button"
                                disabled={pending}
                                onClick={() => handleReaction(message.id, key)}
                                aria-label={label}
                                title={label}
                                className="text-fg-subtle hover:bg-surface hover:text-fg flex size-8 items-center justify-center rounded-full text-sm transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => startReply(message)}
                            aria-label="Répondre à ce message"
                            title="Répondre"
                            className="text-fg-subtle hover:bg-surface hover:text-fg flex size-8 items-center justify-center rounded-full transition-colors"
                          >
                            <Reply className="size-3.5" aria-hidden="true" />
                          </button>
                          {own ? (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(message)}
                                aria-label="Modifier ce message"
                                title="Modifier"
                                className="text-fg-subtle hover:bg-surface hover:text-fg flex size-8 items-center justify-center rounded-full transition-colors"
                              >
                                <Pencil className="size-3.5" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm("Supprimer ce message du chat ?")) {
                                    handleDelete(message.id);
                                  }
                                }}
                                disabled={pending}
                                aria-label="Supprimer ce message"
                                title="Supprimer"
                                className="text-fg-subtle hover:bg-danger-subtle hover:text-danger flex size-8 items-center justify-center rounded-full transition-colors"
                              >
                                <Trash2 className="size-3.5" aria-hidden="true" />
                              </button>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {profile ? (
        <div className="border-border bg-surface border-t p-3 sm:p-4">
          {replyMessage || editingId ? (
            <div className="bg-bg-subtle mb-3 flex items-center gap-2 rounded-xl px-3 py-2.5">
              {editingId ? (
                <Pencil className="text-primary size-4 shrink-0" />
              ) : (
                <Reply className="text-primary size-4 shrink-0" />
              )}
              <p className="text-fg-muted min-w-0 flex-1 truncate text-xs">
                {editingId
                  ? "Tu modifies ton message"
                  : `Réponse à ${replyMessage?.author?.display_name ?? "un participant"} : ${replyMessage?.content ?? ""}`}
              </p>
              <button
                type="button"
                onClick={cancelComposeMode}
                aria-label="Annuler"
                className="text-fg-muted hover:bg-surface flex size-8 shrink-0 items-center justify-center rounded-full"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="flex items-end gap-2.5">
            <Avatar
              src={profile.avatar_url}
              name={profile.display_name}
              size="sm"
              className="mb-1 hidden shrink-0 sm:block"
            />
            <label htmlFor="salon-live-chat-input" className="sr-only">
              Écrire dans le chat du salon
            </label>
            <textarea
              id="salon-live-chat-input"
              value={content}
              onChange={(event) => handleContentChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              maxLength={4000}
              placeholder="Écris un message…"
              className="border-border bg-bg-subtle focus:border-primary max-h-32 min-h-12 flex-1 resize-y rounded-2xl border px-4 py-3 text-base leading-relaxed outline-none sm:text-sm"
            />
            <button
              type="submit"
              disabled={pending || !content.trim()}
              aria-label={editingId ? "Enregistrer les modifications" : "Envoyer le message"}
              aria-busy={pending}
              className="bg-primary-solid text-primary-solid-fg hover:bg-primary-solid-hover flex size-12 shrink-0 items-center justify-center rounded-2xl transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : editingId ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Send className="size-4" aria-hidden="true" />
              )}
            </button>
          </form>
          <div className="text-fg-subtle mt-2 flex items-center justify-between pl-1 text-[11px]">
            <span>Entrée pour envoyer · Maj + Entrée pour une nouvelle ligne</span>
            {content.length > 3500 ? <span>{4000 - content.length}</span> : null}
          </div>
          {error ? (
            <p role="alert" className="text-danger mt-2 text-xs font-medium">
              {error}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="border-border bg-surface border-t p-4 text-center">
          <p className="text-fg-muted text-sm">Connecte-toi pour rejoindre la conversation.</p>
          <a
            href={`/connexion?redirect=${encodeURIComponent(`/salons/${salonId}?tab=discussion`)}`}
            className="text-primary mt-1 inline-flex min-h-10 items-center justify-center text-sm font-semibold hover:underline"
          >
            Se connecter
          </a>
        </div>
      )}
    </section>
  );
}

function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span aria-hidden="true" className="bg-border h-px flex-1" />
      <time dateTime={date} className="text-fg-subtle rounded-full px-2 text-[11px] font-medium">
        {new Intl.DateTimeFormat("fr-FR", { dateStyle: "full" }).format(new Date(date))}
      </time>
      <span aria-hidden="true" className="bg-border h-px flex-1" />
    </div>
  );
}

function isSameDay(a: string, b: string) {
  const left = new Date(a);
  const right = new Date(b);
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatClock(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(date),
  );
}
