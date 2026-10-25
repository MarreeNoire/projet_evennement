import Link from "next/link";

import type { HeaderUser } from "@/components/layout/header-types";
import { APP_NAME, ROUTES } from "@/lib/constants";

import styles from "./editorial-shell.module.css";

/* =============================================================================
   Pied de page éditorial public
   --------------------------------------------------------------------------
   Bande encre, quatre colonnes, filets fins. Les liens de compte remplacent
   « Connexion » dès qu'une session est active.
   ========================================================================== */

function cx(...names: Array<string | false | null | undefined>) {
  return names
    .filter(Boolean)
    .map((name) => styles[name as string])
    .join(" ");
}

export function EditorialFooter({ viewer }: { viewer: HeaderUser | null }) {
  const year = new Date().getFullYear();

  return (
    <footer className={cx("site-foot")}>
      <div className={cx("wrap")}>
        <div className={cx("foot-grid")}>
          <div className={cx("foot-brand")}>
            <Link href="/" className={cx("brand")} aria-label={`${APP_NAME} — Accueil`}>
              <span className={cx("brand-mark")} aria-hidden="true">
                e
              </span>
              <span className={cx("brand-word")}>event</span>
              <span className={cx("brand-dot")} aria-hidden="true" />
            </Link>
            <p>
              La plateforme événementielle de Côte d&apos;Ivoire. Découvrir une sortie, réserver sa
              place et rester en lien avec les personnes rencontrées.
            </p>
          </div>

          <div className={cx("foot-col")}>
            <h3>Découvrir</h3>
            <Link href={ROUTES.explore}>Tous les événements</Link>
            <Link href="/organisateurs">Organisateurs</Link>
            <Link href="/aide">Centre d&apos;aide</Link>
            <Link href="/devenir-organisateur">Devenir organisateur</Link>
          </div>

          <div className={cx("foot-col")}>
            <h3>Organiser</h3>
            <Link href="/devenir-organisateur">Publier un événement</Link>
            <Link href={ROUTES.orgDashboard}>Espace organisateur</Link>
            <Link href="/aide/paiement">Billetterie</Link>
            <Link href="/contact">Nous contacter</Link>
          </div>

          <div className={cx("foot-col")}>
            <h3>Informations</h3>
            {viewer ? (
              <>
                <Link href={ROUTES.profile}>Mon profil</Link>
                <Link href={ROUTES.myTickets}>Mes billets</Link>
                <Link href={ROUTES.settings}>Réglages</Link>
              </>
            ) : (
              <>
                <Link href={ROUTES.login}>Connexion</Link>
                <Link href={ROUTES.register}>Créer un compte</Link>
              </>
            )}
            <Link href="/cgu">Conditions</Link>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/mentions-legales">Mentions légales</Link>
          </div>
        </div>

        <div className={cx("foot-bottom")}>
          <p>
            © {year} {APP_NAME} — Abidjan, Côte d&apos;Ivoire
          </p>
          <p className={cx("foot-note")}>
            Les événements affichés proviennent des fiches publiées par leurs organisateurs.
          </p>
          <a href="#haut">Retour en haut</a>
        </div>
      </div>
    </footer>
  );
}
