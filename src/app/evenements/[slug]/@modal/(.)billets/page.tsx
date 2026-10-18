import { CheckoutDialog } from "@/components/checkout/checkout-dialog";
import { CheckoutPanel } from "@/components/checkout/checkout-panel";

export default async function CheckoutModalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const [{ slug }, { type }] = await Promise.all([params, searchParams]);

  return (
    <CheckoutDialog slug={slug}>
      <CheckoutPanel slug={slug} type={typeof type === "string" ? type : undefined} inDialog />
    </CheckoutDialog>
  );
}
