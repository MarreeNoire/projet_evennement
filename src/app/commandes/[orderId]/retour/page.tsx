import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Alert } from "@/components/ui/states";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { verifyAndConfirm } from "@/lib/orders/confirm-order";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Retour de paiement" };

/* Page de retour après paiement : revérifie côté serveur avant d'afficher. */

export default async function PaymentReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ statut?: string }>;
}) {
  const { orderId } = await params;
  const { statut } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?redirect=/commandes/${orderId}/retour`);

  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, reference, status, total, user_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.user_id !== user.id) redirect(ROUTES.myTickets);

  // Tente une réconciliation via la dernière transaction journalisée.
  const { data: payment } = await supabase
    .from("payments")
    .select("provider_transaction_id")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (payment && order.status === "pending") {
    await verifyAndConfirm(payment.provider_transaction_id).catch(() => null);
  }

  const { data: fresh } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();

  const status = fresh?.status ?? order.status;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex max-w-xl flex-col gap-6 py-12 text-center">
        {status === "paid" ? (
          <>
            <p className="eyebrow">Commande {order.reference}</p>
            <h1 className="font-display text-4xl leading-[1.02] font-semibold">Paiement confirmé.</h1>
            <Alert tone="success" title={`Commande ${order.reference} payée`}>
              Tes billets sont disponibles. Présente leur QR code à l'entrée.
            </Alert>
            <div className="flex justify-center gap-2">
              <ButtonLink href={ROUTES.myTickets}>Voir mes billets</ButtonLink>
              <ButtonLink href={`/evenements`} variant="secondary">
                Découvrir d'autres événements
              </ButtonLink>
            </div>
          </>
        ) : status === "failed" || statut === "refused" ? (
          <>
            <p className="eyebrow">Commande {order.reference}</p>
            <h1 className="font-display text-4xl leading-[1.02] font-semibold">Paiement refusé.</h1>
            <Alert tone="danger" title="La transaction n'a pas abouti">
              Aucun montant n'a été débité. Tu peux réessayer avec un autre moyen de paiement.
            </Alert>
            <div className="flex justify-center">
              <ButtonLink href={ROUTES.myTickets} variant="secondary">
                Voir mes commandes
              </ButtonLink>
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">Commande {order.reference}</p>
            <h1 className="font-display text-4xl leading-[1.02] font-semibold">Paiement en cours…</h1>
            <Alert tone="info" title="Confirmation en attente">
              {statut === "cancelled"
                ? "Tu as annulé le paiement. Ta commande reste en attente."
                : "Le prestataire traite encore ta transaction. Reviens dans quelques instants."}
            </Alert>
            <p className="text-sm text-fg-muted">
              Voir le statut dans <Link href={ROUTES.myTickets} className="text-primary hover:underline">mes billets</Link>.
            </p>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
