import { notFound, redirect } from "next/navigation";
import QRCode from "react-qr-code";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AccessLevelBadge, Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { ROUTES, TICKET_STATUS_LABELS } from "@/lib/constants";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateTime, formatPrice } from "@/lib/utils";

/* Billet individuel : QR grand format + infos d'accès. */

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?redirect=/billets/${id}`);

  const supabase = await createSupabaseServerClient();
  const { data: ticket } = await supabase.from("my_tickets").select("*").eq("id", id).maybeSingle();

  if (!ticket) notFound();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex max-w-xl flex-col gap-6 py-8">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold">{ticket.event_title}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {formatDateTime(ticket.event_start_at)}
            {ticket.venue_name ? ` · ${ticket.venue_name}` : ""} · {ticket.city}
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>
                {ticket.ticket_type_name} · {formatPrice(ticket.price_paid)}
              </CardTitle>
              <p className="mt-0.5 text-sm text-fg-muted">
                Réf {ticket.reference}
                {ticket.holder_name ? ` · ${ticket.holder_name}` : ""}
              </p>
            </div>
            <Badge variant={ticket.status === "paid" ? "success" : "neutral"}>
              {TICKET_STATUS_LABELS[ticket.status as keyof typeof TICKET_STATUS_LABELS] ?? ticket.status}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="rounded-2xl border border-border bg-white p-4">
              <QRCode value={ticket.qr_token} size={220} aria-label={`QR code du billet ${ticket.reference}`} />
            </div>
            <p>
              <AccessLevelBadge level={ticket.access_level} />
            </p>
            <p className="text-center text-xs text-fg-subtle">
              Présente ce QR à l'entrée. Il est personnel et à usage unique. Ne le partage pas.
              {ticket.checked_in_at ? ` Scanné le ${formatDateTime(ticket.checked_in_at)}.` : ""}
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-2">
          <ButtonLink href={ROUTES.myTickets} variant="secondary">
            Tous mes billets
          </ButtonLink>
          <ButtonLink href={`/evenements/${ticket.event_slug}/salon`}>
            Rejoindre le salon
          </ButtonLink>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
