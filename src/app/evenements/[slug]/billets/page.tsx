import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Alert } from "@/components/ui/states";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublishedEventBySlug } from "@/lib/events/queries";

export const metadata: Metadata = { title: "Commander des billets" };

/* Page de commande : quantités + coordonnées (connexion requise). */

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { slug } = await params;
  const { type } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?redirect=/evenements/${slug}/billets`);

  const data = await getPublishedEventBySlug(slug).catch(() => null);
  if (!data) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: full } = await supabase
    .from("events")
    .select("id")
    .eq("id", data.event.id)
    .maybeSingle();
  if (!full) notFound();

  const ticketTypes = data.ticketTypes.filter((t) => t.is_active);
  const preselected = typeof type === "string" ? type : undefined;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex flex-col gap-6 py-8">
        <nav aria-label="Fil d'Ariane" className="text-sm text-fg-muted">
          <Link href={`/evenements/${slug}`} className="hover:text-fg hover:underline">
            {data.event.title}
          </Link>
          {" / "}
          <span aria-current="page" className="text-fg">
            Commander
          </span>
        </nav>

        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Commander des billets</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {data.event.title}. Consulte les moyens de paiement proposés avant de confirmer.
          </p>
        </div>

        {ticketTypes.length === 0 ? (
          <Alert tone="warning" title="Billetterie indisponible">
            Tous les tarifs sont épuisés ou désactivés pour cet événement.
          </Alert>
        ) : (
          <CheckoutForm
            eventId={data.event.id}
            ticketTypes={ticketTypes}
            preselectedId={preselected}
          />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
