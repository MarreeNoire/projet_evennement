import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Alert } from "@/components/ui/states";
import { getPublishedEventBySlug } from "@/lib/events/queries";
import { env } from "@/lib/env";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";

const EVENT_DATE = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Abidjan",
});

export async function CheckoutPanel({
  slug,
  type,
  inDialog = false,
}: {
  slug: string;
  type?: string;
  inDialog?: boolean;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/connexion?redirect=/evenements/${slug}/billets`);

  const data = await getPublishedEventBySlug(slug).catch(() => null);
  if (!data) notFound();

  const supabase = await createSupabaseServerClient();
  const [{ data: full }, { data: contact }] = await Promise.all([
    supabase.from("events").select("id").eq("id", data.event.id).maybeSingle(),
    supabase.from("profile_contacts").select("phone").eq("user_id", profile.id).maybeSingle(),
  ]);
  if (!full) notFound();

  const ticketTypes = data.ticketTypes.filter((ticket) => ticket.is_active);

  return (
    <div
      className={`mx-auto flex w-full max-w-3xl flex-col gap-6 ${inDialog ? "checkout-panel-dialog" : ""}`}
    >
      {!inDialog ? (
        <header className="border-border flex flex-col gap-3 border-b pb-5">
          <nav
            aria-label="Fil d'Ariane"
            className="text-fg-muted flex flex-wrap items-center gap-1.5 text-xs"
          >
            <Link
              href={`/evenements/${slug}`}
              className="hover:text-fg underline-offset-4 hover:underline"
            >
              {data.event.title}
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="text-fg">
              Commander
            </span>
          </nav>

          <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Commander <em className="text-primary not-italic">mes billets.</em>
          </h1>

          <div className="text-fg-muted flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 shrink-0 opacity-70" aria-hidden="true" />
              {EVENT_DATE.format(new Date(data.event.start_at))}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0 opacity-70" aria-hidden="true" />
              {[data.event.venue_name, data.event.city].filter(Boolean).join(" · ")}
            </span>
          </div>
        </header>
      ) : (
        <p className="text-fg-muted border-border border-b pb-4 text-sm">
          Billets pour <span className="text-fg font-semibold">{data.event.title}</span>
        </p>
      )}

      {ticketTypes.length === 0 ? (
        <Alert tone="warning" title="Billetterie indisponible">
          Tous les tarifs sont épuisés ou désactivés pour cet événement.
        </Alert>
      ) : (
        <CheckoutForm
          eventId={data.event.id}
          ticketTypes={ticketTypes}
          preselectedId={type}
          paymentProvider={env.payment.provider}
          initialBuyer={{
            name: profile.full_name?.trim() || profile.display_name,
            email: profile.email ?? "",
            phone: contact?.phone ?? "",
          }}
          inDialog={inDialog}
        />
      )}
    </div>
  );
}
