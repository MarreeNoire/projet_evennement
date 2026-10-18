import Link from "next/link";
import { redirect } from "next/navigation";
import { QrCode, WifiOff } from "lucide-react";

import { ConnectionActions } from "@/components/social/connection-actions";
import { ConnectionsRetryButton } from "@/components/social/connections-retry-button";
import { ConnectionContactShareControl } from "@/components/social/connection-contact-share-control";
import { SocialPageHeader, SocialShell } from "@/components/social/social-shell";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { ROUTES } from "@/lib/constants";
import { getMyConnections, type ConnectionEntry } from "@/lib/connections/queries";
import { formatRelative } from "@/lib/social/time";
import { getCurrentProfile } from "@/lib/supabase/server";

export const metadata = {
  title: "Mon réseau",
  description: "Les personnes rencontrées pendant tes événements.",
};

/* =============================================================================
   Réseau — un carnet de cartes de visite
   --------------------------------------------------------------------------
   Chaque connexion est une carte de visite qui garde la mémoire de l'endroit
   où vous vous êtes rencontrés : un événement, un badge scanné, un salon.
   ========================================================================== */

const ORIGIN_LABELS: Record<string, string> = {
  profile: "Depuis son profil",
  badge_scan: "Badge scanné",
  suggestion: "Suggestion",
  salon: "Rencontré dans un salon",
};

function meetingLabel(entry: ConnectionEntry): string {
  if (entry.eventTitle) return `Rencontré à ${entry.eventTitle}`;
  return ORIGIN_LABELS[entry.origin] ?? "Connexion";
}

export default async function ConnexionsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`${ROUTES.login}?redirect=${ROUTES.connections}`);

  const all = await getMyConnections(profile.id);
  const loadFailed = all === null;
  const entries = all ?? [];
  const network = entries.filter((entry) => entry.status === "accepted");
  const received = entries.filter(
    (entry) => entry.status === "pending" && entry.direction === "incoming",
  );
  const sent = entries.filter(
    (entry) => entry.status === "pending" && entry.direction === "outgoing",
  );

  return (
    <SocialShell active="reseau">
      <div className="flex flex-col gap-12">
        <SocialPageHeader
          eyebrow="Mon réseau"
          title="Ceux que tu as"
          accent="rencontrés."
          description="Scanne le badge d'un autre participant ou écris-lui depuis un salon : la carte de visite s'ajoute ici, avec le souvenir de la rencontre."
          action={
            <ButtonLink href={ROUTES.myBadge} variant="secondary">
              <QrCode className="mr-2 size-4" aria-hidden="true" />
              Mon badge
            </ButtonLink>
          }
        />

        {loadFailed ? (
          <section
            role="alert"
            className="border-border bg-surface-raised flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <WifiOff className="text-fg-muted mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">Ton réseau est momentanément indisponible</h2>
                <p className="text-fg-muted mt-1 text-sm">
                  Les connexions n’ont pas pu être chargées. Réessaie dans un instant.
                </p>
              </div>
            </div>
            <ConnectionsRetryButton />
          </section>
        ) : (
          <>
            {received.length > 0 ? (
              <section aria-labelledby="recues" className="flex flex-col gap-4">
                <div className="border-border border-t pt-4">
                  <p className="eyebrow">À traiter</p>
                  <h2 id="recues" className="font-display mt-2 text-2xl font-semibold">
                    Demandes reçues
                  </h2>
                </div>
                <ul className="flex flex-col">
                  {received.map((entry) => (
                    <li
                      key={entry.id}
                      className="border-border flex flex-col gap-4 border-b py-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <PersonLine entry={entry} />
                      <ConnectionActions connectionId={entry.id} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section aria-labelledby="carnet" className="flex flex-col gap-5">
              <div className="border-border border-t pt-4">
                <p className="eyebrow">Carnet</p>
                <h2 id="carnet" className="font-display mt-2 text-2xl font-semibold">
                  Cartes de visite{network.length > 0 ? ` (${network.length})` : ""}
                </h2>
              </div>

              {network.length === 0 ? (
                <EmptyState
                  title="Ton carnet est vide"
                  description="Ta première carte de visite arrive à ton prochain événement : montre ton badge, scanne celui d'un autre participant."
                  action={<ButtonLink href={ROUTES.explore}>Trouver un événement</ButtonLink>}
                />
              ) : (
                <ul className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                  {network.map((entry) => (
                    <li key={entry.id}>
                      <BusinessCard entry={entry} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {sent.length > 0 ? (
              <section aria-labelledby="envoyees" className="flex flex-col gap-4">
                <div className="border-border border-t pt-4">
                  <p className="eyebrow">En attente</p>
                  <h2 id="envoyees" className="font-display mt-2 text-2xl font-semibold">
                    Demandes envoyées
                  </h2>
                </div>
                <ul className="flex flex-col">
                  {sent.map((entry) => (
                    <li key={entry.id} className="border-border border-b py-4">
                      <PersonLine entry={entry} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </div>
    </SocialShell>
  );
}

function PersonLine({ entry }: { entry: ConnectionEntry }) {
  const name = entry.person?.display_name ?? "Participant";
  return (
    <div className="flex min-w-0 items-center gap-4">
      <Avatar src={entry.person?.avatar_url} name={name} size="md" />
      <div className="min-w-0">
        {entry.person ? (
          <Link
            href={`/profil/${entry.person.id}`}
            className="hover:text-primary font-semibold hover:underline"
          >
            {name}
          </Link>
        ) : (
          <span className="font-semibold">{name}</span>
        )}
        <p className="text-fg-muted truncate text-sm">
          {meetingLabel(entry)} · {formatRelative(entry.createdAt)}
        </p>
        {entry.message ? (
          <p className="text-fg-muted mt-1 line-clamp-2 text-sm italic">« {entry.message} »</p>
        ) : null}
      </div>
    </div>
  );
}

/* Carte de visite : filet d'encre en haut, nom en serif, souvenir de la rencontre au pied. */
function BusinessCard({ entry }: { entry: ConnectionEntry }) {
  const name = entry.person?.display_name ?? "Participant";

  return (
    <div className="border-border border-t-fg bg-surface-raised flex h-full flex-col justify-between gap-6 rounded-lg border border-t-4 p-5">
      <div className="flex items-start gap-4">
        <Avatar src={entry.person?.avatar_url} name={name} size="lg" />
        <div className="min-w-0">
          {entry.person ? (
            <Link
              href={`/profil/${entry.person.id}`}
              className="font-display hover:text-primary block truncate text-xl leading-tight font-semibold"
            >
              {name}
              {entry.person.is_verified ? (
                <span className="text-success ml-1.5 text-sm font-semibold" title="Profil vérifié">
                  ✓
                </span>
              ) : null}
            </Link>
          ) : (
            <span className="font-display text-xl font-semibold">{name}</span>
          )}
          <p className="text-fg-muted text-sm">{entry.person?.city ?? "Côte d'Ivoire"}</p>
        </div>
      </div>

      <p className="border-border-strong text-fg-subtle border-t border-dashed pt-3 text-xs">
        {meetingLabel(entry)}
      </p>
      <div className="border-border border-t pt-3">
        {entry.sharedPhone ? (
          <a
            href={`tel:${entry.sharedPhone}`}
            className="text-primary inline-flex min-h-10 items-center text-sm font-semibold hover:underline"
          >
            {entry.sharedPhone}
          </a>
        ) : (
          <p className="text-fg-subtle py-2 text-sm">Numéro non partagé avec toi</p>
        )}
        <ConnectionContactShareControl
          connectionId={entry.id}
          initialSharing={entry.isSharingPhone}
          canShare={entry.canSharePhone}
        />
      </div>
    </div>
  );
}
