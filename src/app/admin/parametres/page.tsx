import { AdminSettingsForm } from "@/components/admin/admin-settings-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Paramètres Plateforme | Super Admin | Event",
  description: "Configuration générale des règles métier et taux de commission.",
};

export default async function AdminParametresPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("platform_settings").select("value").eq("key", "platform.commission_rate").maybeSingle();
  const rawRate = data?.value;
  const initialCommissionPercent = typeof rawRate === "number" && rawRate >= 0 && rawRate <= 1 ? rawRate * 100 : 5;
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Paramètres de la Plateforme</h1>
        <p className="text-sm text-fg-muted">
          Règles financières globales et configurations système.
        </p>
      </div>

      <AdminSettingsForm initialCommissionPercent={initialCommissionPercent} />
    </div>
  );
}
