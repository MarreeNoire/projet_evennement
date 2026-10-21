import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

import { pop, rise } from "../motion";
import { COLORS, FONTS, SHADOWS } from "../theme";
import { Grain } from "./Decor";

/* =============================================================================
   Kit de mise en page vidéo.
   --------------------------------------------------------------------------
   Toutes les scènes sont dessinées dans un espace de 1080 × 1920, puis mises
   à l'échelle pour remplir la composition (9:16, 1:1 ou 16:9). Les zones sûres
   des réseaux sociaux sont respectées : marges latérales de 96 px, contenu
   principal entre 250 px et 1690 px.
   ========================================================================== */

export const DesignCanvas = ({ children }: { children: ReactNode }) => {
  const { width, height } = useVideoConfig();
  const scale = Math.min(width / 1080, height / 1920);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 1080,
        height: 1920,
        translate: "-50% -50%",
        scale: String(scale),
        flex: "none",
      }}
    >
      {children}
    </div>
  );
};

export const Scene = ({
  bg,
  children,
  decor,
  grain = 0,
}: {
  bg: string;
  children: ReactNode;
  decor?: ReactNode;
  grain?: number;
}) => (
  <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden" }}>
    {decor}
    <DesignCanvas>{children}</DesignCanvas>
    {grain > 0 ? <Grain opacity={grain} /> : null}
  </AbsoluteFill>
);

/** Colonne de contenu alignée sur les zones sûres du format vertical. */
export const SceneColumn = ({
  children,
  padding = "250px 96px 130px",
  gap = 0,
}: {
  children: ReactNode;
  padding?: string;
  gap?: number;
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding,
      gap,
      boxSizing: "border-box",
    }}
  >
    {children}
  </div>
);

export const Kicker = ({
  label,
  delay = 0,
  tone = COLORS.primary,
}: {
  label: string;
  delay?: number;
  tone?: string;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = rise(frame, fps, delay, 18);
  return (
    <div style={{ opacity: s.opacity, translate: s.translate }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 16,
          padding: "14px 32px",
          borderRadius: 999,
          background: COLORS.surfaceRaised,
          border: `2px solid ${COLORS.border}`,
          boxShadow: SHADOWS.pill,
          fontFamily: FONTS.sans,
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: COLORS.fgMuted,
        }}
      >
        <span style={{ width: 14, height: 14, borderRadius: 999, background: tone }} />
        {label}
      </span>
    </div>
  );
};

export type HeadlineLine = {
  text: string;
  color?: string;
  italic?: boolean;
};

export const Headline = ({
  lines,
  delay = 0,
  size = 104,
  color = COLORS.fg,
  lineHeight = 1.05,
}: {
  lines: HeadlineLine[];
  delay?: number;
  size?: number;
  color?: string;
  lineHeight?: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {lines.map((line, index) => {
        const s = rise(frame, fps, delay + index * 6, 70);
        return (
          <div
            key={index}
            style={{
              fontFamily: FONTS.display,
              fontWeight: 700,
              fontSize: size,
              lineHeight,
              letterSpacing: "-0.025em",
              color: line.color ?? color,
              fontStyle: line.italic ? "italic" : "normal",
              opacity: s.opacity,
              translate: s.translate,
            }}
          >
            {line.text}
          </div>
        );
      })}
    </div>
  );
};

export const Sub = ({
  children,
  delay = 0,
  size = 44,
  color = COLORS.fgMuted,
  maxWidth = 800,
  weight = 400,
  align = "center",
}: {
  children: ReactNode;
  delay?: number;
  size?: number;
  color?: string;
  maxWidth?: number;
  weight?: number;
  align?: "center" | "left";
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = rise(frame, fps, delay, 40);
  return (
    <p
      style={{
        fontFamily: FONTS.sans,
        fontSize: size,
        lineHeight: 1.4,
        fontWeight: weight,
        color,
        maxWidth,
        textAlign: align,
        margin: 0,
        opacity: s.opacity,
        translate: s.translate,
      }}
    >
      {children}
    </p>
  );
};

export const Pill = ({
  children,
  delay = 0,
  bg = COLORS.surfaceRaised,
  color = COLORS.fg,
  border = COLORS.border,
  size = 42,
  rotate = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  bg?: string;
  color?: string;
  border?: string;
  size?: number;
  rotate?: number;
  style?: CSSProperties;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, delay);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 16,
        padding: "20px 40px",
        borderRadius: 999,
        background: bg,
        color,
        border: `2px solid ${border}`,
        fontFamily: FONTS.sans,
        fontSize: size,
        fontWeight: 600,
        boxShadow: SHADOWS.pill,
        opacity: Math.min(1, Math.max(0, s)),
        scale: String(s),
        rotate: `${rotate}deg`,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export const Card = ({
  children,
  delay = 0,
  width = 888,
  padding = 48,
  style,
  shadow = SHADOWS.card,
}: {
  children: ReactNode;
  delay?: number;
  width?: number;
  padding?: number;
  style?: CSSProperties;
  shadow?: string;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = rise(frame, fps, delay, 80);
  return (
    <div
      style={{
        width,
        background: COLORS.surfaceRaised,
        border: `2px solid ${COLORS.border}`,
        borderRadius: 40,
        boxShadow: shadow,
        padding,
        boxSizing: "border-box",
        opacity: s.opacity,
        translate: s.translate,
        scale: String(0.96 + 0.04 * s.progress),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Zone centrale qui accueille la maquette, sous l'en-tête de scène. */
export const MockStage = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      flex: 1,
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {children}
  </div>
);
