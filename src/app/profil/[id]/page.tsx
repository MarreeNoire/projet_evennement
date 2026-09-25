import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { RequestConnectionButton } from "@/components/social/request-connection-button";
import { Avatar } from "@/components/ui/avatar";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";

export const metadata = { title: "Profil" };

/* =============================================================================
   Profil public — la même page d'identité que « Mon profil », sans édition
   ========================================================================== */

export default async function ProfilPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: profile }, currentUser] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    getCurrentUser(),
  ]);

  if (!profile) notFound();

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex flex-col gap-8 py-10">
        <section className="grid gap-6 border-y border-border py-8 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
          <Avatar src={profile.avatar_url} name={profile.display_name} size="xl" />

          <div>
            <h1 className="font-display text-3xl font-semibold">{profile.display_name}</h1>
            {profile.city ? (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-fg-muted">
                <MapPin className="size-3.5" aria-hidden="true" />
                {profile.city}
              </p>
            ) : null}
            <p className="mt-2 text-sm font-semibold text-primary">
              Participant{profile.is_verified ? " · Vérifié" : ""}
            </p>
            {profile.bio ? <p className="mt-3 max-w-xl text-sm text-fg-muted">{profile.bio}</p> : null}
          </div>

          {!isOwnProfile && currentUser && profile.allow_connections ? (
            <RequestConnectionButton profileId={profile.id} />
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
                  className="rounded-sm border border-border-strong px-2.5 py-1 text-xs font-medium text-fg-muted"
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
