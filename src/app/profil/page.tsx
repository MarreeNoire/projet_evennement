import { redirect } from "next/navigation";

import { ProfilePhoneForm } from "@/components/auth/profile-phone-form";
import { ProfileAvatarForm } from "@/components/social/profile-avatar-form";
import { ProfileDetailsForm } from "@/components/social/profile-details-form";
import { Stamp } from "@/components/social/stamp";
import { SocialPageHeader, SocialShell } from "@/components/social/social-shell";
import { EmptyState } from "@/components/ui/states";
import { ROUTES } from "@/lib/constants";
import { dayMonth } from "@/lib/social/time";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";

export const metadata = { title: "Mon profil" };

export default async function MonProfilPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`${ROUTES.login}?redirect=${ROUTES.profile}`);

  const supabase = await createSupabaseServerClient();
  const [{ data: pastTickets }, { data: contact }] = await Promise.all([
    supabase
      .from("my_tickets")
      .select("event_title, event_start_at")
      .lt("event_end_at", new Date().toISOString())
      .order("event_start_at", { ascending: false })
      .limit(12),
    supabase.from("profile_contacts").select("phone").eq("user_id", profile.id).maybeSingle(),
  ]);

  return (
    <SocialShell active="profil">
      <div className="flex flex-col gap-12">
        <SocialPageHeader eyebrow="Mon profil" title="Carte" accent="d'identité." />

        <section className="border-border grid gap-6 border-y py-8 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <ProfileAvatarForm
            userId={profile.id}
            displayName={profile.display_name}
            initialAvatarUrl={profile.avatar_url}
          />
          <div>
            <h2 className="font-display text-3xl font-semibold">{profile.display_name}</h2>
            {profile.username ? (
              <p className="text-fg-subtle text-sm">@{profile.username}</p>
            ) : null}
            <p className="text-primary mt-2 text-sm font-semibold">
              {profile.roles.includes("organizer") ? "Organisateur" : "Participant"}
              {profile.is_verified ? " · Vérifié" : ""}
            </p>
            {profile.bio ? (
              <p className="text-fg-muted mt-2 max-w-xl text-sm">{profile.bio}</p>
            ) : null}
          </div>
        </section>

        <ProfilePhoneForm initialPhone={contact?.phone ?? ""} />

        <section aria-labelledby="tampons" className="flex flex-col gap-5">
          <div>
            <p className="eyebrow">Vécus</p>
            <h2 id="tampons" className="font-display mt-1 text-2xl font-semibold">
              Événements tamponnés
            </h2>
          </div>

          {pastTickets?.length ? (
            <ul className="flex flex-wrap gap-6">
              {pastTickets.map((ticket, index) => (
                <li key={`${ticket.event_title}-${index}`}>
                  <Stamp title={ticket.event_title} date={dayMonth(ticket.event_start_at).year} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Aucun tampon encore"
              description="Chaque événement terminé auquel tu as participé laisse un tampon ici."
            />
          )}
        </section>

        <section
          aria-labelledby="editer"
          className="border-border flex flex-col gap-5 border-t pt-8"
        >
          <div>
            <p className="eyebrow">Modifier</p>
            <h2 id="editer" className="font-display mt-1 text-2xl font-semibold">
              Informations visibles par les autres
            </h2>
          </div>
          <ProfileDetailsForm
            displayName={profile.display_name}
            username={profile.username}
            city={profile.city}
            bio={profile.bio}
          />
        </section>
      </div>
    </SocialShell>
  );
}
