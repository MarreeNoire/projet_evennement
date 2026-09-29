import { notFound, redirect } from "next/navigation";

import { joinSalon } from "@/lib/salons/actions";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";

export default async function EventSalonRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/connexion?redirect=${encodeURIComponent(`/evenements/${slug}/salon`)}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  let eventId = event?.id;
  if (!eventId) {
    // L'événement peut être terminé et donc caché par la RLS aux non-organisateurs.
    // Le propriétaire d'un billet conserve l'accès au salon après l'événement.
    const { data: ticket } = await supabase
      .from("my_tickets")
      .select("event_id")
      .eq("event_slug", slug)
      .in("status", ["paid", "used"])
      .limit(1)
      .maybeSingle();
    eventId = ticket?.event_id;
  }
  if (!eventId) notFound();

  // La policy salons_select n'expose le salon aux participants qu'avec un
  // billet valide (et au niveau requis); l'organisation conserve son accès.
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();

  if (!salon) redirect(`/evenements/${slug}?salon=billet-requis`);

  // Répare aussi les billets existants dont l'adhésion automatique n'aurait
  // pas été créée, sans contourner l'autorisation RLS de joinSalon.
  const membership = await joinSalon(salon.id);
  if (!membership.success) redirect(`/evenements/${slug}?salon=billet-requis`);

  redirect(`/salons/${salon.id}`);
}
