import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, getApiUser, parseJson } from "@/lib/community-finance/api";
import { env } from "@/lib/env";
import { getPaymentProvider } from "@/lib/payments";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ amount: z.number().int().positive().max(10_000_000), anonymous: z.boolean().default(false) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getApiUser();
  if (!user) return apiError("Connecte-toi pour contribuer à cette collecte.", 401);
  const parsed = schema.safeParse(await parseJson(request));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Montant invalide.");
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data: campaign } = await admin.from("cotisation_campaigns").select("*").eq("id", id).maybeSingle();
  if (!campaign || campaign.status !== "open" || (campaign.ends_at && new Date(campaign.ends_at) <= new Date())) {
    return apiError("Cette collecte n’accepte plus de contributions.", 409);
  }
  if (campaign.fixed_amount && parsed.data.amount !== campaign.fixed_amount) {
    return apiError(`Le montant de cette collecte est fixé à ${campaign.fixed_amount.toLocaleString("fr-FR")} F CFA.`);
  }
  if (!campaign.fixed_amount && parsed.data.amount < 100) return apiError("Le montant minimum est de 100 F CFA.");

  const [{ data: profile }, { data: contribution, error: insertError }] = await Promise.all([
    admin.from("profiles").select("display_name, email, phone, country").eq("id", user.id).maybeSingle(),
    admin.from("cotisation_contributions").insert({
      campaign_id: id,
      contributor_id: user.id,
      amount: parsed.data.amount,
      currency: campaign.currency,
      is_anonymous: parsed.data.anonymous,
    }).select("*").single(),
  ]);
  if (insertError || !contribution) return apiError("La contribution n’a pas pu être préparée.", 500);

  try {
    const provider = getPaymentProvider();
    const origin = env.appUrl.replace(/\/$/, "");
    const checkout = await provider.createCheckout({
      orderId: contribution.id,
      orderReference: `COT-${contribution.id}`,
      amount: Number(contribution.amount),
      currency: contribution.currency,
      description: `Contribution - ${campaign.title}`,
      customer: {
        name: profile?.display_name,
        email: profile?.email ?? user.email ?? undefined,
        phone: profile?.phone ?? undefined,
        country: profile?.country ?? undefined,
      },
      returnUrl: `${origin}/cotisations/${id}?contribution=${contribution.id}`,
      notifyUrl: `${origin}/api/webhooks/geniuspay`,
      metadata: { contribution_id: contribution.id, campaign_id: campaign.id, contribution_reference: `COT-${contribution.id}` },
    });
    const { error: updateError } = await admin.from("cotisation_contributions").update({
      provider: checkout.provider,
      provider_transaction_id: checkout.transactionId,
      provider_payment_url: checkout.paymentUrl,
    }).eq("id", contribution.id);
    if (updateError) throw new Error("Impossible d’enregistrer la référence de paiement.");
    return NextResponse.json({ contributionId: contribution.id, checkoutUrl: checkout.paymentUrl }, { status: 201 });
  } catch (error) {
    await admin.from("cotisation_contributions").update({ status: "failed" }).eq("id", contribution.id);
    return apiError(error instanceof Error ? error.message : "Le paiement n’a pas pu démarrer.", 503);
  }
}
