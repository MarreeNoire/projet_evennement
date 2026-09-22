import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "react-qr-code";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AccessLevelBadge, Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { ROUTES, TICKET_STATUS_LABELS } from "@/lib/constants";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

/* Mes billets : liste des billets valides de l'utilisateur connecté. */

export default async function MyTicketsPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?redirect=${ROUTES.myTickets}`);

  const supabase = await createSupabaseServerClient();
  const { data: tickets } = await supabase
    .from("my_tickets")
    .select("*")
    .order("event_start_at", { ascending: true });

  const list = tickets ?? [];

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex flex-col gap-6 py-8">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Mes billets</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Présente le QR code à l'entrée. Un billet = une entrée, ne le partage pas.
          </p>
        </div>

        {list.length === 0 ? (
          <EmptyState
            title="Aucun billet pour le moment"
            description="Explore les événements et réserve ta place en mobile money."
            action={<ButtonLink href="/explorer">Explorer les événements</ButtonLink>}
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {list.map((ticket) => (
              <li key={ticket.id}>
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="truncate">{ticket.event_title}</CardTitle>
                        <p className="mt-0.5 text-sm text-fg-muted">
                          {formatDateTime(ticket.event_start_at)} · {ticket.city}
                        </p>
                      </div>
                      <Badge variant={ticket.status === "paid" ? "success" : "neutral"}>
                        {TICKET_STATUS_LABELS[ticket.status as keyof typeof TICKET_STATUS_LABELS] ?? ticket.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center gap-4">
                    <div className="rounded-xl border border-border bg-white p-2" aria-hidden="true">
                      <QRCode value={ticket.qr_token} size={88} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <p className="text-sm">
                        <strong>{ticket.ticket_type_name}</strong> · Réf {ticket.reference}
                      </p>
                      <p>
                        <AccessLevelBadge level={ticket.access_level} />
                      </p>
                      <Link
                        href={`/billets/${ticket.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Ouvrir le billet →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
