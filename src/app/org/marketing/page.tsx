import { OrgMarketingManager } from "@/components/events/org-marketing-manager";
import { getOrganizerEvents } from "@/lib/events/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Marketing & Promos | Event",
  description: "Création de codes de réduction et campagnes d'annonces.",
};

export default async function OrgMarketingPage() {
  const events = await getOrganizerEvents();
  const organizationIds = [...new Set(events.map((event) => event.organization_id))];
  const supabase = await createSupabaseServerClient();
  const { data } = organizationIds.length
    ? await supabase.from("promo_codes").select("id, code, discount_value, discount_kind, used_count, max_uses, is_active").in("organization_id", organizationIds).order("created_at", { ascending: false })
    : { data: [] };
  return <OrgMarketingManager events={events.map(({ id, title }) => ({ id, title }))} initialPromos={(data ?? []).map((promo) => ({ id: promo.id, code: promo.code, discountValue: promo.discount_value, discountKind: promo.discount_kind, usedCount: promo.used_count, maxUses: promo.max_uses, isActive: promo.is_active }))} />;
}
