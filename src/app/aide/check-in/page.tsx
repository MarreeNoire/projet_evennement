import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { EditorialShell } from "@/components/layout/editorial/editorial-shell";

import content from "@/components/editorial/editorial.module.css";
import shell from "@/components/layout/editorial/editorial-shell.module.css";

export const metadata = {
  title: "Guide du check-in & contrôle d’accès",
  description: "Guide complet d’utilisation du scanner de billets pour agents et organisateurs.",
};

const STEPS = [
  {
    title: "Utilisation du scanner QR",
    text: "Depuis votre smartphone ou tablette, connectez-vous avec votre compte organisateur et ouvrez la page /org/check-in. Autorisez l’accès à l’appareil photo pour scanner le QR Code affiché sur l’écran du participant ou imprimé sur son billet.",
  },
  {
    title: "Vérification des niveaux d’accès (VIP / VVIP)",
    text: "Lors du scan, l’écran affiche le badge avec le code couleur correspondant (Standard, VIP, VVIP). Vérifiez la concordance du nom si une pièce d’identité est exigée par l’organisateur.",
  },
];

export default function GuideCheckInPage() {
  return (
    <EditorialShell>
      <div className={shell.wrap}>
        <div className={shell.page} style={{ display: "grid", gap: 34, maxWidth: 900 }}>
          <Link href="/aide" className={shell.crumb} style={{ paddingTop: 18 }}>
            <ArrowLeft aria-hidden="true" style={{ width: 14, height: 14 }} />
            Retour au centre d’aide
          </Link>

          <header className={shell["page-head"]}>
            <p className={shell.eyebrow}>Accueil des participants</p>
            <h1 className={shell["page-title"]}>
              Guide du check-in <em>à l’entrée.</em>
            </h1>
            <p className={shell["page-lead"]}>
              Consignes d’utilisation de l’application web de contrôle d’accès pour les
              organisateurs d’événements et leurs agents de sécurité.
            </p>
          </header>

          <ol className={content.helpList}>
            {STEPS.map((step, index) => (
              <li key={step.title} className={content.helpItem}>
                <span className={content.helpStep}>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <section className={content.ctaBand} aria-labelledby="checkin-suite">
            <div>
              <p className={shell.eyebrow}>Sur place</p>
              <h2 id="checkin-suite">Ouvre la console de check-in.</h2>
            </div>
            <Link href="/org/check-in" className={`${shell.btn} ${shell["btn-outline"]}`}>
              Aller au check-in
            </Link>
          </section>
        </div>
      </div>
    </EditorialShell>
  );
}
