import type { CSSProperties, ElementType } from "react";

import { cn } from "@/lib/utils";

import styles from "./letter-swap.module.css";

/* =============================================================================
   LetterSwap — titre dont les lettres basculent en 3D au survol
   -----------------------------------------------------------------------------
   Chaque lettre a deux faces empilées en 3D (`preserve-3d` + `backface-
   visibility: hidden`) : au survol du bloc, la face avant pivote et révèle la
   face arrière, lettre après lettre.

   Le découpage est fait au rendu (aucun état, aucun effet), donc le composant
   fonctionne aussi bien en Server Component qu'en Client Component. Le texte
   complet reste lisible par les lecteurs d'écran via un `sr-only`, la version
   animée étant marquée `aria-hidden`.
   ========================================================================== */

export type LetterSwapSegment = {
  /** Texte du segment. Les espaces sont conservés tels quels. */
  text: string;
  /** Classe appliquée au segment (couleur de base, italique…). */
  className?: string;
  /** Classe de la face avant du segment. */
  frontFaceClassName?: string;
  /** Classe de la face arrière du segment. */
  backFaceClassName?: string;
};

export type LetterSwapProps = {
  /** Découpage du titre en segments stylés différemment. */
  segments: LetterSwapSegment[];
  /** Balise rendue (par défaut `span`). */
  as?: ElementType;
  className?: string;
  frontFaceClassName?: string;
  backFaceClassName?: string;
  /** Délai entre deux lettres, en secondes. */
  staggerInterval?: number;
  /** Point de départ de la cascade. */
  staggerOrigin?: "first" | "last" | "center";
  /** Sens de rotation des lettres. */
  flipDirection?: "top" | "bottom";
  /** Durée d'une bascule, en secondes. */
  duration?: number;
  /** Décalage horizontal à appliquer après chaque lettre (chasse du titre). */
  tracking?: string;
};

export function LetterSwap({
  segments,
  as: Tag = "span",
  className,
  frontFaceClassName,
  backFaceClassName,
  staggerInterval = 0.03,
  staggerOrigin = "first",
  flipDirection = "top",
  duration = 0.6,
  tracking,
}: LetterSwapProps) {
  const lettersTotal = segments.reduce(
    (count, segment) => count + segment.text.replace(/\s/g, "").length,
    0,
  );
  const center = (lettersTotal - 1) / 2;

  /** Délai de la lettre n° `index`, selon le point de départ choisi. */
  const delayFor = (index: number) => {
    const rank =
      staggerOrigin === "last"
        ? lettersTotal - 1 - index
        : staggerOrigin === "center"
          ? Math.abs(index - center)
          : index;
    return rank * staggerInterval;
  };

  const style = {
    "--swap-duration": `${duration}s`,
    ...(tracking ? { "--swap-tracking": tracking } : {}),
  } as CSSProperties;

  let cursor = 0;

  return (
    <Tag
      className={cn(styles.root, className)}
      data-flip={flipDirection}
      style={style}
    >
      <span className="sr-only">{segments.map((segment) => segment.text).join("")}</span>

      <span className={styles.line} aria-hidden="true">
        {segments.map((segment, segmentIndex) => (
          <span key={segmentIndex} className={segment.className}>
            {segment.text.split(/(\s+)/).map((chunk, chunkIndex) => {
              if (!chunk) return null;

              // Les espaces restent des nœuds texte : la coupure de ligne et
              // l'équilibrage des lignes du titre continuent de fonctionner.
              if (/^\s+$/.test(chunk)) {
                return (
                  <span key={`space-${chunkIndex}`} className={styles.space}>
                    {chunk}
                  </span>
                );
              }

              return (
                <span key={`word-${chunkIndex}`} className={styles.word}>
                  {[...chunk].map((letter, letterIndex) => {
                    const index = cursor;
                    cursor += 1;

                    return (
                      <span
                        key={`char-${letterIndex}`}
                        className={styles.char}
                        style={{ "--delay": `${delayFor(index)}s` } as CSSProperties}
                      >
                        <span className={styles.flipper}>
                          <span
                            className={cn(
                              styles.face,
                              frontFaceClassName,
                              segment.frontFaceClassName,
                            )}
                          >
                            {letter}
                          </span>
                          <span
                            className={cn(
                              styles.face,
                              styles.back,
                              backFaceClassName,
                              segment.backFaceClassName,
                            )}
                          >
                            {letter}
                          </span>
                        </span>
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </span>
        ))}
      </span>
    </Tag>
  );
}
