import type { Metadata } from "next";

import { CheckoutPanel } from "@/components/checkout/checkout-panel";
import { EditorialShell } from "@/components/layout/editorial/editorial-shell";
import shell from "@/components/layout/editorial/editorial-shell.module.css";

export const metadata: Metadata = { title: "Commander des billets" };

/* Page de commande : quantités + coordonnées + paiement (connexion requise).

   Elle vit dans le shell éditorial public, comme la fiche de l'événement :
   même en-tête, même pied, même papier. Le tunnel n'est plus une bulle
   applicative avec sa propre navigation. */

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { slug } = await params;
  const { type } = await searchParams;

  return (
    <EditorialShell hideBottomNav>
      <div className={`${shell.wrap} ${shell.page}`}>
        <CheckoutPanel slug={slug} type={typeof type === "string" ? type : undefined} />
      </div>
    </EditorialShell>
  );
}
