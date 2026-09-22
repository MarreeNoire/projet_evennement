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
    <footer className="mt-auto border-t border-border bg-bg-subtle">
      <div className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-fg-muted">
              Découvre un événement, participe, et rencontre sa communauté avant, pendant et après.
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-fg">Moyens de paiement</span>
              <ul className="flex flex-wrap gap-1.5">
                {["Wave", "Orange Money", "MTN MoMo", "Moov", "Visa", "Mastercard"].map((method) => (
                  <li
                    key={method}
                    className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg-muted"
                  >
                    {method}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <nav key={section.title} aria-labelledby={`footer-${section.title}`}>
              <h2
                id={`footer-${section.title}`}
                className="mb-3 font-display text-sm font-semibold text-fg"
              >
                {section.title}
              </h2>
              <ul className="flex flex-col gap-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
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