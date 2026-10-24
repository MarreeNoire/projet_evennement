import type { CSSProperties } from "react";

type GaugeProps = {
  value: number;
  /** Libellé lu par les lecteurs d'écran, plus parlant qu'un pourcentage seul. */
  label: string;
  min?: string;
  max?: string;
};

/* Demi-cercle : `pathLength={100}` permet d'exprimer le remplissage en
   pourcentage sans calculer la longueur réelle de la courbe. */
const ARC = "M 10 62 A 50 50 0 0 1 110 62";

export function Gauge({ value, label, min = "", max = "" }: GaugeProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  const style = {
    "--arc-length": 100,
    "--arc-offset": 100 - clamped,
  } as CSSProperties;

  return (
    <div className="w-full">
      <svg
        viewBox="0 0 120 74"
        role="img"
        aria-label={`${label} : ${clamped} %`}
        className="mx-auto block h-auto w-full max-w-[11rem]"
      >
        <path
          d={ARC}
          fill="none"
          stroke="rgba(244,242,236,0.18)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d={ARC}
          fill="none"
          stroke="var(--mint)"
          strokeWidth="7"
          strokeLinecap="round"
          pathLength={100}
          className="home-gauge-arc"
          style={style}
        />
        <text
          x="60"
          y="56"
          textAnchor="middle"
          fill="var(--paper)"
          fontFamily="var(--font-display)"
          fontSize="21"
        >
          {clamped}%
        </text>
      </svg>

      {min || max ? (
        <div className="flex items-center justify-between text-[0.65rem] text-[rgba(244,242,236,0.6)]">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      ) : null}
    </div>
  );
}
