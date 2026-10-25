import { EditorialShell } from "@/components/layout/editorial/editorial-shell";

import shell from "@/components/layout/editorial/editorial-shell.module.css";

export const metadata = {
  title: "Gestion des cookies",
  description: "Information sur l'utilisation des témoins de connexion (cookies) sur Event.",
};

export default function CookiesPage() {
  return (
    <EditorialShell>
      <div className={shell.wrap}>
        <div className={shell.page} style={{ display: "grid", gap: 34, maxWidth: 900 }}>
          <header className={shell["page-head"]}>
            <p className={shell.eyebrow}>Informations relatives à votre navigation</p>
            <h1
              className={shell["page-title"]}
              style={{ fontSize: "clamp(30px, 4.4vw, 50px)" }}
            >
              Politique d&apos;utilisation des cookies
            </h1>
          </header>

          <div className={shell.prose}>
            <h2>1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
            <p>
              Un cookie est un petit fichier texte déposé sur votre appareil (smartphone, ordinateur)
              lors de la consultation de notre site. Il permet d&apos;assurer la persistance de
              votre session de connexion et de mémoriser vos préférences de thème.
            </p>

            <h2>2. Cookies essentiels</h2>
            <p>
              Ces cookies sont indispensables au fonctionnement du site (authentification Supabase,
              jetons de sécurité CSRF, préférences de mode sombre).
            </p>
          </div>
        </div>
      </div>
    </EditorialShell>
  );
}
