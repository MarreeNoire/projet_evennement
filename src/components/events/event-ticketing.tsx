import Link from "next/link";

import { ACCESS_LEVEL_LABELS, type AccessLevel } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import type { PublishedEventView, TicketTypeRow } from "@/types/database";

import styles from "@/components/editorial/editorial.module.css";
import shell from "@/components/layout/editorial/editorial-shell.module.css";

/* =============================================================================
   Billetterie (version éditoriale)
   --------------------------------------------------------------------------
   Chaque type de billet est un coupon : informations à gauche, perforation,
   prix et action à droite. Le salon communautaire reste un bandeau à filets.
   ========================================================================== */

function levelLabel(level: string) {
  return ACCESS_LEVEL_LABELS[level as AccessLevel] ?? level;
}

export function TicketPicker({
  ticketTypes,
  slug,
}: {
  ticketTypes: TicketTypeRow[];
  slug: string;
}) {
  const available = ticketTypes.filter(
    (type) => type.is_active && type.sold_count < type.quantity,
  );

  if (available.length === 0) {
    return (
      <section aria-labelledby="billetterie">
        <p className={shell.eyebrow}>Billetterie</p>
        <h2 id="billetterie" className={styles.asideTitle} style={{ marginTop: 10 }}>
          Choisir mes billets
        </h2>
        <p className={styles.asideNote} style={{ marginTop: 12 }}>
          La billetterie est complète ou momentanément indisponible pour cet événement.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="billetterie">
      <p className={shell.eyebrow}>Billetterie</p>
      <h2 id="billetterie" className={styles.asideTitle} style={{ marginTop: 10 }}>
        Choisir mes billets
      </h2>

      <ul className={styles.ticketList} style={{ marginTop: 16 }}>
        {available.map((type) => {
          const remaining = type.quantity - type.sold_count;
          const isPremium = type.access_level !== "standard";

          return (
            <li key={type.id} className={styles.ticket}>
              <div className={styles.ticketMain}>
                <p className={styles.ticketName}>
                  {type.name}
                  {isPremium ? (
                    <span
                      style={{
                        padding: "2px 6px",
                        border: "1px solid var(--accent)",
                        borderRadius: 2,
                        color: "var(--accent)",
                        fontSize: 8.5,
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                      }}
                    >
                      {levelLabel(type.access_level)}
                    </span>
                  ) : null}
                </p>
                {type.description ? (
                  <p className={styles.ticketDesc}>{type.description}</p>
                ) : null}
                {remaining <= 20 ? (
                  <p className={styles.ticketLow}>Plus que {remaining} places</p>
                ) : null}
              </div>

              <div className={styles.ticketStub}>
                <p className={styles.ticketPrice}>
                  {type.price <= 0 ? "Gratuit" : formatPrice(type.price)}
                </p>
                <Link
                  href={`/evenements/${slug}/billets?type=${type.id}`}
                  className={`${shell.btn} ${shell["btn-primary"]} ${shell["btn-sm"]} ${styles.ticketCta}`}
                >
                  Choisir
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      <p className={styles.asideNote} style={{ marginTop: 14 }}>
        Paiement sécurisé par mobile money (Wave, Orange, MTN, Moov) ou carte bancaire.
      </p>
    </section>
  );
}

export function SalonTeaser({
  slug,
  privacy,
}: {
  slug: string;
  privacy: PublishedEventView["salon_privacy"];
}) {
  const label =
    privacy === "public"
      ? "Salon public : tout le monde peut échanger."
      : privacy === "members"
        ? "Salon réservé aux participants munis d’un billet."
        : "Salon privé sur invitation.";

  return (
    <aside aria-labelledby="salon-titre" className={styles.salonBand}>
      <div>
        <p className={shell.eyebrow}>Avant, pendant, après</p>
        <h2 id="salon-titre">Le salon de l’événement</h2>
        <p>{label} Présente-toi, pose tes questions.</p>
      </div>
      <Link
        href={`/evenements/${slug}/salon`}
        className={`${shell.btn} ${shell["btn-outline"]} ${shell["btn-sm"]}`}
      >
        Découvrir le salon
      </Link>
    </aside>
  );
}
