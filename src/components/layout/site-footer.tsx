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
    <footer className="border-fg bg-bg-subtle mt-auto border-t-2">
      <div className="container-page py-6 md:py-12">
        <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:gap-9 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div className="col-span-2 flex flex-col gap-2 sm:col-span-1 sm:gap-4">
            <div className="flex items-center justify-between gap-3">
              <Logo />
              <Link
                href="/explorer"
                className="text-primary inline-flex shrink-0 items-center gap-2 text-sm font-semibold hover:underline"
              >
                Parcourir les événements
              </Link>
            </div>
            <p className="text-fg-muted max-w-xs text-sm leading-relaxed">
              Découvre un événement, participe, et rencontre sa communauté avant, pendant et après.
            </p>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <nav key={section.title} aria-labelledby={`footer-${section.title}`}>
              <h2
                id={`footer-${section.title}`}
                className="text-fg mb-2 text-xs font-bold tracking-[0.12em] uppercase sm:mb-3"
              >
                {section.title}
              </h2>
              <ul className="flex flex-col gap-1.5 sm:gap-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-fg-muted hover:text-primary text-sm underline-offset-4 transition-colors hover:underline"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-border-strong text-fg-subtle mt-6 flex flex-col gap-1.5 border-t pt-4 text-xs sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-5">
          <p>
            © {year} {APP_NAME}. Tous droits réservés.
          </p>
          <p>Montants en {CURRENCY_LABEL} · Abidjan, Côte d&apos;Ivoire</p>
        </div>
      </div>
    </footer>
  );
}
