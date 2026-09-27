import QRCode from "react-qr-code";
import { Ticket, Users } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { SocialPageHeader, SocialShell } from "@/components/social/social-shell";
import { ROUTES } from "@/lib/constants";
import { env } from "@/lib/env";
import { getProfileBadgeUrl, getRequestOrigin } from "@/lib/social/badge-url";
import { getCurrentProfile } from "@/lib/supabase/server";

export const metadata = {
  title: "Mon badge",
  description: "Ton badge de participant : montre-le pour échanger tes coordonnées.",
};

/* =============================================================================
   Mon badge — badge de conférence, pas une carte bancaire
   --------------------------------------------------------------------------
   Fente d'attache en haut (cordon), perforation, QR code de mise en réseau au
   pied. Aucun dégradé : un aplat d'encre et un filet, comme les autres objets
   « imprimés » de l'application.
   ========================================================================== */

export default async function MonBadgePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`${ROUTES.login}?redirect=${ROUTES.myBadge}`);

  const displayName = profile.display_name;
  const requestHeaders = await headers();
  const appOrigin = getRequestOrigin(requestHeaders, env.appUrl, env.isProduction);
  const badgeUrl = getProfileBadgeUrl(profile.id, appOrigin, env.supabase.serviceRoleKey);

  return (
    <SocialShell active="badge">
      <div className="flex flex-col gap-10">
        <SocialPageHeader
          eyebrow="Réseau"
          title="Mon"
          accent="badge."
          description="Montre ce badge à un autre participant : il scanne le QR code et vous êtes connectés."
        />

        <div className="mx-auto w-full max-w-xs">
          <div className="relative">
            {/* Fente d'attache du cordon */}
            <div
              aria-hidden="true"
              className="border-border bg-bg absolute inset-x-0 -top-3 z-10 mx-auto flex h-6 w-20 items-center justify-center rounded-full border-2"
            >
              <span className="bg-fg h-1.5 w-10 rounded-full" />
            </div>

            <div className="border-border bg-surface-raised overflow-hidden rounded-lg border-2 pt-6">
              <div className="flex flex-col items-center gap-3 px-6 pb-6">
                <Avatar src={profile?.avatar_url} name={displayName} size="xl" />
                <div className="text-center">
                  <p className="font-display text-2xl leading-tight font-semibold">{displayName}</p>
                  <p className="eyebrow text-primary mt-1">
                    {profile?.roles.includes("organizer") ? "Organisateur" : "Participant"}
                  </p>
                </div>
                {profile?.city ? <p className="text-fg-muted text-sm">{profile.city}</p> : null}
              </div>

              {/* Perforation */}
              <div className="border-border-strong relative h-0 border-t-2 border-dashed">
                <span className="bg-bg absolute -top-3 -left-3 size-6 rounded-full" />
                <span className="bg-bg absolute -top-3 -right-3 size-6 rounded-full" />
              </div>

              <div className="bg-bg-subtle flex flex-col items-center gap-3 px-6 py-6">
                <div className="border-border-strong rounded-md border bg-white p-3">
                  <QRCode value={badgeUrl} size={160} aria-label="QR code de mise en réseau" />
                </div>
                <p className="text-fg-subtle text-center text-xs">
                  Scanne pour ajouter {displayName.split(" ")[0]} à ton réseau.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-border flex flex-col items-center gap-3 border-t pt-6 sm:flex-row sm:justify-center sm:gap-6">
          <ButtonLink href={ROUTES.myTickets} variant="secondary">
            <Ticket className="mr-2 size-4" aria-hidden="true" />
            Mes billets
          </ButtonLink>
          <ButtonLink href={ROUTES.connections} variant="secondary">
            <Users className="mr-2 size-4" aria-hidden="true" />
            Mon réseau
          </ButtonLink>
        </div>
      </div>
    </SocialShell>
  );
}
