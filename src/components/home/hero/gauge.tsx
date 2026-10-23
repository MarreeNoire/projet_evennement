type GaugeProps = {
  value: number;
  color?: string;
  showLabels?: boolean;
  min?: string;
  max?: string;
};

const TICK_COUNT = 40;
const CENTER = 100;
const RADIUS = 80;
const TICK_INNER_RADIUS = RADIUS - 10;

export function Gauge({
  value,
  color = "#ef4d23",
  showLabels = false,
  min = "",
  max = "",
}: GaugeProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const activeTicks = Math.round((clampedValue / 100) * TICK_COUNT);

  return (
    <div className="mx-auto w-full max-w-[260px]">
      <svg
        viewBox="0 0 200 120"
        role="img"
        aria-label={`${clampedValue}%`}
        className="mx-auto block h-auto w-full"
      >
        {Array.from({ length: TICK_COUNT }, (_, index) => {
          const angle = Math.PI + (index / (TICK_COUNT - 1)) * Math.PI;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          return (
            <line
              key={index}
              x1={CENTER + cos * TICK_INNER_RADIUS}
              y1={CENTER + sin * TICK_INNER_RADIUS}
              x2={CENTER + cos * RADIUS}
              y2={CENTER + sin * RADIUS}
              stroke={index < activeTicks ? color : "#d4d4d8"}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          );
        })}
        <text
          x="100"
          y="105"
          textAnchor="middle"
          fill="#171717"
          fontSize="22"
          fontWeight="600"
        >
          {clampedValue}%
        </text>
      </svg>

      {showLabels ? (
        <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-500">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      ) : null}
    </div>
  );
}
