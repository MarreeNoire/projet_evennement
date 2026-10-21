import { useCurrentFrame, useVideoConfig } from "remotion";

import { pop, ramp, rise } from "../motion";
import { COLORS, FONTS, SHADOWS } from "../theme";
import { Doodle, Stamps } from "../ui/Decor";
import { Headline, Scene, Sub } from "../ui/Kit";
import { LogoMark, Wordmark } from "../ui/Logo";

/* Scène 2 — la marque : le logo se pose, le nom s'installe, la promesse arrive. */

export const Brand = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const label = rise(frame, fps, 2, 20);
  const logo = pop(frame, fps, 6, { damping: 13, stiffness: 150 });
  const word = rise(frame, fps, 14, 46);

  return (
    <Scene
      bg={COLORS.bg}
      grain={0.05}
      decor={
        <>
          <Stamps color="rgba(184, 63, 34, 0.22)" count={16} />
          <Doodle
            variant="sparkle"
            stroke={COLORS.goldDeep}
            strokeWidth={5}
            progress={ramp(frame, [24, 46], [0, 1])}
            style={{ left: 150, top: 520, width: 92, height: 92 }}
          />
          <Doodle
            variant="sparkle"
            stroke={COLORS.goldDeep}
            strokeWidth={4}
            progress={ramp(frame, [32, 54], [0, 1])}
            style={{ right: 170, top: 700, width: 64, height: 64 }}
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
            fontFamily: FONTS.sans,
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: COLORS.fgSubtle,
            opacity: label.opacity,
            translate: label.translate,
          }}
        >
          La plateforme événementielle
        </div>

        <div
          style={{
            marginTop: 60,
            opacity: Math.min(1, Math.max(0, logo)),
            scale: String(logo),
            rotate: `${(1 - Math.min(1, logo)) * -10}deg`,
          }}
        >
          <LogoMark size={216} radius={68} style={{ boxShadow: SHADOWS.floating }} />
        </div>

        <div
          style={{
            position: "relative",
            marginTop: 48,
            opacity: word.opacity,
            translate: word.translate,
          }}
        >
          <Wordmark size={188} />
          <Doodle
            variant="underline"
            stroke={COLORS.goldDeep}
            strokeWidth={7}
            progress={ramp(frame, [42, 64], [0, 1])}
            style={{ left: 8, top: 194, width: 500, height: 26 }}
          />
        </div>

        <div style={{ marginTop: 66 }}>
          <Headline
            delay={30}
            size={76}
            lines={[{ text: "Bienvenue dans" }, { text: "la communauté." }]}
          />
        </div>

        <div style={{ marginTop: 34 }}>
          <Sub delay={44} size={46} maxWidth={780}>
            Concerts, expos, ateliers, sport — découvre les sorties près de chez toi.
          </Sub>
        </div>

        <div style={{ marginTop: 56 }}>
          <Sub delay={58} size={36} color={COLORS.fgSubtle}>
            Abidjan · Côte d'Ivoire · Billetterie en FCFA
          </Sub>
        </div>
      </div>
    </Scene>
  );
};
