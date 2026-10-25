import { EditorialShell } from "@/components/layout/editorial/editorial-shell";

import shell from "@/components/layout/editorial/editorial-shell.module.css";

export const metadata = {
  title: "Mentions légales",
  description: "Informations légales concernant l'éditeur et l'hébergeur de Event.",
};

export default function MentionsLegalesPage() {
  return (
    <EditorialShell>
      <div className={shell.wrap}>
        <div className={shell.page} style={{ display: "grid", gap: 34, maxWidth: 900 }}>
          <header className={shell["page-head"]}>
            <p className={shell.eyebrow}>Informations réglementaires</p>
            <h1
              className={shell["page-title"]}
              style={{ fontSize: "clamp(30px, 4.4vw, 50px)" }}
            >
              Mentions légales
            </h1>
          </header>

          <div className={shell.prose}>
            <h2>Éditeur du site</h2>
            <p>
              Plateforme <strong>Event</strong>
              <br />
              Société de technologie événementielle
              <br />
              Abidjan, Côte d&apos;Ivoire
              <br />
              E-mail : contact@rassemble.ci
            </p>

            <h2>Hébergement</h2>
            <p>Hébergé sur infrastructure Cloud Supabase et Vercel Inc.</p>
          </div>
        </div>
      </div>
    </EditorialShell>
  );
}
