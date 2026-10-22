"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ellipsis, Flag, Link2, LoaderCircle, Pencil, Pin, PinOff, Trash2, X } from "lucide-react";
import {
  deleteSalonPost,
  reportSalonTarget,
  setPostHidden,
  setPostPinned,
} from "@/lib/salons/actions";
import { isOrganizerRole, type ViewerInfo } from "@/components/salons/salon-shared";
import { cn } from "@/lib/utils";
import type { ReportReason } from "@/types/database";

/* =============================================================================
   Menu « ⋯ » d'une publication
   --------------------------------------------------------------------------
   Éléments selon le rôle : auteur (modifier, supprimer), organisateur du
   salon (épingler, masquer), tout le monde (signaler, copier le lien).
   Panneau fermable au clic extérieur ou avec Échap ; confirmation pour les
   actions destructrices ; retour d'état en aria-live.
   ========================================================================== */

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam ou publicité" },
  { value: "harassment", label: "Harcèlement" },
  { value: "hate", label: "Discours haineux" },
  { value: "violence", label: "Violence" },
  { value: "nudity", label: "Contenu inapproprié" },
  { value: "misinformation", label: "Mésinformation" },
  { value: "other", label: "Autre" },
];

export function PostMenu({
  postId,
  salonId,
  authorId,
  isPinned,
  viewer,
  onEdit,
}: {
  postId: string;
  salonId: string;
  authorId: string | null;
  isPinned: boolean;
  viewer: ViewerInfo;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("other");
  const [confirmMode, setConfirmMode] = useState<null | "delete" | "hide">(null);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isMine = Boolean(viewer.id) && viewer.id === authorId;
  const canModerate = isOrganizerRole(viewer.role);
  const signed = Boolean(viewer.id);

  /* Fermeture au clic extérieur + Échap */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setConfirmMode(null);
        setReportOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setConfirmMode(null);
        setReportOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const show = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2600);
  };

  const close = () => {
    setOpen(false);
    setConfirmMode(null);
    setReportOpen(false);
  };

  const runAction = async (action: () => Promise<{ success: boolean; error?: string }>) => {
    setPending(true);
    const result = await action();
    setPending(false);
    if (result.success) {
      close();
      router.refresh();
    } else {
      show(result.error ?? "Action impossible pour le moment.");
    }
  };

  const submitReport = async () => {
    setPending(true);
    const result = await reportSalonTarget(
      { type: "post", id: postId, salonId },
      reportReason,
    );
    setPending(false);
    if (result.success) {
      close();
      show("Merci, le signalement a été envoyé aux organisateurs.");
    } else {
      show(result.error ?? "Le signalement n’a pas pu être envoyé.");
    }
  };

  const items: { label: string; icon: React.ReactNode; danger?: boolean; onPress: () => void }[] = [];
  if (isMine) {
    items.push({ label: "Modifier", icon: <Pencil className="size-4" aria-hidden="true" />, onPress: () => { close(); onEdit(); } });
  }
  if (canModerate && !isMine) {
    items.push({
      label: confirmMode === "hide" ? "Confirmer le masquage" : "Masquer du salon",
      icon: <X className="size-4" aria-hidden="true" />,
      danger: true,
      onPress:
        confirmMode === "hide"
          ? () => runAction(() => setPostHidden(postId, true))
          : () => setConfirmMode("hide"),
    });
    items.push({
      label: confirmMode === "delete" ? "Confirmer la suppression" : "Supprimer",
      icon: <Trash2 className="size-4" aria-hidden="true" />,
      danger: true,
      onPress:
        confirmMode === "delete"
          ? () => runAction(() => deleteSalonPost(postId))
          : () => setConfirmMode("delete"),
    });
  }
  if (canModerate) {
    items.push({
      label: isPinned ? "Désépingler" : "Épingler en haut du fil",
      icon: isPinned ? <PinOff className="size-4" aria-hidden="true" /> : <Pin className="size-4" aria-hidden="true" />,
      onPress: () => runAction(() => setPostPinned(postId, !isPinned)),
    });
  }
  if (signed && !isMine) {
    items.push({
      label: "Signaler",
      icon: <Flag className="size-4" aria-hidden="true" />,
      onPress: () => setReportOpen(true),
    });
  }
  items.push({
    label: "Copier le lien",
    icon: <Link2 className="size-4" aria-hidden="true" />,
    onPress: () => {
      const url = `${window.location.origin}/salons/${salonId}?post=${postId}`;
      void navigator.clipboard
        ?.writeText(url)
        .then(() => {
          close();
          show("Lien copié.");
        })
        .catch(() => {
          close();
          show("Copie impossible : " + url);
        });
    },
  });

  return (
    <span className="relative inline-flex" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Fermer le menu" : "Plus d'actions"}
        aria-expanded={open}
        className="text-fg-muted press inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-bg-muted hover:text-fg"
      >
        <Ellipsis className="size-5" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Actions de la publication"
          className="border-border bg-surface absolute top-full right-0 z-40 mt-1 w-64 rounded-xl border p-1.5 shadow-xl"
        >
          {reportOpen ? (
            <form
              className="p-1"
              onSubmit={(event) => {
                event.preventDefault();
                if (!pending) void submitReport();
              }}
            >
              <p className="text-fg px-1 pb-2 text-xs font-semibold">Signalant ce contenu…</p>
              <fieldset className="mb-2 flex flex-col gap-1" disabled={pending}>
                <legend className="sr-only">Raison du signalement</legend>
                {REPORT_REASONS.map((item) => (
                  <label
                    key={item.value}
                    className="text-fg-muted hover:bg-bg-muted flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:text-fg"
                  >
                    <input
                      type="radio"
                      name={`report-${postId}`}
                      value={item.value}
                      checked={reportReason === item.value}
                      onChange={() => setReportReason(item.value)}
                      className="accent-primary"
                    />
                    {item.label}
                  </label>
                ))}
              </fieldset>
              <div className="flex justify-end gap-2 px-1 pb-1">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="text-fg-muted rounded-lg px-2 py-1.5 text-sm font-semibold hover:bg-bg-muted"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="bg-primary-solid text-primary-solid-fg inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-60"
                >
                  {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
                  Envoyer
                </button>
              </div>
            </form>
          ) : (
            <ul className="flex flex-col">
              {items.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={pending}
                    onClick={item.onPress}
                    className={cn(
                      "text-sm font-medium",
                      item.danger ? "text-danger" : "text-fg-muted hover:text-fg",
                      "hover:bg-bg-muted flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left disabled:opacity-50",
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {feedback ? (
        <p
          role="status"
          className="bg-surface border-border text-fg absolute top-full right-0 z-50 mt-2 w-max max-w-64 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-md"
        >
          {feedback}
        </p>
      ) : null}
    </span>
  );
}
