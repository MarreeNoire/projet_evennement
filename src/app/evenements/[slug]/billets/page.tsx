import type { Metadata } from "next";
import { CheckoutPanel } from "@/components/checkout/checkout-panel";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

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

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex flex-col gap-6 py-8">
        <CheckoutPanel slug={slug} type={typeof type === "string" ? type : undefined} />
      </main>
      <SiteFooter />
    </div>
  );
}
