import Link from "next/link";
import { redirect } from "next/navigation";

import { PhaseTag } from "@/components/social/phase-tag";
import { SocialPageHeader, SocialShell } from "@/components/social/social-shell";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { ROUTES } from "@/lib/constants";
import { getEventsByIds, getUserSalons, type SalonEventInfo } from "@/lib/salons/queries";
import { comparePhases, getEventPhase, phaseStatus } from "@/lib/social/phase";
import { dayMonth } from "@/lib/social/time";
import { getCurrentProfile } from "@/lib/supabase/server";

export const metadata = {
  title: "Mes salons",
  description: "Les salons de tes événements : échange avant, pendant et après.",
};

/* =============================================================================
   Mes salons — une pile de talons de billets
   --------------------------------------------------------------------------
   Chaque salon est un talon : la date de l'événement à gauche (couleur de
   l'affiche), le nom et l'état au milieu (« En direct », « Dans 3 jours »,
   « Terminé »), l'accès à droite après la perforation. Les salons en direct
   remontent en premier.
   ========================================================================== */

export default async function MesSalonsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`${ROUTES.login}?redirect=${ROUTES.mySalons}`);

  const salons = await getUserSalons();
  const events = await getEventsByIds(
    salons.map((salon) => salon.event_id).filter((id): id is string => Boolean(id)),
  );
  const now = new Date();

  const entries = salons
    .map((salon) => ({
      salon,
      event: salon.event_id ? (events.get(salon.event_id) ?? null) : null,
    }))
    .sort((a, b) => {
      if (a.event && b.event) return comparePhases(a.event, b.event, now);
      if (a.event) return -1;
      if (b.event) return 1;
      return a.salon.name.localeCompare(b.salon.name, "fr");
    });

  return (
    <SocialShell active="salons">
      <div className="flex flex-col gap-10">
        <SocialPageHeader
          eyebrow="Mes salons"
          title="Là où ça"
          accent="se passe."
          description="Un salon par événement : présente-toi avant, retrouve-toi sur place, garde le lien après."
          action={
            <ButtonLink href={ROUTES.explore} variant="secondary">
              Trouver un événement
            </ButtonLink>
          }
        />

        {entries.length === 0 ? (
          <EmptyState
            title="Aucun salon pour l'instant"
            description="Dès que tu réserves un billet, le salon de l'événement s'ouvre automatiquement ici."
            action={<ButtonLink href={ROUTES.explore}>Trouver un événement</ButtonLink>}
          />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2">
            {entries.map(({ salon, event }) => (
              <li key={salon.id}>
                <SalonStub salon={salon} event={event} now={now} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </SocialShell>
  );
}

function SalonStub({
  salon,
  event,
  now,
}: {
  salon: Awaited<ReturnType<typeof getUserSalons>>[number];
  event: SalonEventInfo | null;
  now: Date;
}) {
  const date = event ? dayMonth(event.start_at) : null;
  const phase = event ? getEventPhase(event.start_at, event.end_at, now) : null;
  const members = salon.member_count ?? salon.members.length;

  return (
    <Link
      href={`/salons/${salon.id}`}
      className="group border-border bg-surface hover:border-primary/50 flex min-h-64 flex-col overflow-hidden border transition-colors duration-150"
    >
      <div className="bg-bg-muted border-border relative h-36 overflow-hidden border-b">
        {event?.cover_url ? (
          // Les couvertures Supabase sont servies directement, sans proxy Next.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_url}
            alt=""
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : date ? (
          <div className="flex size-full items-center justify-between px-6">
            <time dateTime={event?.start_at} className="text-fg-muted flex items-baseline gap-2">
              <span className="font-display text-5xl leading-none font-semibold tabular-nums">
                {date.day}
              </span>
              <span className="text-xs font-bold tracking-[0.14em] uppercase">
                {date.month} {date.year}
              </span>
            </time>
            <span className="bg-primary/10 h-full w-1/3" aria-hidden="true" />
          </div>
        ) : (
          <span className="text-fg-subtle flex size-full items-center px-6 text-sm">
            Salon communautaire
          </span>
        )}
        {event && phase ? (
          <div className="absolute bottom-3 left-4">
            <PhaseTag phase={phase} label={phaseStatus(event.start_at, event.end_at, now)} />
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <p className="text-fg-subtle text-xs font-semibold tracking-[0.12em] uppercase">
          {event ? `${event.title} · ${event.city}` : "Salon communautaire"}
        </p>
        <h2 className="font-display group-hover:text-primary mt-2 truncate text-2xl leading-tight font-semibold">
          {salon.name}
        </h2>
        <div className="text-fg-muted border-border mt-auto flex items-center justify-between gap-3 border-t pt-4 text-sm">
          <span>
            {members} participant{members > 1 ? "s" : ""}
          </span>
          <span>
            {salon.post_count} publication{salon.post_count === 1 ? "" : "s"}
          </span>
          <span className="text-primary font-semibold">Ouvrir →</span>
        </div>
      </div>
    </Link>
  );
}
