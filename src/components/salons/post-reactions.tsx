"use client";

import { useCallback, useRef, useState } from "react";
import { toggleReaction } from "@/lib/salons/actions";
import { haptic } from "@/lib/ui/haptics";
import { POST_REACTIONS } from "@/components/salons/salon-shared";
import { cn } from "@/lib/utils";
import type { ReactionType } from "@/types/database";

/* =============================================================================
   Réactions d'une publication
   --------------------------------------------------------------------------
   Un bouton « 👍 J'aime » : clic = réagir/retirer ; survol (souris) ou appui
   long (tactile) ouvre le sélecteur 👍 ❤️ 🔥 👏 😮. La carte rebondit à la
   sélection, le compteur est optimiste. Aperçu « qui a réagi » dégradé :
   la base n'expose pas la liste des réacteurs (RPC en SQL optionnel).
   ========================================================================== */

const REACTION_EMOJI: Record<ReactionType, string> = {
  like: "👍",
  love: "❤️",
  fire: "🔥",
  clap: "👏",
  wow: "😮",
};

export function PostReactions({
  postId,
  initialCount,
  initialReaction,
  initialHasReacted,
  compact = false,
}: {
  postId: string;
  initialCount: number;
  initialReaction: ReactionType | null;
  initialHasReacted: boolean;
  compact?: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [mine, setMine] = useState<ReactionType | null>(initialHasReacted ? initialReaction : null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [popping, setPopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const longPressTimer = useRef<number | null>(null);
  const hoverTimer = useRef<number | null>(null);
  const justOpened = useRef(false);

  const pop = useCallback(() => {
    setPopping(true);
    window.setTimeout(() => setPopping(false), 280);
  }, []);

  /** Applique une réaction de façon optimiste puis va chercher le serveur. */
  const apply = useCallback(
    async (reaction: ReactionType) => {
      const previous = mine;
      /* Optimiste */
      if (previous === null) {
        setMine(reaction);
        setCount((value) => value + 1);
        pop();
      } else if (previous === reaction) {
        setMine(null);
        setCount((value) => value - 1);
      } else {
        setMine(reaction);
        pop();
      }
      setPickerOpen(false);
      justOpened.current = false;

      const { success, error: serverError } = await toggleReaction("post", postId, reaction);
      if (!success) {
        /* Retour à l'état connu avant l'action */
        setMine(previous);
        setCount(initialCount);
        setError(serverError ?? "La réaction n’a pas pu être enregistrée.");
        window.setTimeout(() => setError(null), 2400);
      }
    },
    [mine, postId, pop, initialCount],
  );

  const cancelTimers = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (hoverTimer.current !== null) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const emoji = mine ? REACTION_EMOJI[mine] : "👍";
  const label = mine
    ? `Tu as réagi : ${POST_REACTIONS.find((item) => item.key === mine)?.label ?? "réaction"}`
    : "Réagir";

  return (
    <div className="relative">
      <div
        onPointerDown={(event) => {
          if (event.pointerType !== "touch") return;
          haptic("light");
          longPressTimer.current = window.setTimeout(() => {
            setPickerOpen(true);
            justOpened.current = true;
          }, 420);
        }}
        onPointerUp={() => cancelTimers()}
        onPointerCancel={() => cancelTimers()}
        onPointerEnter={(event) => {
          if (event.pointerType !== "mouse") return;
          hoverTimer.current = window.setTimeout(() => {
            setPickerOpen(true);
            justOpened.current = true;
          }, 320);
        }}
        onPointerLeave={() => {
          cancelTimers();
          if (pickerOpen) setPickerOpen(false);
        }}
      >
        <button
          type="button"
          aria-label={label}
          onClick={() => apply(mine ?? "like")}
          className={cn(
            "press inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold transition-colors duration-200",
            mine ? "text-primary" : "text-fg-muted hover:bg-bg-muted hover:text-fg",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "text-lg leading-none transition-transform duration-280 ease-[var(--ease-out-soft)]",
              popping && "scale-128 -rotate-6",
              mine && "scale-110",
            )}
          >
            {emoji}
          </span>
          {!compact && <span className="tabular-nums">{count > 0 ? count : ""}</span>}
        </button>
      </div>

      {pickerOpen ? (
        <>
          {/* Fermer au clic extérieur */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setPickerOpen(false)}
          />
          <div
            role="menu"
            aria-label="Choisir une réaction"
            className="border-border bg-surface absolute bottom-full left-1/2 z-30 mb-2 flex -translate-x-1/2 gap-0.5 rounded-full border px-1.5 py-1 shadow-lg"
          >
            {POST_REACTIONS.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                aria-label={item.label}
                onClick={() => apply(item.key)}
                className={cn(
                  "press inline-flex size-10 items-center justify-center rounded-full text-xl leading-none transition-transform duration-150 hover:scale-125",
                  mine === item.key && "bg-primary/10",
                )}
              >
                <span aria-hidden="true">{item.emoji}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {error ? (
        <p
          role="status"
          className="text-danger bg-surface absolute bottom-full left-1/2 z-30 -translate-x-1/2 rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap shadow-sm"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
