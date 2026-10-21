import type { CSSProperties } from "react";

import { COLORS, FONTS, SHADOWS } from "../theme";

/* Logo « Event » : billet perforé + étoile, repris de src/components/brand/logo.tsx. */

export const LogoMark = ({
  size,
  style,
  radius,
}: {
  size: number;
  style?: CSSProperties;
  radius?: number;
}) => {
  const r = radius ?? Math.round(size * 0.3125);
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      style={{
        display: "block",
        borderRadius: r,
        background: COLORS.primary,
        padding: size * 0.1875,
        boxShadow: SHADOWS.card,
        ...style,
      }}
    >
      <path
        d="M8 6.5h16a2.5 2.5 0 0 1 2.5 2.5v4.2a2.8 2.8 0 0 0 0 5.6V23a2.5 2.5 0 0 1-2.5 2.5H8A2.5 2.5 0 0 1 5.5 23v-4.2a2.8 2.8 0 0 0 0-5.6V9A2.5 2.5 0 0 1 8 6.5Z"
        fill="#ffffff"
      />
      <path
        d="M18.5 9.5v13"
        stroke={COLORS.primary}
        strokeWidth="1.5"
        strokeDasharray="1.8 2.1"
        strokeLinecap="round"
      />
      <path
        d="m12.5 11.2 1.1 2.2 2.4.3-1.7 1.7.4 2.4-2.2-1.1-2.2 1.1.4-2.4L9 13.7l2.4-.3 1.1-2.2Z"
        fill={COLORS.primary}
      />
    </svg>
  );
};

export const Wordmark = ({
  size = 120,
  color = COLORS.fg,
  style,
}: {
  size?: number;
  color?: string;
  style?: CSSProperties;
}) => (
  <span
    style={{
      fontFamily: FONTS.display,
      fontWeight: 700,
      fontSize: size,
      lineHeight: 1,
      letterSpacing: "-0.03em",
      color,
      ...style,
    }}
  >
    Event
  </span>
);
