import type { ReactNode } from "react";

import { APP_NAME } from "@/lib/constants";

import styles from "./auth-editorial.module.css";

/* =============================================================================
   Coque des écrans d'authentification
   --------------------------------------------------------------------------
   Composition éditoriale en deux colonnes : un panneau de marque à gauche,
   le formulaire à droite. Le visuel photographique a été retiré au profit
   du papier, des filets et de la typographie de l'accueil.
   ========================================================================== */

export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <main className={styles.screen}>
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.frame}>
        <aside className={styles.aside}>
          <div className={styles.asideTop}>
            <span className={styles.wordmark}>
              {APP_NAME}
              <span className={styles.dot}>.</span>
            </span>
            <p className={styles.edition}>Billetterie · Abidjan</p>
          </div>

          <div className={styles.asideBody}>
            <p className={styles.asideIndex}>Espace personnel</p>
            <p className={styles.statement}>
              La culture{" "}
              <br />
              se réserve{" "}
              <br />
              <em>ici.</em>
            </p>
            <p className={styles.asideNote}>
              Tes billets, tes salons et les rencontres qui vont avec.
            </p>
          </div>

          <div className={styles.asideFoot}>
            <span>{APP_NAME}</span>
            <span>Abidjan, Côte d’Ivoire</span>
          </div>
        </aside>

        <div className={styles.content}>{children}</div>
      </div>
    </main>
  );
}
