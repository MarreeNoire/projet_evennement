import Link from "next/link";
import { ArrowLeft, CreditCard, Smartphone } from "lucide-react";

import { EditorialShell } from "@/components/layout/editorial/editorial-shell";

import content from "@/components/editorial/editorial.module.css";
import shell from "@/components/layout/editorial/editorial-shell.module.css";

export const metadata = {
  title: "Moyens de paiement",
  description:
    "Explications sur les paiements Mobile Money (Wave, Orange, MTN, Moov) et carte bancaire.",
};

const MOBILE_MONEY = ["Wave", "Orange Money", "MTN Mobile Money", "Moov Money"];

export default function GuidePaiementPage() {
  return (
    <EditorialShell>
      <div className={shell.wrap}>
        <div className={shell.page} style={{ display: "grid", gap: 34, maxWidth: 900 }}>
          <Link href="/aide" className={shell.crumb} style={{ paddingTop: 18 }}>
            <ArrowLeft aria-hidden="true" style={{ width: 14, height: 14 }} />
            Retour au centre d’aide
          </Link>

          <header className={shell["page-head"]}>
            <p className={shell.eyebrow}>Billetterie</p>
            <h1 className={shell["page-title"]}>
              Moyens de paiement <em>acceptés.</em>
            </h1>
            <p className={shell["page-lead"]}>
              Rassemble simplifie la billetterie en Côte d’Ivoire. Le checkout sécurisé propose les
              moyens de paiement activés sur le compte marchand.
            </p>
          </header>

          <div className={content.helpGrid}>
            <section className={content.helpCard} aria-labelledby="mobile-money">
              <Smartphone className={shell.icon} aria-hidden="true" />
              <h2 id="mobile-money">Mobile Money</h2>
              <ul style={{ display: "grid", gap: 6, margin: 0, paddingLeft: 18, listStyle: "disc" }}>
                {MOBILE_MONEY.map((method) => (
                  <li key={method} style={{ color: "var(--ink-2)", fontSize: 13.5 }}>
                    <strong>{method}</strong>
                  </li>
                ))}
              </ul>
            </section>

            <section className={content.helpCard} aria-labelledby="carte-bancaire">
              <CreditCard className={shell.icon} aria-hidden="true" />
              <h2 id="carte-bancaire">Carte bancaire</h2>
              <p>
                Paiement sécurisé Visa et Mastercard disponible pour les participants locaux et
                internationaux.
              </p>
            </section>
          </div>

          <section className={content.ctaBand} aria-labelledby="paiement-suite">
            <div>
              <p className={shell.eyebrow}>Besoin d’aide</p>
              <h2 id="paiement-suite">Un paiement bloqué ?</h2>
            </div>
            <Link href="/contact" className={`${shell.btn} ${shell["btn-outline"]}`}>
              Nous contacter
            </Link>
          </section>
        </div>
      </div>
    </EditorialShell>
  );
}
