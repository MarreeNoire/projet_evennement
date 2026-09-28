"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Ban, CircleCheck, CircleX } from "lucide-react";

import { Alert } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

/* Page de simulation de paiement (mode mock uniquement, jamais en production). */

export function MockPayWidget({
  orderId,
  orderReference,
  total,
  transactionId,
}: {
  orderId: string;
  orderReference: string;
  total: number;
  transactionId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function decide(decision: "accepted" | "refused" | "cancelled") {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/payments/mock/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderId, transactionId, decision }),
        });
        const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
        if (!response.ok || !body?.ok) {
          setError(body?.error ?? "Confirmation impossible. Réessaie.");
          return;
        }
        if (decision === "accepted") {
          router.push("/mes-billets");
        } else {
          router.push(`/commandes/${orderId}/retour?statut=${decision}`);
        }
        router.refresh();
      } catch {
        setError("La demande a échoué. Vérifie ta connexion puis réessaie.");
      }
    });
  }

  return (
    <Card className="border-warning/30">
      <CardHeader>
        <CardTitle>Simulation de paiement (mode démo)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Alert tone="warning" title="Aucun argent ne circule">
          Commande {orderReference} · {formatPrice(total)} · transaction {transactionId}.
          Choisis l’issue pour tester le parcours complet.
        </Alert>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => decide("accepted")} loading={pending} loadingLabel="Confirmation…">
            <CircleCheck className="mr-2 size-4" aria-hidden="true" /> Simuler un paiement accepté
          </Button>
          <Button type="button" variant="secondary" onClick={() => decide("refused")} disabled={pending}>
            <CircleX className="mr-2 size-4" aria-hidden="true" /> Simuler un refus
          </Button>
          <Button type="button" variant="ghost" onClick={() => decide("cancelled")} disabled={pending}>
            <Ban className="mr-2 size-4" aria-hidden="true" />
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
