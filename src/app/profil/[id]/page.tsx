import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";

import { RequestConnectionButton } from "@/components/social/request-connection-button";
import { ButtonLink } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Avatar } from "@/components/ui/avatar";
import { env, isSupabaseAdminConfigured } from "@/lib/env";
import { verifyBadgeSignature } from "@/lib/social/badge-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";

export const metadata = { title: "Profil" };

/* =============================================================================
   Profil public — la même page d'identité que « Mon profil », sans édition
   ========================================================================== */

export default async function ProfilPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ badge?: string }>;
}) {
  const { id } = await params;
  const { badge } = await searchParams;
  const isBadgeScan = Boolean(
    badge &&
    env.supabase.serviceRoleKey &&
    verifyBadgeSignature(id, badge, env.supabase.serviceRoleKey),
  );
  const supabase = await createSupabaseServerClient();

  const [profileResult, currentUser] = await Promise.all([
    isBadgeScan && isSupabaseAdminConfigured
      ? createSupabaseAdminClient()
          .from("profiles")
          .select(
            "id, display_name, avatar_url, city, bio, is_verified, interests, allow_connections",
          )
          .eq("id", id)
          .maybeSingle()
      : supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    getCurrentUser(),
  ]);
  const profile = profileResult.data;

  if (!profile) notFound();

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex flex-col gap-8 py-10">
        <section className="border-border grid gap-6 border-y py-8 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
          <Avatar src={profile.avatar_url} name={profile.display_name} size="xl" />

          <div>
            <h1 className="font-display text-3xl font-semibold">{profile.display_name}</h1>
            {profile.city ? (
              <p className="text-fg-muted mt-1 flex items-center gap-1.5 text-sm">
                <MapPin className="size-3.5" aria-hidden="true" />
                {profile.city}
              </p>
            ) : null}
            <p className="text-primary mt-2 text-sm font-semibold">
              Participant{profile.is_verified ? " · Vérifié" : ""}
            </p>
            {profile.bio ? (
              <p className="text-fg-muted mt-3 max-w-xl text-sm">{profile.bio}</p>
            ) : null}
          </div>

          {!isOwnProfile && profile.allow_connections ? (
            currentUser ? (
              <RequestConnectionButton profileId={profile.id} />
            ) : isBadgeScan ? (
              <ButtonLink
                href={`/connexion?redirect=${encodeURIComponent(`/profil/${id}?badge=${badge}`)}`}
              >
                Connecte-toi pour ajouter ce participant
              </ButtonLink>
            ) : null
          ) : null}
        </section>

        {profile.interests && profile.interests.length > 0 ? (
          <section aria-labelledby="centres-interet">
            <p className="eyebrow" id="centres-interet">
              Centres d&apos;intérêt
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {profile.interests.map((interest: string) => (
                <li
                  key={interest}
                  className="border-border-strong text-fg-muted rounded-sm border px-2.5 py-1 text-xs font-medium"
                >
                  {interest}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
