import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";

import { pseudo } from "../motion";
import { COLORS } from "../theme";

/* =============================================================================
   Décors : grain de papier, vignette, tampons épars et traits dessinés à la
   main. Tout est déterministe pour que le rendu soit stable image par image.
   ========================================================================== */

const GRAIN_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E";

export const Grain = ({ opacity = 0.05 }: { opacity?: number }) => (
  <AbsoluteFill
    style={{
      // Texture inline (data: URI) : aucun chargement réseau, donc aucune
      // capture incomplète possible — le seul cas que cette règle vise.
      // eslint-disable-next-line @remotion/no-background-image
      backgroundImage: `url("${GRAIN_SVG}")`,
      backgroundRepeat: "repeat",
      opacity,
      mixBlendMode: "multiply",
      pointerEvents: "none",
    }}
  />
);

export const Vignette = ({ color = "rgba(58, 20, 12, 0.4)" }: { color?: string }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(115% 85% at 50% 42%, rgba(0,0,0,0) 52%, ${color} 100%)`,
      pointerEvents: "none",
    }}
  />
);

/** Petits signes éparpillés sur toute l'image (+ · ✦ · points · anneaux). */
export const Stamps = ({
  color = "rgba(32, 42, 53, 0.35)",
  count = 20,
}: {
  color?: string;
  count?: number;
}) => {
  const { width, height } = useVideoConfig();
  const items: ReactNode[] = [];

  for (let index = 0; index < count; index += 1) {
    const x = 40 + pseudo(index * 3 + 1) * (width - 80);
    const y = 60 + pseudo(index * 7 + 2) * (height - 120);
    const size = 20 + Math.round(pseudo(index * 11 + 5) * 30);
    const strength = 0.2 + pseudo(index * 13 + 3) * 0.5;
    const kind = index % 4;

    if (kind === 0) {
      items.push(
        <span
          key={index}
          style={{
            position: "absolute",
            left: x,
            top: y,
            fontSize: size,
            lineHeight: 1,
            color,
            opacity: strength,
            fontFamily: "Georgia, serif",
          }}
        >
          +
        </span>,
      );
    } else if (kind === 1) {
      items.push(
        <span
          key={index}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: size * 0.42,
            height: size * 0.42,
            borderRadius: 999,
            background: color,
            opacity: strength,
          }}
        />,
      );
    } else if (kind === 2) {
      items.push(
        <span
          key={index}
          style={{
            position: "absolute",
            left: x,
            top: y,
            fontSize: size,
            lineHeight: 1,
            color,
            opacity: strength,
          }}
        >
          ✦
        </span>,
      );
    } else {
      items.push(
        <span
          key={index}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: size,
            height: size,
            borderRadius: 999,
            border: `3px solid ${color}`,
            opacity: strength * 0.8,
          }}
        />,
      );
    }
  }

  return <AbsoluteFill style={{ pointerEvents: "none" }}>{items}</AbsoluteFill>;
};

const DOODLES = {
  underline: { viewBox: "0 0 360 26", d: "M5 17 C 70 5, 150 23, 220 11 C 272 3, 320 15, 355 9" },
  arrow: { viewBox: "0 0 220 92", d: "M7 11 C 61 63, 119 77, 197 63 M171 45 L199 63 L169 79" },
  sparkle: { viewBox: "0 0 64 64", d: "M32 3 L38 26 L61 32 L38 38 L32 61 L26 38 L3 32 L26 26 Z" },
  swirl: { viewBox: "0 0 120 120", d: "M60 14 C 92 14, 106 42, 96 66 C 88 86, 62 96, 46 84 C 32 74, 32 54, 46 46 C 58 39, 72 46, 74 58" },
} as const;

export type DoodleVariant = keyof typeof DOODLES;

/** Trait dessiné à la main qui se trace de 0 à 1. */
export const Doodle = ({
  variant,
  progress = 1,
  stroke = COLORS.gold,
  strokeWidth = 6,
  style,
}: {
  variant: DoodleVariant;
  progress?: number;
  stroke?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}) => {
  const shape = DOODLES[variant];
  const p = Math.max(0, Math.min(1, progress));
  return (
    <svg viewBox={shape.viewBox} style={{ position: "absolute", ...style }} fill="none">
      <path
        d={shape.d}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p}
      />
    </svg>
  );
};
