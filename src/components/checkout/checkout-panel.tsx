import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Alert } from "@/components/ui/states";
import { getPublishedEventBySlug } from "@/lib/events/queries";
import { env } from "@/lib/env";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";

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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {!inDialog ? (
        <nav aria-label="Fil d'Ariane" className="text-fg-muted text-sm">
          <Link href={`/evenements/${slug}`} className="hover:text-fg hover:underline">
            {data.event.title}
          </Link>
          {" / "}
          <span aria-current="page" className="text-fg">
            Commander
          </span>
        </nav>
      ) : (
        <p className="text-fg-muted border-b border-border pb-4 text-sm">
          Billets pour <span className="text-fg font-semibold">{data.event.title}</span>
        </p>
      )}

      {!inDialog ? (
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Commander des billets</h1>
          <p className="text-fg-muted mt-1 text-sm">
            {data.event.title}. Consulte les moyens de paiement proposés avant de confirmer.
          </p>
        </div>
      ) : null}

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
        />
      )}
    </div>
  );
}
