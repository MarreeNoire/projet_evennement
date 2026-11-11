import { CheckoutDialog } from "@/components/checkout/checkout-dialog";
import { CheckoutPanel } from "@/components/checkout/checkout-panel";
import { getPublishedEventBySlug } from "@/lib/events/queries";

export default async function CheckoutModalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const [{ slug }, { type }] = await Promise.all([params, searchParams]);
  const event = await getPublishedEventBySlug(slug).catch(() => null);

  return (
    <CheckoutDialog eventTitle={event?.event.title}>
      <CheckoutPanel slug={slug} type={typeof type === "string" ? type : undefined} inDialog />
    </CheckoutDialog>
  );
}
