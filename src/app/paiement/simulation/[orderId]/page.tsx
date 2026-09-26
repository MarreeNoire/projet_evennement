import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { MockPayWidget } from "@/components/checkout/mock-pay-widget";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Alert } from "@/components/ui/states";
import { env } from "@/lib/env";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Paiement" };

/* Page de simulation de paiement (mock) : /paiement/simulation/[orderId]?tx=&montant= */

export default async function MockPayPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ tx?: string; montant?: string }>;
}) {
  if (env.isProduction || env.payment.provider !== "mock") {
    redirect("/");
  }

  const { orderId } = await params;
  const { tx, montant } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?redirect=/paiement/simulation/${orderId}`);

  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, reference, status, total, user_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.user_id !== user.id) notFound();
  if (order.status === "paid") redirect("/mes-billets");

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex max-w-2xl flex-col gap-6 py-10">
        <div>
          <h1 className="font-display text-2xl font-bold">Paiement de {formatPrice(order.total)}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Commande {order.reference}, montant {montant ? formatPrice(Number(montant)) : formatPrice(order.total)}.
          </p>
        </div>
        {!tx ? (
          <Alert tone="danger" title="Lien de paiement invalide">
            Transaction manquante. Reprends ta commande depuis l'événement.
          </Alert>
        ) : (
          <MockPayWidget
            orderId={order.id}
            orderReference={order.reference}
            total={order.total}
            transactionId={tx}
          />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
