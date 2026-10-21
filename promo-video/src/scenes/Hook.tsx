import { useCurrentFrame, useVideoConfig } from "remotion";

import { ramp, rise } from "../motion";
import { COLORS, FONTS } from "../theme";
import { Doodle, Stamps, Vignette } from "../ui/Decor";
import { Headline, Pill, Scene } from "../ui/Kit";

/* Scène 1 — l'accroche : « Tu organises un événement ? » sur bandeau vermillon.
   Les quatre verbes annoncent les chapitres de la vidéo. */

const CHAPTERS = ["Créer", "Vendre", "Rassembler", "Accueillir"];

export const Hook = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sub = rise(frame, fps, 20, 30);

  return (
    <Scene
      bg={COLORS.primary}
      grain={0.07}
      decor={
        <>
          <Vignette />
          <Stamps color="rgba(255, 255, 255, 0.5)" count={18} />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "26%",
              translate: "-50% -50%",
              rotate: `${frame * 0.12}deg`,
              opacity: 0.11,
            }}
          >
            <svg width={760} height={760} viewBox="0 0 64 64" fill="none">
              <path
                d="M32 3 L38 26 L61 32 L38 38 L32 61 L26 38 L3 32 L26 26 Z"
                fill={COLORS.gold}
              />
            </svg>
          </div>
          <Doodle
            variant="swirl"
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth={5}
            progress={ramp(frame, [14, 44], [0, 1])}
            style={{ left: 120, bottom: 330, width: 150, height: 150 }}
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
          padding: "0 96px",
        }}
      >
        <Headline
          delay={4}
          size={128}
          color={COLORS.white}
          lines={[
            { text: "Tu organises" },
            { text: "un événement ?", color: COLORS.gold },
          ]}
        />

        <div
          style={{
            marginTop: 38,
            fontFamily: FONTS.sans,
            fontSize: 46,
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.92)",
            opacity: sub.opacity,
            translate: sub.translate,
          }}
        >
          Event s'occupe du reste.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto auto",
            justifyItems: "center",
            justifyContent: "center",
            gap: 18,
            marginTop: 88,
          }}
        >
          {CHAPTERS.map((label, index) => (
            <Pill
              key={label}
              delay={30 + index * 7}
              bg="rgba(255, 255, 255, 0.14)"
              border="rgba(255, 255, 255, 0.42)"
              color={COLORS.white}
              size={44}
              rotate={index % 2 === 0 ? -2 : 2}
            >
              {label}
            </Pill>
          ))}
        </div>
      </div>
    </Scene>
  );
};
