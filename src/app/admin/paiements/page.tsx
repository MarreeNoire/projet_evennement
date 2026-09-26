import { CircleDollarSign, Clock3, Wallet } from "lucide-react";

import { StatCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate, formatNumber, formatPrice } from "@/lib/utils";

export const metadata = {
  title: "Paiements et commissions | Administration | Event",
  description: "Commissions et reversements enregistrés sur la plateforme.",
};

interface CommissionRow {
  commission: number;
}

interface PayoutRow {
  id: string;
  net_amount: number;
  currency: string;
  status: string;
  method: string | null;
  reference: string | null;
  created_at: string;
}

function statusDetails(status: string) {
  if (status === "paid") return { label: "Versé", variant: "success" as const };
  if (status === "failed") return { label: "Échec", variant: "danger" as const };
  if (status === "cancelled") return { label: "Annulé", variant: "neutral" as const };
  if (status === "processing") return { label: "En cours", variant: "warning" as const };
  return { label: "En attente", variant: "warning" as const };
}

export default async function AdminPaiementsPage() {
  let commissions: CommissionRow[] = [];
  let payouts: PayoutRow[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const [commissionResult, payoutResult] = await Promise.all([
      supabase.from("event_stats").select("commission"),
      supabase
        .from("payouts")
        .select("id, net_amount, currency, status, method, reference, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    commissions = (commissionResult.data as CommissionRow[] | null) ?? [];
    payouts = (payoutResult.data as PayoutRow[] | null) ?? [];
  } catch {
    commissions = [];
    payouts = [];
  }

  const commissionTotal = commissions.reduce((sum, row) => sum + row.commission, 0);
  const pendingPayouts = payouts.filter((payout) => ["pending", "processing"].includes(payout.status));
  const pendingAmount = pendingPayouts.reduce((sum, payout) => sum + payout.net_amount, 0);

  return (
    <div className="space-y-8">
      <header className="border-b border-border-strong pb-5">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Paiements et commissions</h1>
        <p className="mt-2 text-sm text-fg-muted">Montants issus des commissions et reversements enregistrés.</p>
      </header>

      {commissions.length === 0 && payouts.length === 0 ? (
        <EmptyState
          icon={<Wallet />}
          title="Aucune donnée de paiement"
          description="Les commissions et reversements enregistrés apparaîtront ici."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label="Commissions enregistrées"
              value={formatPrice(commissionTotal)}
              hint={`${formatNumber(commissions.length)} événement${commissions.length > 1 ? "s" : ""} avec données`}
              icon={<CircleDollarSign className="size-5" />}
            />
            <StatCard
              label="Reversements en attente"
              value={formatPrice(pendingAmount)}
              hint={`${formatNumber(pendingPayouts.length)} demande${pendingPayouts.length > 1 ? "s" : ""}`}
              icon={<Clock3 className="size-5" />}
            />
          </div>

          <section className="overflow-hidden border border-border bg-surface" aria-labelledby="payouts-title">
            <div className="border-b border-border-strong px-5 py-4">
              <h2 id="payouts-title" className="font-display text-lg font-bold">Reversements récents</h2>
            </div>
            {payouts.length === 0 ? (
              <p className="px-5 py-8 text-sm text-fg-muted">Aucun reversement enregistré.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[35rem] text-left text-sm">
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
                      const status = statusDetails(payout.status);
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
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
