import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "react-qr-code";

import { AccessLevelBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { EmptyState } from "@/components/ui/states";
import { SocialPageHeader, SocialShell } from "@/components/social/social-shell";
import { ROUTES, TICKET_STATUS_LABELS } from "@/lib/constants";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Mes billets" };

/* =============================================================================
   Mes billets — un carnet de talons
   --------------------------------------------------------------------------
   Chaque billet garde la forme du billet acheté : affiche à gauche (couleur
   déterministe de l'événement), talon perforé à droite avec le QR code.
   ========================================================================== */

export default async function MyTicketsPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`${ROUTES.login}?redirect=${ROUTES.myTickets}`);

  const supabase = await createSupabaseServerClient();
  const { data: tickets } = await supabase
    .from("my_tickets")
    .select("*")
    .order("event_start_at", { ascending: true });

  const list = tickets ?? [];

  return (
    <SocialShell active="billets">
      <div className="flex flex-col gap-10">
        <SocialPageHeader
          eyebrow="Portefeuille"
          title="Mes"
          accent="billets."
          description="Présente le QR code à l'entrée. Un billet = une entrée, ne le partage pas."
        />

        {list.length === 0 ? (
          <EmptyState
            title="Aucun billet pour le moment"
            description="Explore les événements et réserve ta place en mobile money."
            action={<ButtonLink href={ROUTES.explore}>Explorer les événements</ButtonLink>}
          />
        ) : (
          <ul className="flex flex-col gap-6">
            {list.map((ticket) => (
              <li key={ticket.id}>
                <TicketStub ticket={ticket} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </SocialShell>
  );
}

function TicketStub({ ticket }: { ticket: Record<string, any> }) {
  return (
    <Link
      href={`/billets/${ticket.id}`}
      className="group border-border hover:border-border flex flex-col overflow-hidden rounded-lg border transition-colors duration-150 sm:flex-row"
    >
      {/* Affiche */}
      <div className="bg-bg-muted relative flex min-h-32 flex-1 flex-col justify-between gap-6 overflow-hidden p-5 sm:p-6">
        {ticket.event_cover_url ? (
          <PublicStorageImage
            src={ticket.event_cover_url}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-25"
            sizes="(min-width: 640px) 65vw, 100vw"
            fill
            quality={55}
          />
        ) : null}
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="font-display max-w-sm text-xl leading-tight font-semibold sm:text-2xl">
              {ticket.event_title}
            </p>
            <span className="text-2xs rounded-sm bg-black/15 px-2 py-0.5 font-bold tracking-[0.08em] uppercase">
              {TICKET_STATUS_LABELS[ticket.status as keyof typeof TICKET_STATUS_LABELS] ??
                ticket.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium opacity-90">
            <span>{formatDate(ticket.event_start_at)}</span>
            <span>{ticket.city}</span>
            <AccessLevelBadge level={ticket.access_level} />
          </div>
        </div>
      </div>

      {/* Talon perforé */}
      <div
        aria-hidden="true"
        className="border-border-strong border-t-2 border-dashed sm:h-auto sm:w-0 sm:border-t-0 sm:border-l-2"
      />
      <div className="bg-surface-raised flex shrink-0 items-center gap-4 p-5 sm:w-56 sm:flex-col sm:items-center sm:justify-center sm:gap-3 sm:p-6">
        <div className="border-border-strong rounded-md border bg-white p-2 shadow-xs">
          <QRCode value={ticket.qr_token} size={76} aria-label="QR code du billet" />
        </div>
        <div className="min-w-0 text-center sm:text-center">
          <p className="truncate text-sm font-semibold">{ticket.ticket_type_name}</p>
          <p className="font-display text-fg-subtle text-xs tracking-wide tabular-nums">
            {ticket.reference}
          </p>
        </div>
      </div>
    </Link>
  );
}
