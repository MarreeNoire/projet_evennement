import { CircleDollarSign, ReceiptText, Wallet } from "lucide-react";

import { StatCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { getOrganizerEvents } from "@/lib/events/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate, formatNumber, formatPrice } from "@/lib/utils";

export const metadata = {
  title: "Paiements et reversements | Event",
  description: "Revenus et reversements enregistrés pour vos événements.",
};

interface EventPaymentStats {
  gross_revenue: number;
  commission: number;
  net_revenue: number;
}

interface PayoutRecord {
  id: string;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  currency: string;
  status: string;
  method: string | null;
  reference: string | null;
  created_at: string;
}

function payoutStatus(status: string) {
  if (status === "paid") return { label: "Versé", variant: "success" as const };
  if (status === "failed") return { label: "Échec", variant: "danger" as const };
  if (status === "cancelled") return { label: "Annulé", variant: "neutral" as const };
  if (status === "processing") return { label: "En cours", variant: "warning" as const };
  return { label: "En attente", variant: "warning" as const };
}

export default async function OrgPaiementsPage() {
  const events = await getOrganizerEvents();
  const organizationIds = [...new Set(events.map((event) => event.organization_id))];
  let stats: EventPaymentStats[] = [];
  let payouts: PayoutRecord[] = [];

  if (organizationIds.length > 0) {
    try {
      const supabase = await createSupabaseServerClient();
      const [statsResult, payoutResult] = await Promise.all([
        supabase
          .from("event_stats")
          .select("gross_revenue, commission, net_revenue")
          .in("event_id", events.map((event) => event.id)),
        supabase
          .from("payouts")
          .select("id, gross_amount, commission_amount, net_amount, currency, status, method, reference, created_at")
          .in("organization_id", organizationIds)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      stats = (statsResult.data as EventPaymentStats[] | null) ?? [];
      payouts = (payoutResult.data as PayoutRecord[] | null) ?? [];
    } catch {
      stats = [];
      payouts = [];
    }
  }

  const grossRevenue = stats.reduce((sum, row) => sum + row.gross_revenue, 0);
  const commissions = stats.reduce((sum, row) => sum + row.commission, 0);
  const paidOut = payouts
    .filter((payout) => payout.status === "paid")
    .reduce((sum, payout) => sum + payout.net_amount, 0);
  const hasData = stats.length > 0 || payouts.length > 0;

  return (
    <div className="space-y-8">
      <header className="border-b border-border-strong pb-5">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Paiements et reversements</h1>
        <p className="mt-2 text-sm text-fg-muted">Montants calculés à partir des ventes et reversements enregistrés.</p>
      </header>

      {!hasData ? (
        <EmptyState
          icon={<ReceiptText />}
          title="Aucune donnée de paiement"
          description="Les ventes et les reversements apparaîtront ici lorsqu’ils auront été enregistrés pour vos événements."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Revenus bruts" value={formatPrice(grossRevenue)} icon={<CircleDollarSign className="size-5" />} />
            <StatCard label="Commissions enregistrées" value={formatPrice(commissions)} icon={<ReceiptText className="size-5" />} />
            <StatCard label="Reversements effectués" value={formatPrice(paidOut)} icon={<Wallet className="size-5" />} />
          </div>

          <section className="overflow-hidden border border-border bg-surface" aria-labelledby="payouts-title">
            <div className="border-b border-border-strong px-5 py-4">
              <h2 id="payouts-title" className="font-display text-lg font-bold">Historique des reversements</h2>
            </div>
            {payouts.length === 0 ? (
              <p className="px-5 py-8 text-sm text-fg-muted">Aucun reversement enregistré.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[38rem] text-left text-sm">
                  <thead className="bg-bg-muted text-xs font-semibold text-fg-muted uppercase">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Référence</th>
                      <th className="px-5 py-3">Moyen</th>
                      <th className="px-5 py-3">Montant net</th>
                      <th className="px-5 py-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payouts.map((payout) => {
                      const status = payoutStatus(payout.status);
                      return (
                        <tr key={payout.id}>
                          <td className="px-5 py-3 text-fg-muted">{formatDate(payout.created_at)}</td>
                          <td className="px-5 py-3">{payout.reference || "Non renseignée"}</td>
                          <td className="px-5 py-3">{payout.method || "Non renseigné"}</td>
                          <td className="px-5 py-3 font-semibold tabular-nums">{formatPrice(payout.net_amount)}</td>
                          <td className="px-5 py-3"><Badge variant={status.variant}>{status.label}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="border-t border-border px-5 py-3 text-xs text-fg-subtle">
                  {formatNumber(payouts.length)} reversement{payouts.length > 1 ? "s" : ""} récent{payouts.length > 1 ? "s" : ""}
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
