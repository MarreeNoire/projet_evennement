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
  searchParams: Promise<{ tx?: string; montant?: string; type?: string; campaign?: string }>;
}) {
  if (env.isProduction || env.payment.provider !== "mock") {
    redirect("/");
  }

  const { orderId } = await params;
  const { tx, montant, type, campaign } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?redirect=/paiement/simulation/${orderId}`);

  const supabase = await createSupabaseServerClient();
  const isContribution = type === "contribution";
  const { data: contribution } = isContribution
    ? await supabase.from("cotisation_contributions")
        .select("id, amount, status, contributor_id, provider_transaction_id")
        .eq("id", orderId).eq("contributor_id", user.id).maybeSingle()
    : { data: null };
  const { data: order } = !isContribution
    ? await supabase.from("orders").select("id, reference, status, total, user_id").eq("id", orderId).maybeSingle()
    : { data: null };

  if (isContribution) {
    if (!contribution || contribution.provider_transaction_id !== tx || !campaign) notFound();
    if (contribution.status === "paid") redirect(`/cotisations/${campaign}?contribution=${contribution.id}`);
  } else {
    if (!order || order.user_id !== user.id) notFound();
    if (order.status === "paid") redirect("/mes-billets");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex max-w-2xl flex-col gap-6 py-10">
        <div>
          <h1 className="font-display text-2xl font-bold">Paiement de {formatPrice(isContribution ? Number(contribution?.amount ?? 0) : order?.total ?? 0)}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {isContribution ? "Contribution" : `Commande ${order?.reference}`}, montant {montant ? formatPrice(Number(montant)) : formatPrice(isContribution ? Number(contribution?.amount ?? 0) : order?.total ?? 0)}.
          </p>
        </div>
        {!tx ? (
          <Alert tone="danger" title="Lien de paiement invalide">
            Transaction manquante. Reprends ta commande depuis l&apos;événement.
          </Alert>
        ) : (
          <MockPayWidget
            orderId={isContribution ? contribution!.id : order!.id}
            orderReference={isContribution ? `COT-${contribution!.id}` : order!.reference}
            total={isContribution ? Number(contribution!.amount) : order!.total}
            transactionId={tx}
            returnPath={isContribution ? `/cotisations/${campaign}?contribution=${contribution!.id}` : undefined}
          />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
