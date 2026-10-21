import { useCurrentFrame, useVideoConfig } from "remotion";

import { counter, ramp, rise } from "../motion";
import { COLORS, FONTS } from "../theme";
import { Stamps } from "../ui/Decor";
import { Card, Headline, Kicker, MockStage, Pill, Scene, SceneColumn, Sub } from "../ui/Kit";

/* Scène 4 — vendre : billets en FCFA, encaissement Mobile Money, compteur de
   ventes qui grimpe. */

const TicketRow = ({
  delay,
  title,
  seats,
  price,
}: {
  delay: number;
  title: string;
  seats: string;
  price: string;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = rise(frame, fps, delay, 40);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        opacity: s.opacity,
        translate: s.translate,
      }}
    >
      <div>
        <div style={{ fontFamily: FONTS.sans, fontSize: 48, fontWeight: 700, color: COLORS.fg }}>
          {title}
        </div>
        <div style={{ fontFamily: FONTS.sans, fontSize: 34, color: COLORS.fgSubtle, marginTop: 8 }}>
          {seats}
        </div>
      </div>
      <div
        style={{
          fontFamily: FONTS.display,
          fontSize: 54,
          fontWeight: 700,
          color: COLORS.primary,
          letterSpacing: "-0.02em",
        }}
      >
        {price}
      </div>
    </div>
  );
};

const Perforation = ({ delay }: { delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = rise(frame, fps, delay, 26);
  return (
    <div style={{ position: "relative", margin: "38px -56px", opacity: s.opacity }}>
      <div style={{ borderTop: `3px dashed ${COLORS.borderStrong}` }} />
      <span
        style={{
          position: "absolute",
          left: -22,
          top: -20,
          width: 40,
          height: 40,
          borderRadius: 999,
          background: COLORS.bg,
          border: `2px solid ${COLORS.border}`,
        }}
      />
      <span
        style={{
          position: "absolute",
          right: -22,
          top: -20,
          width: 40,
          height: 40,
          borderRadius: 999,
          background: COLORS.bg,
          border: `2px solid ${COLORS.border}`,
        }}
      />
    </div>
  );
};

const SalesCounter = ({ delay }: { delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = rise(frame, fps, delay, 40);
  const sold = counter(frame, delay + 4, 46, 72);
  const ratio = ramp(frame, [delay + 4, delay + 50], [0, 0.36]);

  return (
    <div style={{ opacity: s.opacity, translate: s.translate }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ fontFamily: FONTS.sans, fontSize: 44, fontWeight: 700, color: COLORS.fg }}>
          {sold} billets vendus
        </div>
        <div style={{ fontFamily: FONTS.sans, fontSize: 36, fontWeight: 600, color: COLORS.fgSubtle }}>
          {sold} / 200
        </div>
      </div>
      <div
        style={{
          marginTop: 22,
          height: 14,
          borderRadius: 999,
          background: COLORS.bgMuted,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${ratio * 100}%`,
            height: "100%",
            borderRadius: 999,
            background: COLORS.primary,
          }}
        />
      </div>
    </div>
  );
};

const PAYMENTS: Array<{ label: string; dot: string }> = [
  { label: "Wave", dot: "#00b8d9" },
  { label: "Orange Money", dot: "#ff7900" },
  { label: "MTN", dot: "#ffcb05" },
  { label: "Moov", dot: "#0066b3" },
];

export const Tickets = () => {
  return (
    <Scene bg={COLORS.bg} grain={0.05} decor={<Stamps color="rgba(32, 42, 53, 0.18)" count={14} />}>
      <SceneColumn>
        <Kicker label="02 · Vendre" delay={2} tone={COLORS.goldDeep} />
        <div style={{ marginTop: 30 }}>
          <Headline
            delay={6}
            size={112}
            lines={[{ text: "Vends tes billets" }, { text: "en FCFA.", color: COLORS.primary }]}
          />
        </div>
        <div style={{ marginTop: 24 }}>
          <Sub delay={14} size={44} maxWidth={780}>
            Wave, Orange Money, MTN, Moov — ou carte bancaire.
          </Sub>
        </div>

        <MockStage>
          <Card delay={24} padding={0} width={888}>
            <div style={{ padding: "46px 56px 10px" }}>
              <TicketRow
                delay={30}
                title="Pass Standard"
                seats="200 places disponibles"
                price="5 000 FCFA"
              />
              <Perforation delay={40} />
              <TicketRow
                delay={46}
                title="Pass VIP"
                seats="50 places disponibles"
                price="15 000 FCFA"
              />
              <Perforation delay={54} />
              <SalesCounter delay={62} />
            </div>
          </Card>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 12,
              marginTop: 40,
              width: 888,
            }}
          >
            {PAYMENTS.map((payment, index) => (
              <Pill
                key={payment.label}
                delay={76 + index * 6}
                size={32}
                style={{ padding: "14px 24px", gap: 12 }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    background: payment.dot,
                  }}
                />
                {payment.label}
              </Pill>
            ))}
          </div>
        </MockStage>
      </SceneColumn>
    </Scene>
  );
};
