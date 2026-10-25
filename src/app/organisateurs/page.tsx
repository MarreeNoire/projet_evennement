import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";

import { EditorialShell } from "@/components/layout/editorial/editorial-shell";
import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { getPublicOrganizers, type PublicOrganizer } from "@/lib/events/queries";
import { formatDate, getInitials } from "@/lib/utils";

import content from "@/components/editorial/editorial.module.css";
import shell from "@/components/layout/editorial/editorial-shell.module.css";

export const metadata: Metadata = {
  title: "Organisateurs",
  description: "Les organisateurs qui publient des événements à venir sur la plateforme.",
};

/* =============================================================================
   Annuaire des organisateurs
   --------------------------------------------------------------------------
   Liste éditoriale (filets, pas de cartes) des organisateurs ayant au moins un
   événement à venir. Chaque ligne renvoie vers leur prochain événement.
   ========================================================================== */

export default async function OrganizersPage() {
  let organizers: PublicOrganizer[] = [];
  let loadError = false;

  try {
    organizers = await getPublicOrganizers();
  } catch {
    loadError = true;
  }

  return (
    <EditorialShell>
      <div className={shell.wrap}>
        <div className={shell.page} style={{ display: "grid", gap: 40 }}>
          <header className={`${shell["page-head"]} ${shell["page-head--split"]}`}>
            <div>
              <p className={shell.eyebrow}>Annuaire</p>
              <h1 className={shell["page-title"]} style={{ marginTop: 14 }}>
                Ceux qui <em>rassemblent.</em>
              </h1>
            </div>
            <p className={shell["page-lead"]}>
              Les organisateurs qui ont un événement à venir. Ouvre leur prochaine date, réserve ta
              place et rejoins le salon de l&apos;événement.
            </p>
          </header>

          {loadError ? (
            <div className={shell.empty}>
              <h2>Annuaire momentanément indisponible</h2>
              <p>La liste n&apos;a pas pu être chargée. Réessaie dans un instant.</p>
              <Link
                href="/explorer"
                className={`${shell.btn} ${shell["btn-outline"]} ${shell["btn-sm"]}`}
              >
                Aller à l&apos;explorer
              </Link>
            </div>
          ) : organizers.length === 0 ? (
            <div className={shell.empty}>
              <h2>Aucun organisateur pour le moment</h2>
              <p>Dès qu&apos;un événement est publié, son organisateur apparaît ici.</p>
              <Link
                href="/devenir-organisateur"
                className={`${shell.btn} ${shell["btn-primary"]} ${shell["btn-sm"]}`}
              >
                Devenir organisateur
              </Link>
            </div>
          ) : (
            <ul className={content.orgList}>
              {organizers.map((organizer) => (
                <li key={organizer.id} className={content.orgRow}>
                  <div className={content.orgMain}>
                    <span className={content.orgAvatar} aria-hidden="true">
                      {organizer.logoUrl ? (
                        <PublicStorageImage
                          src={organizer.logoUrl}
                          alt=""
                          width={108}
                          height={108}
                          sizes="54px"
                          quality={70}
                        />
                      ) : (
                        <span>{getInitials(organizer.name)}</span>
                      )}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <h2 className={content.orgName}>{organizer.name}</h2>
                      <p className={content.orgMeta}>
                        {organizer.eventCount} événement{organizer.eventCount > 1 ? "s" : ""} à
                        venir
                        {organizer.cities.length > 0 ? ` · ${organizer.cities.join(", ")}` : ""}
                      </p>
                      {organizer.verified ? (
                        <p className={content.orgVerified}>
                          <BadgeCheck
                            aria-hidden="true"
                            style={{ width: 12, height: 12, display: "inline", marginRight: 4 }}
                          />
                          Organisateur vérifié
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className={content.orgNext}>
                    <p className={content.orgNextLabel}>Prochain événement</p>
                    <p className={content.orgNextTitle}>{organizer.nextEvent.title}</p>
                    <p className={content.orgNextDate}>{formatDate(organizer.nextEvent.startAt)}</p>
                  </div>

                  <Link
                    href={`/evenements/${organizer.nextEvent.slug}`}
                    className={content.orgLink}
                    aria-label={`Voir l'événement ${organizer.nextEvent.title} de ${organizer.name}`}
                  >
                    Voir l&apos;événement →
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <section className={content.ctaBand} aria-labelledby="rejoindre">
            <div>
              <p className={shell.eyebrow}>Tu organises ?</p>
              <h2 id="rejoindre">Ajoute ton événement à cet annuaire.</h2>
            </div>
            <Link href="/devenir-organisateur" className={`${shell.btn} ${shell["btn-primary"]}`}>
              Devenir organisateur
              <ArrowRight className={shell.icon} aria-hidden="true" />
            </Link>
          </section>
        </div>
      </div>
    </EditorialShell>
  );
}
