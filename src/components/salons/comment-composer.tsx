"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Send, Smile, X } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import type { ViewerInfo } from "@/components/salons/salon-shared";
import { LIMITS } from "@/lib/constants";
import { haptic } from "@/lib/ui/haptics";
import { cn } from "@/lib/utils";
import type { MentionOption } from "@/components/salons/salon-shared";

/* =============================================================================
   Composer de commentaire / réponse
   --------------------------------------------------------------------------
   Champ qui grandit avec le texte, sélecteur d’emojis, mentions @membre avec
   suggestions, brouillon sauvegardé localement (fermeture accidentelle),
   Entrée = envoyer sur écran ≥ md (Maj+Entrée = nouvelle ligne). La bulle
   « hors ligne » et les files d’attente sont gérées par la couche au-dessus :
   ce composant transmet juste `onSend`.
   ========================================================================== */

const EMOJIS = ["👍", "❤️", "🔥", "👏", "😮", "😂", "🙏", "🎉"];
const MENTION_RE = /(?:^|\s)@([\p{L}\p{N}_-]*)$/u;

export function CommentComposer({
  draftKey,
  viewer,
  members,
  onSend,
  replyingTo = null,
  onCancelReply,
  autoFocus = false,
  placeholder = "Écris un commentaire…",
  onTyping,
}: {
  draftKey: string;
  viewer: ViewerInfo;
  members: MentionOption[];
  /** Résout à true quand le commentaire est parti (envoyé ou mis en file). */
  onSend: (text: string, mentions: string[]) => Promise<boolean>;
  replyingTo?: { id: string; name: string } | null;
  onCancelReply?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  /** Appelé (déjà throttlé côté parent) quand l'utilisateur tape. */
  onTyping?: () => void;
}) {
  const [text, setText] = useState(() => readDraft(draftKey));
  const [sending, setSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionIds = useRef<string[]>([]);

  /* Focus initial + autosize despecialisée */
  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    if (autoFocus) node.focus();
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 160)}px`;
  }, [autoFocus, text]);

  const suggestions =
    mentionQuery !== null
      ? members
          .filter((member) => member.name.toLowerCase().includes(mentionQuery.toLowerCase()))
          .slice(0, 5)
      : [];

  const setTextAndSave = (next: string) => {
    setText(next);
    try {
      window.localStorage.setItem(draftKey, next);
    } catch {
      /* stockage plein : le brouillon reste en mémoire */
    }
  };

  const submit = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    const ok = await onSend(value, [...mentionIds.current]);
    setSending(false);
    if (ok) {
      mentionIds.current = [];
      setTextAndSave("");
      setMentionQuery(null);
      haptic("light");
    }
  };

  const insertMention = (member: MentionOption) => {
    const current = text;
    const match = current.match(MENTION_RE);
    if (!match) {
      setTextAndSave(`${current}${current.endsWith(" ") ? "" : " "}@${member.name} `);
    } else {
      const replaced = current.slice(0, current.length - match[0].length);
      mentionIds.current.push(member.id);
      setTextAndSave(`${replaced} @${member.name} `);
    }
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  return (
    <div
      className="border-border bg-surface relative border-t px-3 pt-2 pb-2"
      style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
    >
      {replyingTo ? (
        <div className="text-fg-muted flex items-center gap-2 pb-1.5 text-xs font-medium">
          <span className="bg-bg-muted flex min-w-0 items-center rounded-full px-2.5 py-1">
            Réponse à <strong className="text-fg ml-1 truncate">{replyingTo.name}</strong>
          </span>
          {onCancelReply ? (
            <button
              type="button"
              onClick={onCancelReply}
              aria-label="Annuler la réponse"
              className="p-1"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}

      {mentionQuery !== null && suggestions.length > 0 ? (
        <ul
          role="listbox"
          aria-label="Suggestions de membres"
          className="border-border bg-surface absolute bottom-full left-3 right-3 mb-1 z-20 max-h-44 overflow-y-auto rounded-xl border p-1 shadow-lg"
        >
          {suggestions.map((member) => (
            <li key={member.id}>
              <button
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => insertMention(member)}
                className="hover:bg-bg-muted flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm"
              >
                <Avatar src={member.avatarUrl} name={member.name} size="xs" />
                <span className="truncate font-medium">{member.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative flex items-end gap-2">
        <Avatar src={viewer.avatarUrl} name={viewer.name} size="md" className="mb-0.5" />

        <div className="border-border bg-surface-sunken focus-within:border-border-focus min-w-0 flex-1 rounded-2xl border transition-colors">
          <textarea
            ref={textareaRef}
            value={text}
            rows={1}
            dir="auto"
            aria-label={placeholder}
            placeholder={placeholder}
            onChange={(event) => {
              const value = event.target.value.slice(0, LIMITS.MAX_COMMENT_LENGTH);
              const matchAt = value.match(MENTION_RE);
              const captured = matchAt?.[1] ?? null;
              setMentionQuery(captured && captured.length <= 20 ? captured : null);
              setTextAndSave(value);
              onTyping?.();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && window.matchMedia("(min-width: 768px)").matches) {
                event.preventDefault();
                void submit();
              }
            }}
            className="text-fg placeholder:text-fg-subtle max-h-40 w-full resize-none bg-transparent px-3.5 py-2.5 text-[15px] leading-relaxed outline-none"
          />

          <div className="flex items-center justify-between px-2 pb-1.5">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setEmojiOpen((value) => !value)}
                aria-label="Ajouter un emoji"
                aria-expanded={emojiOpen}
                className="text-fg-muted hover:text-fg press inline-flex size-9 items-center justify-center rounded-full"
              >
                <Smile className="size-5" aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!text.trim() || sending}
              aria-label="Envoyer le commentaire"
              className={cn(
                "press inline-flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200",
                text.trim()
                  ? "bg-primary-solid text-primary-solid-fg hover:opacity-90"
                  : "text-fg-subtle opacity-0",
                sending && "opacity-70",
              )}
            >
              {sending ? (
                <LoaderCircle className="size-4.5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-4.5" aria-hidden="true" />
              )}
            </button>
          </div>

          {emojiOpen ? (
            <div
              role="menu"
              aria-label="Emojis"
              className="border-border bg-surface absolute right-2 bottom-full mb-1 z-20 flex flex-wrap gap-0.5 rounded-xl border p-1.5 shadow-lg"
            >
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setTextAndSave(`${text}${emoji}`);
                    setEmojiOpen(false);
                    textareaRef.current?.focus();
                  }}
                  className="press inline-flex size-9 items-center justify-center rounded-lg text-lg hover:bg-bg-muted"
                >
                  <span aria-hidden="true">{emoji}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function readDraft(draftKey: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(draftKey) ?? "";
  } catch {
    return "";
  }
}
