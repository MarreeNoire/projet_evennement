import type { ReactNode } from "react";

import { COLORS } from "../theme";

/* =============================================================================
   QR stylisé — motif déterministe avec ses trois repères d'angle.
   Volontairement décoratif : il évoque le billet sans encoder d'URL.
   ========================================================================== */

export const StyledQr = ({ size = 340, seed = 11 }: { size?: number; seed?: number }) => {
  const cells = 25;
  const dataCells: ReactNode[] = [];
  const finders: ReactNode[] = [];

  const isFinderZone = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= cells - 8 && y < 8) || (x < 8 && y >= cells - 8);

  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      if (isFinderZone(x, y)) continue;
      const isTiming = x === 6 || y === 6;
      const on = isTiming
        ? (x + y) % 2 === 0
        : (x * 73 + y * 151 + ((x * y) % 23) * 17 + seed) % 11 < 5;
      if (on) {
        dataCells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
      }
    }
  }

  const corners: Array<[number, number]> = [
    [0, 0],
    [cells - 7, 0],
    [0, cells - 7],
  ];

  corners.forEach(([cx, cy], index) => {
    finders.push(<rect key={`o${index}`} x={cx} y={cy} width={7} height={7} />);
    finders.push(
      <rect key={`i${index}`} x={cx + 1} y={cy + 1} width={5} height={5} fill="#ffffff" />,
    );
    finders.push(<rect key={`c${index}`} x={cx + 2} y={cy + 2} width={3} height={3} />);
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${cells} ${cells}`}
      shapeRendering="crispEdges"
      style={{ display: "block" }}
    >
      <rect width={cells} height={cells} fill="#ffffff" />
      <g fill={COLORS.fg}>
        {dataCells}
        {finders}
      </g>
    </svg>
  );
};
