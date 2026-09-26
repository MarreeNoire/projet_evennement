import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { APP_NAME, CURRENCY_LABEL } from "@/lib/constants";
import { FOOTER_SECTIONS } from "./nav-config";

/* =============================================================================
   Pied de page
   --------------------------------------------------------------------------
   Rappel du positionnement produit et des moyens de paiement acceptés :
   l'information rassure autant qu'elle informe (marché ivoirien, mobile money).
   ========================================================================== */

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t-2 border-fg bg-bg-subtle">
      <div className="container-page py-10 md:py-12">
        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-fg-muted">
              Découvre un événement, participe, et rencontre sa communauté avant, pendant et après.
            </p>
            <Link href="/explorer" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Parcourir les événements
            </Link>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <nav key={section.title} aria-labelledby={`footer-${section.title}`}>
              <h2
                id={`footer-${section.title}`}
                className="mb-3 text-xs font-bold tracking-[0.12em] text-fg uppercase"
              >
                {section.title}
              </h2>
              <ul className="flex flex-col gap-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-fg-muted underline-offset-4 transition-colors hover:text-primary hover:underline"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border-strong pt-5 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {APP_NAME}. Tous droits réservés.
          </p>
          <p>
            Montants en {CURRENCY_LABEL} · Abidjan, Côte d&apos;Ivoire
          </p>
        </div>
      </div>

    </footer>
  );
}
