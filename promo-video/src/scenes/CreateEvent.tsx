import type { ReactNode } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { pop, ramp, rise, typed } from "../motion";
import { COLORS, FONTS, SHADOWS } from "../theme";
import { Stamps } from "../ui/Decor";
import { Card, Headline, Kicker, MockStage, Scene, SceneColumn, Sub } from "../ui/Kit";

/* Scène 3 — créer : la maquette de l'écran de publication, avec titre qui
   s'écrit, bouton pressé et toast de confirmation. */

const Chip = ({ children, delay }: { children: ReactNode; delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = rise(frame, fps, delay, 26);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: "16px 30px",
        borderRadius: 18,
        background: COLORS.bgSubtle,
        color: COLORS.fgMuted,
        fontFamily: FONTS.sans,
        fontSize: 36,
        fontWeight: 600,
        opacity: s.opacity,
        translate: s.translate,
      }}
    >
      {children}
    </span>
  );
};

export const CreateEvent = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = typed("Concert au Parc", frame, 42, 2);
  const typing = frame >= 42 && frame < 58;
  const caretOn = typing && Math.floor((frame - 42) / 5) % 2 === 0;

  const published = frame >= 84;
  const buttonScale = interpolate(frame, [78, 86, 96], [1, 0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ring = ramp(frame, [76, 104], [0, 1]);
  const ringFade = interpolate(frame, [76, 84, 98, 108], [0, 0.5, 0.28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const toast = pop(frame, fps, 88, { damping: 13, stiffness: 160 });

  return (
    <Scene bg={COLORS.bg} grain={0.05} decor={<Stamps color="rgba(32, 42, 53, 0.18)" count={14} />}>
      <SceneColumn>
        <Kicker label="01 · Créer" delay={2} />
        <div style={{ marginTop: 30 }}>
          <Headline delay={6} size={112} lines={[{ text: "Crée ton" }, { text: "événement." }]} />
        </div>
        <div style={{ marginTop: 24 }}>
          <Sub delay={14} size={44} maxWidth={760}>
            Billets, quotas, codes promo — tout se règle en quelques minutes.
          </Sub>
        </div>

        <MockStage>
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: -36,
                display: "flex",
                justifyContent: "center",
                zIndex: 2,
                opacity: Math.min(1, Math.max(0, toast)),
                scale: String(Math.max(0, toast)),
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "18px 36px",
                  borderRadius: 999,
                  background: COLORS.fg,
                  color: COLORS.white,
                  fontFamily: FONTS.sans,
                  fontSize: 36,
                  fontWeight: 600,
                  boxShadow: SHADOWS.floating,
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: COLORS.successSolid,
                    color: "#08320f",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    fontWeight: 800,
                  }}
                >
                  ✓
                </span>
                Événement publié · visible dans Explorer
              </span>
            </div>

            <Card delay={24} padding={0} width={888} style={{ overflow: "hidden" }}>
              <div
                style={{
                  height: 330,
                  background: "linear-gradient(130deg, #4a5cbd 0%, #2c3a80 78%)",
                  padding: "40px 48px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      padding: "12px 28px",
                      borderRadius: 999,
                      background: "rgba(255, 255, 255, 0.18)",
                      border: "2px solid rgba(255, 255, 255, 0.32)",
                      color: COLORS.white,
                      fontFamily: FONTS.sans,
                      fontSize: 32,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                    }}
                  >
                    CONCERT
                  </span>
                  <span
                    style={{
                      padding: "12px 28px",
                      borderRadius: 999,
                      background: published ? COLORS.successSolid : "rgba(255, 255, 255, 0.18)",
                      border: `2px solid ${
                        published ? COLORS.successSolid : "rgba(255, 255, 255, 0.32)"
                      }`,
                      color: published ? "#08320f" : COLORS.white,
                      fontFamily: FONTS.sans,
                      fontSize: 32,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {published ? "✓ PUBLIÉ" : "BROUILLON"}
                  </span>
                </div>

                <div>
                  <div
                    style={{
                      fontFamily: FONTS.display,
                      fontWeight: 700,
                      fontSize: 68,
                      lineHeight: 1.05,
                      letterSpacing: "-0.02em",
                      color: COLORS.white,
                    }}
                  >
                    {title}
                    {caretOn ? <span style={{ opacity: 0.75 }}>|</span> : null}
                  </div>
                  <div
                    style={{
                      marginTop: 16,
                      fontFamily: FONTS.sans,
                      fontSize: 38,
                      color: "rgba(255, 255, 255, 0.88)",
                    }}
                  >
                    Sam. 13 juin · Parc des Expositions, Abidjan
                  </div>
                </div>
              </div>

              <div style={{ padding: "44px 48px 48px" }}>
                <div style={{ display: "flex", gap: 18, marginBottom: 34 }}>
                  <Chip delay={32}>200 places</Chip>
                  <Chip delay={38}>Clôture ven. 12 juin</Chip>
                </div>

                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: 130,
                      height: 130,
                      translate: "-50% -50%",
                      borderRadius: 999,
                      border: `6px solid rgba(184, 63, 34, ${ringFade})`,
                      scale: String(1 + ring * 1.7),
                    }}
                  />
                  <div
                    style={{
                      height: 100,
                      borderRadius: 26,
                      background: published ? COLORS.success : COLORS.primary,
                      color: COLORS.white,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: FONTS.sans,
                      fontSize: 46,
                      fontWeight: 700,
                      boxShadow: SHADOWS.card,
                      scale: String(buttonScale),
                    }}
                  >
                    {published ? "✓ Publié !" : "Publier l'événement"}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </MockStage>
      </SceneColumn>
    </Scene>
  );
};
