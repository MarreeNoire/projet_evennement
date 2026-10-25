"use client";

import { cn } from "@/lib/utils";
import styles from "./mascot.module.css";

export type MascotVariant =
  | "default"
  | "wave"
  | "celebrate"
  | "think"
  | "sleep"
  | "search"
  | "party"
  | "ticket";

export type MascotSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export interface MascotProps {
  variant?: MascotVariant;
  size?: MascotSize;
  className?: string;
  animated?: boolean;
}

const sizeClasses: Record<MascotSize, string> = {
  xs: "w-8 h-8",
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
  xl: "w-48 h-48",
  "2xl": "w-64 h-64",
};

const variantAnimations: Record<MascotVariant, string> = {
  default: "",
  wave: "mascot-wave",
  celebrate: "mascot-bounce",
  think: "mascot-tilt",
  sleep: "mascot-sleep",
  search: "mascot-search",
  party: "mascot-party",
  ticket: "mascot-ticket",
};

export function Mascot({
  variant = "default",
  size = "md",
  className,
  animated = true,
}: MascotProps) {
  const animationClass = animated ? variantAnimations[variant] : "";

  return (
    <div
      className={cn(styles.mascot, sizeClasses[size], animationClass, className)}
      aria-hidden="true"
      role="img"
      aria-label={`Mascotte Event - ${variant}`}
    >
      {/* Corps principal - forme organique style "ticket/flamme" */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.mascotBody}
      >
        <defs>
          <linearGradient id="mascotGradient" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
          </linearGradient>
          <filter id="innerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Forme principale - ticket organique avec flamme */}
        <path
          className={styles.mascotShape}
          d="M15 20
             L85 20
             Q95 20 95 30
             L95 70
             Q95 80 85 80
             L50 80
             L35 95
             L15 80
             Q5 80 5 70
             L5 30
             Q5 20 15 20 Z"
          fill="url(#mascotGradient)"
          filter="url(#innerGlow)"
        />

        {/* Visage - yeux */}
        <g className={styles.mascotFace}>
          {/* Œil gauche */}
          <circle cx="35" cy="45" r="5" fill="#0b0b0c" className={styles.mascotEye} />
          <circle cx="36" cy="44" r="1.5" fill="white" fillOpacity="0.8" className={styles.mascotPupil} />

          {/* Œil droit */}
          <circle cx="65" cy="45" r="5" fill="#0b0b0c" className={styles.mascotEye} />
          <circle cx="66" cy="44" r="1.5" fill="white" fillOpacity="0.8" className={styles.mascotPupil} />

          {/* Sourire */}
          <path
            d="M35 65 Q50 75 65 65"
            stroke="#0b0b0c"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            className={styles.mascotMouth}
          />

          {/* Joues */}
          <circle cx="25" cy="52" r="4" fill="currentColor" fillOpacity="0.3" className={styles.mascotCheek} />
          <circle cx="75" cy="52" r="4" fill="currentColor" fillOpacity="0.3" className={styles.mascotCheek} />
        </g>

        {/* Accessoires selon la variante */}
        {variant === "party" && (
          <g className={styles.mascotAccessory}>
            {/* Petit chapeau de fête */}
            <path
              d="M35 20 L30 5 L45 5 L40 20 Z"
              fill="currentColor"
              fillOpacity="0.8"
            />
            <circle cx="37.5" cy="5" r="2" fill="white" />
          </g>
        )}

        {variant === "ticket" && (
          <g className={styles.mascotAccessory}>
            {/* Ticket perforé sur le côté */}
            <rect x="82" y="35" width="8" height="30" rx="2" fill="#0b0b0c" fillOpacity="0.4" />
            <circle cx="86" cy="40" r="1.5" fill="#0b0b0c" />
            <circle cx="86" cy="55" r="1.5" fill="#0b0b0c" />
          </g>
        )}

        {variant === "search" && (
          <g className={styles.mascotAccessory}>
            {/* Loupe */}
            <circle cx="75" cy="30" r="8" stroke="#0b0b0c" strokeWidth="2" fill="none" />
            <line x1="80" y1="35" x2="88" y2="43" stroke="#0b0b0c" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {variant === "celebrate" && (
          <g className={styles.mascotParticles}>
            {/* Confettis */}
            <circle cx="20" cy="20" r="3" fill="#ef6d3e" className={styles.confetti} style={{ animationDelay: "0s" }} />
            <circle cx="80" cy="15" r="2" fill="#e0f9e4" className={styles.confetti} style={{ animationDelay: "0.1s" }} />
            <circle cx="90" cy="30" r="2.5" fill="#ffb28e" className={styles.confetti} style={{ animationDelay: "0.2s" }} />
            <circle cx="10" cy="50" r="2" fill="#ff9064" className={styles.confetti} style={{ animationDelay: "0.3s" }} />
            <circle cx="95" cy="55" r="3" fill="#d4512c" className={styles.confetti} style={{ animationDelay: "0.4s" }} />
          </g>
        )}
      </svg>
    </div>
  );
}

/* --- Mascot avec texte (pour onboarding, empty states, etc.) --- */

export interface MascotWithTextProps extends MascotProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function MascotWithText({
  variant = "default",
  size = "lg",
  title,
  description,
  action,
  className,
  animated = true,
}: MascotWithTextProps) {
  return (
    <div className={cn(styles.mascotWithText, className)} style={{ textAlign: "center" }}>
      <Mascot variant={variant} size={size} animated={animated} />
      {(title || description || action) && (
        <div className={styles.mascotTextContent}>
          {title && <h3 className={styles.mascotTitle}>{title}</h3>}
          {description && <p className={styles.mascotDescription}>{description}</p>}
          {action && <div className={styles.mascotAction}>{action}</div>}
        </div>
      )}
    </div>
  );
}