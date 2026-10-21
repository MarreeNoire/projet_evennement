import { useCurrentFrame, useVideoConfig } from "remotion";

import { pop, ramp } from "../motion";
import { COLORS, FONTS, SHADOWS } from "../theme";
import { Doodle, Stamps } from "../ui/Decor";
import { Headline, Scene, Sub } from "../ui/Kit";
import { LogoMark, Wordmark } from "../ui/Logo";

/* Scène 7 — l'appel à l'action : la signature de marque, la ligne du site et
   le bouton « Lien en bio » qui pulse. */

export const Cta = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logo = pop(frame, fps, 4, { damping: 13, stiffness: 150 });
  const button = pop(frame, fps, 48, { damping: 13, stiffness: 160 });
  const arrowBob = frame > 64 ? Math.sin((frame - 64) / 7) * 9 : 0;

  const pulsePeriod = 44;
  const pulse = frame >= 56 ? ((frame - 56) % pulsePeriod) / pulsePeriod : 0;

  return (
    <Scene
      bg={COLORS.bg}
      grain={0.05}
      decor={
        <>
          <Stamps color="rgba(184, 63, 34, 0.2)" count={16} />
          <Doodle
            variant="sparkle"
            stroke={COLORS.goldDeep}
            strokeWidth={5}
            progress={ramp(frame, [36, 56], [0, 1])}
            style={{ left: 158, top: 560, width: 86, height: 86 }}
          />
          <Doodle
            variant="swirl"
            stroke="rgba(184, 63, 34, 0.42)"
            strokeWidth={7}
            progress={ramp(frame, [46, 68], [0, 1])}
            style={{ right: 128, bottom: 300, width: 140, height: 140 }}
          />
        </>
      }
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 120px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 30,
            opacity: Math.min(1, Math.max(0, logo)),
            scale: String(Math.max(0, logo)),
          }}
        >
          <LogoMark size={140} radius={44} />
          <Wordmark size={138} />
        </div>

        <div style={{ marginTop: 70 }}>
          <Headline
            delay={14}
            size={96}
            lines={[
              { text: "Rejoins Event," },
              { text: "c'est rejoindre" },
              { text: "une communauté.", color: COLORS.primary },
            ]}
          />
        </div>

        <div style={{ position: "relative", marginTop: 84 }}>
          {frame >= 56 ? (
            <span
              style={{
                position: "absolute",
                inset: -6,
                borderRadius: 999,
                border: `5px solid rgba(32, 42, 53, ${0.35 * (1 - pulse)})`,
                scale: String(1 + pulse * 0.16),
              }}
            />
          ) : null}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 22,
              padding: "32px 68px",
              borderRadius: 999,
              background: COLORS.fg,
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 52,
              fontWeight: 700,
              boxShadow: SHADOWS.floating,
              opacity: Math.min(1, Math.max(0, button)),
              scale: String(Math.max(0, button)),
            }}
          >
            Lien en bio
            <span style={{ translate: `0px ${arrowBob}px`, fontSize: 58, lineHeight: 1 }}>↓</span>
          </span>
        </div>

        <div style={{ marginTop: 88 }}>
          <Sub delay={64} size={40} color={COLORS.fgSubtle}>
            Concerts · Expos · Ateliers · Sport
          </Sub>
        </div>
      </div>
    </Scene>
  );
};
