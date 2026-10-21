import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

import { pop, rise } from "../motion";
import { COLORS, FONTS } from "../theme";
import { Stamps } from "../ui/Decor";
import { Card, Headline, Kicker, MockStage, Scene, SceneColumn, Sub } from "../ui/Kit";

/* Scène 5 — rassembler : le salon communautaire, en direct, avec ses bulles
   qui arrivent une à une et sa pastille de réaction. */

const Avatar = ({
  initial,
  color,
  size = 64,
  delay = 0,
}: {
  initial: string;
  color: string;
  size?: number;
  delay?: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, delay, { damping: 13, stiffness: 170 });
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: color,
        color: COLORS.white,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONTS.sans,
        fontWeight: 700,
        fontSize: Math.round(size * 0.42),
        border: "4px solid #ffffff",
        boxSizing: "border-box",
        opacity: Math.min(1, Math.max(0, s)),
        scale: String(Math.max(0, s)),
      }}
    >
      {initial}
    </span>
  );
};

const Bubble = ({
  delay,
  side,
  author,
  time,
  tone,
  avatarInitial,
  children,
}: {
  delay: number;
  side: "left" | "right";
  author: string;
  time: string;
  tone: string;
  avatarInitial: string;
  children: ReactNode;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = rise(frame, fps, delay, 46);
  const isRight = side === "right";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 18,
        justifyContent: isRight ? "flex-end" : "flex-start",
        opacity: s.opacity,
        translate: s.translate,
      }}
    >
      {isRight ? null : (
        <Avatar initial={avatarInitial} color={tone} size={64} delay={delay} />
      )}
      <div
        style={{
          maxWidth: 566,
          display: "flex",
          flexDirection: "column",
          alignItems: isRight ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 30,
            color: COLORS.fgSubtle,
            marginBottom: 10,
          }}
        >
          {author} · {time}
        </div>
        <div
          style={{
            background: isRight ? COLORS.primary : COLORS.bgSubtle,
            color: isRight ? COLORS.white : COLORS.fg,
            padding: "22px 32px",
            borderRadius: isRight ? "30px 30px 10px 30px" : "30px 30px 30px 10px",
            fontFamily: FONTS.sans,
            fontSize: 40,
            lineHeight: 1.3,
            fontWeight: 500,
            display: "inline-block",
          }}
        >
          {children}
        </div>
      </div>
      {isRight ? <Avatar initial={avatarInitial} color={tone} size={64} delay={delay} /> : null}
    </div>
  );
};

const Reaction = ({ delay, style }: { delay: number; style?: CSSProperties }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, delay, { damping: 12, stiffness: 190 });
  return (
    <span
      style={{
        position: "absolute",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 22px",
        borderRadius: 999,
        background: COLORS.surfaceRaised,
        border: `2px solid ${COLORS.border}`,
        boxShadow: "0 8px 24px rgba(32, 42, 53, 0.14)",
        fontFamily: FONTS.sans,
        fontSize: 32,
        fontWeight: 700,
        color: COLORS.fg,
        opacity: Math.min(1, Math.max(0, s)),
        scale: String(Math.max(0, s)),
        ...style,
      }}
    >
      ❤️ 12
    </span>
  );
};

const Typing = ({ delay }: { delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = rise(frame, fps, delay, 30);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 18,
        opacity: s.opacity,
        translate: s.translate,
      }}
    >
      <Avatar initial="T" color={COLORS.posters[4]} size={64} delay={delay} />
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 14,
          background: COLORS.bgSubtle,
          borderRadius: "30px 30px 30px 10px",
          padding: "30px 34px",
        }}
      >
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              background: COLORS.fgSubtle,
              opacity: 0.85,
              translate: `0px ${
                frame > delay ? Math.sin((frame - delay) / 5.5 + dot * 1.15) * 6 : 0
              }px`,
            }}
          />
        ))}
      </span>
    </div>
  );
};

const Live = ({ delay }: { delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, delay, { damping: 14 });
  const pulse = 1 + 0.22 * Math.max(0, Math.sin(frame / 6));
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 26px",
        borderRadius: 999,
        background: COLORS.successSubtle,
        color: COLORS.success,
        fontFamily: FONTS.sans,
        fontSize: 30,
        fontWeight: 700,
        whiteSpace: "nowrap",
        opacity: Math.min(1, Math.max(0, s)),
        scale: String(Math.max(0, s)),
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          background: COLORS.successSolid,
          scale: String(pulse),
        }}
      />
      En direct
    </span>
  );
};

export const Salon = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const header = rise(frame, fps, 26, 30);

  return (
    <Scene bg={COLORS.bg} grain={0.05} decor={<Stamps color="rgba(32, 42, 53, 0.18)" count={14} />}>
      <SceneColumn>
        <Kicker label="03 · Rassembler" delay={2} tone={COLORS.accentSolid} />
        <div style={{ marginTop: 30 }}>
          <Headline
            delay={6}
            size={112}
            lines={[{ text: "Rassemble" }, { text: "ta communauté." }]}
          />
        </div>
        <div style={{ marginTop: 24 }}>
          <Sub delay={14} size={44} maxWidth={800}>
            Un salon pour échanger avant, pendant et après l'événement.
          </Sub>
        </div>

        <MockStage>
          <Card delay={22} width={888} padding={40}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                opacity: header.opacity,
                translate: header.translate,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ display: "flex" }}>
                  {[
                    { initial: "A", color: COLORS.posters[1] },
                    { initial: "K", color: COLORS.posters[2] },
                    { initial: "T", color: COLORS.posters[4] },
                  ].map((person, index) => (
                    <span
                      key={person.initial}
                      style={{
                        marginLeft: index === 0 ? 0 : -22,
                        zIndex: 3 - index,
                        display: "inline-flex",
                      }}
                    >
                      <Avatar initial={person.initial} color={person.color} size={72} delay={26} />
                    </span>
                  ))}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 36,
                      fontWeight: 700,
                      color: COLORS.fg,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Salon · Concert au Parc
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 32,
                      color: COLORS.fgSubtle,
                      marginTop: 6,
                    }}
                  >
                    128 membres
                  </div>
                </div>
              </div>
              <Live delay={34} />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 30,
                marginTop: 40,
              }}
            >
              <div style={{ position: "relative" }}>
                <Bubble
                  delay={42}
                  side="left"
                  author="Awa"
                  time="13:02"
                  tone={COLORS.posters[1]}
                  avatarInitial="A"
                >
                  Qui vient samedi ? 🔥
                </Bubble>
                <Reaction delay={86} style={{ left: 402, bottom: -28 }} />
              </div>
              <Bubble
                delay={56}
                side="right"
                author="Toi"
                time="13:04"
                tone={COLORS.accentSolid}
                avatarInitial="T"
              >
                J'y serai avec 2 potes 🙌
              </Bubble>
              <Bubble
                delay={70}
                side="left"
                author="Koffi"
                time="13:05"
                tone={COLORS.posters[2]}
                avatarInitial="K"
              >
                On se retrouve à l'entrée ?
              </Bubble>
              <Typing delay={98} />
            </div>
          </Card>
        </MockStage>
      </SceneColumn>
    </Scene>
  );
};
