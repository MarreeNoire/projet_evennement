import Link from "next/link";
import { ArrowRight, BarChart3, MessageSquare, QrCode, Ticket } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";

const highlights = [
  {
    icon: Ticket,
    title: "Billetterie et Mobile Money",
    description: "Types de billets, quotas, codes promo et paiements Wave, Orange, MTN ou Moov.",
  },
  {
    icon: MessageSquare,
    title: "Salon communautaire",
    description:
      "Un espace pour échanger avec tes participants avant, pendant et après l’événement.",
  },
  {
    icon: QrCode,
    title: "Contrôle d’accès",
    description: "Valide les billets à l’entrée en scannant les QR codes sur smartphone.",
  },
  {
    icon: BarChart3,
    title: "Suivi des ventes",
    description:
      "Consulte les revenus, le remplissage et les participants depuis ton tableau de bord.",
  },
];

export function OrganizerCtaSection() {
  return (
    <section
      aria-labelledby="organizer-section-title"
      className="border-border bg-bg-subtle border-b py-8 md:py-11"
    >
      <div className="container-page grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12">
        <div className="home-scroll-reveal max-w-2xl">
          <h2
            id="organizer-section-title"
            className="font-display max-w-xl text-xl leading-tight font-bold md:text-2xl lg:text-3xl"
          >
            Donne vie à tes événements et rassemble ta communauté
          </h2>
          <p className="text-fg-muted mt-2.5 max-w-xl text-sm leading-relaxed md:mt-3 md:text-base">
            Publie ton événement, vends tes billets et garde le lien avec les participants depuis un
            seul espace.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 md:mt-5">
            <ButtonLink href="/devenir-organisateur" size="lg">
              Devenir organisateur
              <ArrowRight className="ml-1 size-4" aria-hidden="true" />
            </ButtonLink>
            <Link
              href="/devenir-organisateur#formules"
              className="text-fg-muted hover:text-primary decoration-border-strong text-sm font-semibold underline underline-offset-4 transition-colors"
            >
              Voir les offres et tarifs
            </Link>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-x-4 sm:gap-x-8">
          {highlights.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="organizer-highlight border-border flex gap-2 border-t py-3 sm:gap-3 sm:py-3.5"
            >
              <Icon
                className="organizer-highlight-icon text-primary mt-0.5 size-4 shrink-0 sm:size-[18px]"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <h3 className="text-fg text-xs leading-snug font-semibold sm:text-sm">{title}</h3>
                <p className="text-fg-muted mt-1 text-xs leading-snug">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
