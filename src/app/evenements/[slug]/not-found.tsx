import Link from "next/link";

import { EditorialShell } from "@/components/layout/editorial/editorial-shell";

import shell from "@/components/layout/editorial/editorial-shell.module.css";

/* 404 événement : retour guidé vers l'explorer. */

export default function EventNotFound() {
  return (
    <EditorialShell>
      <div
        className={shell.wrap}
        style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 18, paddingBlock: "clamp(48px, 8vw, 96px)" }}
      >
        <p className={shell.eyebrow}>Erreur 404</p>
        <h1 className={shell["page-title"]}>
          Événement <em>introuvable.</em>
        </h1>
        <p className={shell["page-lead"]}>
          Cet événement n’existe pas, n’est plus publié ou le lien est incorrect.
        </p>
        <Link
          href="/explorer"
          className={`${shell.btn} ${shell["btn-primary"]}`}
          style={{ marginTop: 8 }}
        >
          Explorer les événements
        </Link>
      </div>
    </EditorialShell>
  );
}
