/* =============================================================================
   Tampon d'événement
   --------------------------------------------------------------------------
   Chaque événement vécu laisse un tampon sur le profil, comme sur un passeport.
   Encre et inclinaison sont déterministes (à partir du titre) : le même
   événement a toujours le même tampon.
   ========================================================================== */

const INKS = ["var(--stamp-1)", "var(--stamp-2)", "var(--stamp-3)"] as const;
const TILTS = [-7, 4, -3, 6] as const;

function hash(seed: string): number {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) {
    value = (value * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return value;
}

export function Stamp({ title, date }: { title: string; date: string }) {
  const seed = hash(title);
  const ink = INKS[seed % INKS.length];
  const tilt = TILTS[seed % TILTS.length];

  return (
    <div
      role="img"
      aria-label={`${title}, ${date}`}
      className="flex size-32 shrink-0 items-center justify-center rounded-full border-2 p-1"
      style={{ color: ink, borderColor: ink, transform: `rotate(${tilt}deg)` }}
    >
      <div className="flex size-full flex-col items-center justify-center rounded-full border border-current px-3 text-center">
        <span className="text-[0.625rem] font-bold tracking-[0.16em] uppercase">{date}</span>
        <span className="mt-1 line-clamp-3 font-display text-[0.8125rem] leading-tight font-semibold italic">
          {title}
        </span>
      </div>
    </div>
  );
}
