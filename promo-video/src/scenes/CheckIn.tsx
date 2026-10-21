import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { pop, ramp } from "../motion";
import { COLORS, FONTS, SHADOWS } from "../theme";
import { Stamps } from "../ui/Decor";
import { Card, Headline, Kicker, MockStage, Scene, SceneColumn, Sub } from "../ui/Kit";
import { StyledQr } from "../ui/QR";

/* Scène 6 — accueillir : le contrôle d'accès, ligne de scan dorée puis
   validation verte. */

export const CheckIn = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scan = ramp(frame, [30, 54], [0, 1]);
  const scanLine = interpolate(frame, [30, 33, 51, 54], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const validated = pop(frame, fps, 58, { damping: 12, stiffness: 170 });
  const ring = ramp(frame, [58, 74], [0, 1]);
  const v = Math.min(1, Math.max(0, validated));

  return (
    <Scene bg={COLORS.bg} grain={0.05} decor={<Stamps color="rgba(32, 42, 53, 0.18)" count={14} />}>
      <SceneColumn>
        <Kicker label="04 · Accueillir" delay={2} tone={COLORS.successSolid} />
        <div style={{ marginTop: 30 }}>
          <Headline
            delay={6}
            size={112}
            lines={[{ text: "Check-in" }, { text: "en 1 seconde." }]}
          />
        </div>
        <div style={{ marginTop: 24 }}>
          <Sub delay={14} size={44} maxWidth={780}>
            Scanne les QR codes à l'entrée — accès confirmé, billets contrôlés.
          </Sub>
        </div>

        <MockStage>
          <Card delay={18} width={680} padding={0} shadow={SHADOWS.floating}>
            <div style={{ padding: "44px 48px 48px", textAlign: "center" }}>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 58,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: COLORS.fg,
                }}
              >
                Awa Koné
              </div>
              <div
                style={{
                  marginTop: 12,
                  fontFamily: FONTS.sans,
                  fontSize: 34,
                  color: COLORS.fgSubtle,
                }}
              >
                Pass VIP · Concert au Parc
              </div>

              <div
                style={{
                  position: "relative",
                  margin: "38px auto 0",
                  width: 392,
                  height: 392,
                  border: `2px solid ${COLORS.borderStrong}`,
                  borderRadius: 32,
                  padding: 24,
                  boxSizing: "border-box",
                  background: "#ffffff",
                }}
              >
                <StyledQr size={340} />

                <span
                  style={{
                    position: "absolute",
                    left: 16,
                    right: 16,
                    top: 22 + scan * 330,
                    height: 8,
                    borderRadius: 999,
                    background: COLORS.gold,
                    boxShadow: "0 0 28px rgba(213, 166, 56, 0.95)",
                    opacity: scanLine,
                  }}
                />

                <span
                  style={{
                    position: "absolute",
                    inset: -6,
                    borderRadius: 38,
                    border: `6px solid ${COLORS.successSolid}`,
                    opacity: ring,
                    scale: String(0.98 + 0.02 * ring),
                  }}
                />

                <span
                  style={{
                    position: "absolute",
                    right: -38,
                    bottom: -38,
                    width: 104,
                    height: 104,
                    borderRadius: 999,
                    background: COLORS.successSolid,
                    border: "8px solid #ffffff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: 56,
                    lineHeight: 1,
                    boxShadow: SHADOWS.card,
                    opacity: v,
                    scale: String(Math.max(0, validated)),
                  }}
                >
                  ✓
                </span>
              </div>

              <div
                style={{
                  marginTop: 52,
                  opacity: v,
                  scale: String(0.94 + 0.06 * v),
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "20px 42px",
                    borderRadius: 999,
                    background: COLORS.successSubtle,
                    color: COLORS.success,
                    fontFamily: FONTS.sans,
                    fontSize: 42,
                    fontWeight: 700,
                  }}
                >
                  ✓ Accès validé
                </span>
              </div>
            </div>
          </Card>
        </MockStage>
      </SceneColumn>
    </Scene>
  );
};
