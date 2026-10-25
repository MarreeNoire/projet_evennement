import Link from "next/link";
import { ArrowRight, QrCode, Smartphone, Ticket } from "lucide-react";

import { EditorialShell } from "@/components/layout/editorial/editorial-shell";

import content from "@/components/editorial/editorial.module.css";
import shell from "@/components/layout/editorial/editorial-shell.module.css";

export const metadata = {
  title: "Centre d’aide & FAQ",
  description: "Trouve toutes les réponses à tes questions sur la billetterie et les salons.",
};

const GUIDES = [
  {
    href: "/aide/paiement",
    icon: Ticket,
    title: "Billetterie & achat",
    text: "Comment acheter un billet, annuler ou recevoir ma facture.",
  },
  {
    href: "/aide/check-in",
    icon: QrCode,
    title: "Guide du check-in",
    text: "Comment faire scanner mon badge ou gérer les entrées organisateur.",
  },
  {
    href: "/aide/paiement",
    icon: Smartphone,
    title: "Moyens de paiement",
    text: "Payer avec Wave, Orange Money, MTN MoMo, Moov Money et Visa.",
  },
];

export default function AidePage() {
  return (
    <EditorialShell>
      <div className={shell.wrap}>
        <div className={shell.page} style={{ display: "grid", gap: 40 }}>
          <header className={`${shell["page-head"]} ${shell["page-head--split"]}`}>
            <div>
              <p className={shell.eyebrow}>Aide</p>
              <h1 className={shell["page-title"]} style={{ marginTop: 14 }}>
                Comment pouvons-nous <em>t’aider ?</em>
              </h1>
            </div>
            <p className={shell["page-lead"]}>
              Recherche dans nos guides et notre foire aux questions. Si une réponse manque,
              écris-nous : nous répondons depuis Abidjan.
            </p>
          </header>

          <div className={content.helpGrid}>
            {GUIDES.map((guide) => {
              const Icon = guide.icon;
              return (
                <Link key={`${guide.href}-${guide.title}`} href={guide.href} className={content.helpCard}>
                  <Icon className={shell.icon} aria-hidden="true" />
                  <h2>{guide.title}</h2>
                  <p>{guide.text}</p>
                  <span className={`${shell["link-arrow"]}`} style={{ marginTop: "auto" }}>
                    En savoir plus
                    <ArrowRight className={shell.icon} aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>

          <section className={content.ctaBand} aria-labelledby="aide-contact">
            <div>
              <p className={shell.eyebrow}>Une question précise ?</p>
              <h2 id="aide-contact">Écris-nous, on te répond.</h2>
            </div>
            <Link
              href="/contact"
              className={`${shell.btn} ${shell["btn-outline"]}`}
            >
              Nous contacter
            </Link>
          </section>
        </div>
      </div>
    </EditorialShell>
  );
}
