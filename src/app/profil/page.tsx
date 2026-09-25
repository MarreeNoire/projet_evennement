import { redirect } from "next/navigation";
import { Save } from "lucide-react";

import { Stamp } from "@/components/social/stamp";
import { SocialPageHeader, SocialShell } from "@/components/social/social-shell";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/states";
import { dayMonth } from "@/lib/social/time";
import { ROUTES } from "@/lib/constants";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";

export const metadata = { title: "Mon profil" };

/* =============================================================================
   Mon profil — un passeport
   --------------------------------------------------------------------------
   L'identité en haut (comme la page d'identité d'un passeport), les tampons
   des événements vécus en dessous, le formulaire d'édition tout en bas.
   ========================================================================== */

export default async function MonProfilPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`${ROUTES.login}?redirect=${ROUTES.profile}`);

  const supabase = await createSupabaseServerClient();
  const { data: pastTickets } = await supabase
    .from("my_tickets")
    .select("event_title, event_start_at")
    .lt("event_end_at", new Date().toISOString())
    .order("event_start_at", { ascending: false })
    .limit(12);

  const stamps = pastTickets ?? [];

  return (
    <SocialShell active="profil">
      <div className="flex flex-col gap-12">
        <SocialPageHeader eyebrow="Mon profil" title="Carte" accent="d'identité." />

        {/* Page d'identité */}
        <section className="grid gap-6 border-y border-border py-8 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <Avatar src={profile.avatar_url} name={profile.display_name} size="xl" />
          <div>
            <h2 className="font-display text-3xl font-semibold">{profile.display_name}</h2>
            {profile.username ? <p className="text-sm text-fg-subtle">@{profile.username}</p> : null}
            <p className="mt-2 text-sm font-semibold text-primary">
              {profile.roles.includes("organizer") ? "Organisateur" : "Participant"}
              {profile.is_verified ? " · Vérifié" : ""}
            </p>
            {profile.bio ? <p className="mt-2 max-w-xl text-sm text-fg-muted">{profile.bio}</p> : null}
          </div>
        </section>

        {/* Tampons */}
        <section aria-labelledby="tampons" className="flex flex-col gap-5">
          <div>
            <p className="eyebrow">Vécus</p>
            <h2 id="tampons" className="mt-1 font-display text-2xl font-semibold">
              Événements tamponnés
            </h2>
          </div>

          {stamps.length === 0 ? (
            <EmptyState
              title="Aucun tampon encore"
              description="Chaque événement terminé auquel tu as participé laisse un tampon ici."
            />
          ) : (
            <ul className="flex flex-wrap gap-6">
              {stamps.map((ticket, index) => (
                <li key={`${ticket.event_title}-${index}`}>
                  <Stamp title={ticket.event_title} date={dayMonth(ticket.event_start_at).year} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Édition */}
        <section aria-labelledby="editer" className="flex flex-col gap-5 border-t border-border pt-8">
          <div>
            <p className="eyebrow">Modifier</p>
            <h2 id="editer" className="mt-1 font-display text-2xl font-semibold">
              Informations visibles par les autres
            </h2>
          </div>

          <form className="grid max-w-xl gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold">Nom d&apos;affichage</span>
                <input
                  type="text"
                  name="display_name"
                  defaultValue={profile.display_name}
                  className="h-11 rounded-md border border-border-strong bg-surface px-3 text-sm focus:border-border-focus focus:ring-1 focus:ring-border-focus focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold">Nom d&apos;utilisateur</span>
                <input
                  type="text"
                  name="username"
                  defaultValue={profile.username ?? ""}
                  placeholder="nom_utilisateur"
                  className="h-11 rounded-md border border-border-strong bg-surface px-3 text-sm focus:border-border-focus focus:ring-1 focus:ring-border-focus focus:outline-none"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold">Ville</span>
              <input
                type="text"
                name="city"
                defaultValue={profile.city ?? ""}
                placeholder="Abidjan"
                className="h-11 rounded-md border border-border-strong bg-surface px-3 text-sm focus:border-border-focus focus:ring-1 focus:ring-border-focus focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold">Biographie</span>
              <textarea
                name="bio"
                rows={3}
                defaultValue={profile.bio ?? ""}
                placeholder="Passionné d'événements et de rencontres à Abidjan…"
                className="resize-none rounded-md border border-border-strong bg-surface px-3 py-2 text-sm focus:border-border-focus focus:ring-1 focus:ring-border-focus focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled
              title="L'enregistrement arrive bientôt"
              className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-primary-solid px-5 text-sm font-semibold text-primary-solid-fg opacity-60"
            >
              <Save className="size-4" aria-hidden="true" />
              Enregistrer
            </button>
          </form>
        </section>
      </div>
    </SocialShell>
  );
}
