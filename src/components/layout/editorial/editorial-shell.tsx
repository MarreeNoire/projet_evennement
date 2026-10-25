import { loadHeaderUser } from "@/lib/auth/viewer";

import { EditorialFooter } from "./editorial-footer";
import { EditorialHeader } from "./editorial-header";
import { EDITORIAL_NAV, type EditorialNavItem } from "./editorial-nav";
import styles from "./editorial-shell.module.css";

/* =============================================================================
   Shell éditorial
   --------------------------------------------------------------------------
   Deux usages :

   - `EditorialShell` : parcours public complet (en-tête, contenu, pied).
   - `EditorialScope` : même langage visuel (papier, encre, jetons remappés)
     sans en-tête ni pied, pour les espaces qui gardent leur propre chrome
     applicatif — espace membre, /org, /admin, tunnel d'achat.

   Le visiteur est lu côté serveur : l'en-tête affiche le compte dès le premier
   rendu, sans clignotement « Connexion ».
   ========================================================================== */

export async function EditorialShell({
  children,
  nav,
  menuId,
}: {
  children: React.ReactNode;
  nav?: EditorialNavItem[];
  menuId?: string;
}) {
  const viewer = await loadHeaderUser();

  return (
    <div className={styles.editorial}>
      <div className={styles.grain} aria-hidden="true" />
      <EditorialHeader viewer={viewer} nav={nav ?? EDITORIAL_NAV} menuId={menuId} />
      <main className={styles.main}>{children}</main>
      <EditorialFooter viewer={viewer} />
    </div>
  );
}

export function EditorialScope({ children }: { children: React.ReactNode }) {
  return <div className={styles.editorial}>{children}</div>;
}
