"use client";

import type { OrgRole, SalonPostCategory } from "@/types/database";

/* =============================================================================
   éGlements partagés des salons (refonte)
   --------------------------------------------------------------------------
   Types du spectateur, badges de rôle, étiquettes de catégorie et rendu du
   texte avec liens cliquables — utilisés par la carte, les commentaires et
   les composeurs. Un seul endroit pour le vocabulaire commun.
   ========================================================================== */

/** Identité et droits du spectateur (précalculés côté serveur). */
export interface ViewerInfo {
  /** Id du profil (= author_id des posts/commentaires). Null si visiteur. */
  id: string | null;
  name: string;
  avatarUrl: string | null;
  isVerified: boolean;
  /** Rôle du membre DANS ce salon (owner, moderator, manager…). */
  role: OrgRole | null;
}

/** Relation légère des membres (mentions @, composer de commentaires). */
export interface MentionOption {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export function isOrganizerRole(role: OrgRole | null): boolean {
  return role === "owner" || role === "moderator";
}

export const POST_CATEGORY_ORDER: SalonPostCategory[] = [
  "discussion",
  "question",
  "info_pratique",
  "rencontre",
  "covoiturage",
  "photo",
];

export const CATEGORY_LABELS: Record<SalonPostCategory, string> = {
  discussion: "Discussion",
  question: "Question",
  info_pratique: "Info pratique",
  rencontre: "Rencontre",
  covoiturage: "Covoiturage",
  photo: "Photo",
};

/** Réactions rapides du fil (les clés sont exactement celles du type DB). */
export const POST_REACTIONS = [
  { key: "like", emoji: "👍", label: "J’aime" },
  { key: "love", emoji: "❤️", label: "J’adore" },
  { key: "fire", emoji: "🔥", label: "En feu" },
  { key: "clap", emoji: "👏", label: "Bravo" },
  { key: "wow", emoji: "😮", label: "Wahou" },
] as const;

/* ------------------------------ Badges ---------------------------------- */

export function OrganizerBadge({ subtle = false }: { subtle?: boolean }) {
  return (
    <span
      className={
        subtle
          ? "bg-accent-subtle text-2xs text-accent-subtle-fg rounded-full px-1.5 py-0.5 font-bold tracking-[0.08em] uppercase"
          : "bg-accent-solid text-2xs text-accent-solid-fg rounded-sm px-2 py-0.5 font-bold tracking-[0.08em] uppercase"
      }
    >
      Organisateur
    </span>
  );
}

/* -------------------------- Texte + liens -------------------------------- */

const URL_SPLIT_RE = /(https?:\/\/[^\s]+)/;
const URL_TEST_RE = /^https?:\/\//;

/** Rend un texte multi-lignes où chaque URL devient un lien réel et sûr. */
export function LinkifiedContent({ text, className }: { text: string; className?: string }) {
  const parts = text.split(URL_SPLIT_RE);

  return (
    <p className={className} style={{ whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
      {parts.map((part, index) =>
        URL_TEST_RE.test(part) ? (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-primary font-medium underline underline-offset-2 hover:decoration-2"
          >
            {part}
          </a>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </p>
  );
}
