import Link from "next/link";
import { ArrowRight } from "lucide-react";

/* =============================================================================
   ModulesSection — Section de présentation des trois modules principaux
   de la plateforme : Événements, Tontines, Cotisations.
   ============================================================================ */

interface Module {
  id: string;
  label: string;
  tagline: string;
  description: string;
  href: string;
  cta: string;
  /** Classe Tailwind pour l'accent coloré de fond de la section */
  accentClass: string;
  /** Classe pour la couleur du badge/tag */
  tagClass: string;
  /** Classe pour la couleur du bouton CTA */
  ctaClass: string;
  artwork: React.ReactNode;
}

const MODULES: Module[] = [
  {
    id: "evenements",
    label: "Événements",
    tagline: "Organise & Participe",
    description:
      "Crée tes événements, vends des billets en ligne et gère tes participants. Découvre les prochains rendez-vous à Abidjan et en Côte d'Ivoire.",
    href: "/explorer",
    cta: "Explorer les événements",
    accentClass: "bg-primary/5 border-primary/15",
    tagClass: "bg-primary/10 text-primary",
    ctaClass:
      "bg-primary-solid text-primary-solid-fg hover:bg-primary-solid-hover",
    artwork: <EventArtwork />,
  },
  {
    id: "tontines",
    label: "Tontines",
    tagline: "Épargne communautaire",
    description:
      "Rejoins ou crée une tontine avec tes proches, collègues ou membres d'une association. Suivis des tours, historique des versements et rappels automatiques.",
    href: "/tontines",
    cta: "Accéder aux tontines",
    accentClass: "bg-accent/5 border-accent/15",
    tagClass: "bg-accent-subtle text-accent-subtle-fg",
    ctaClass: "bg-accent-solid text-accent-solid-fg hover:brightness-95",
    artwork: <TontineArtwork />,
  },
  {
    id: "cotisations",
    label: "Cotisations",
    tagline: "Collectes & financements",
    description:
      "Gère les cotisations de ton groupe, association ou équipe. Collecte en Mobile Money (Wave, Orange Money, MTN), génère des reçus et suis les paiements en temps réel.",
    href: "/cotisations",
    cta: "Gérer les cotisations",
    accentClass: "bg-success/5 border-success/15",
    tagClass: "bg-success/10 text-success",
    ctaClass: "bg-success text-white hover:bg-success/90",
    artwork: <CotisationArtwork />,
  },
];

export function ModulesSection() {
  return (
    <section
      aria-labelledby="modules-title"
      className="border-border border-b bg-bg-subtle"
    >
      <div className="container-page py-10 md:py-14">
        {/* En-tête de section */}
        <div className="mb-8 md:mb-10">
          <p className="text-primary eyebrow mb-1 text-xs font-bold tracking-widest uppercase">
            Plateforme tout-en-un
          </p>
          <h2
            id="modules-title"
            className="font-display text-2xl font-bold md:text-3xl"
          >
            Trois modules, une seule application
          </h2>
          <p className="text-fg-muted mt-2 max-w-2xl text-sm leading-relaxed">
            Événements, tontines et cotisations — tout ce dont tu as besoin pour
            organiser, épargner et collecter dans ta communauté.
          </p>
        </div>

        {/* Grille des modules */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((mod) => (
            <ModuleCard key={mod.id} module={mod} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ModuleCard({ module: mod }: { module: Module }) {
  return (
    <div
      className={`flex flex-col rounded-xl border p-5 transition-shadow hover:shadow-md ${mod.accentClass}`}
    >
      {/* Tag */}
      <div className="mb-4 flex items-center justify-between">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${mod.tagClass}`}
        >
          {mod.tagline}
        </span>
      </div>

      {/* Illustration */}
      <div className="mb-5 flex h-32 items-center justify-center">
        {mod.artwork}
      </div>

      {/* Texte */}
      <div className="flex flex-1 flex-col gap-2">
        <h3 className="font-display text-lg font-bold">{mod.label}</h3>
        <p className="text-fg-muted flex-1 text-sm leading-relaxed">
          {mod.description}
        </p>
      </div>

      {/* CTA */}
      <Link
        href={mod.href}
        className={`mt-5 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${mod.ctaClass}`}
      >
        {mod.cta}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

/* ── Illustrations SVG inline ──────────────────────────────────────────────── */

function EventArtwork() {
  return (
    <svg
      viewBox="0 0 160 112"
      className="h-full w-auto"
      fill="none"
      aria-hidden="true"
    >
      {/* Fond podium */}
      <rect x="10" y="72" width="140" height="28" rx="4" fill="var(--primary-subtle)" />
      {/* Billet principal */}
      <rect x="22" y="24" width="116" height="58" rx="6" fill="var(--primary-solid)" />
      {/* Perforation */}
      <line x1="106" y1="24" x2="106" y2="82" stroke="var(--primary-solid-fg)" strokeOpacity=".4" strokeDasharray="3 5" strokeWidth="1.5" />
      {/* Cercles de découpe */}
      <circle cx="106" cy="24" r="5" fill="var(--bg-subtle)" />
      <circle cx="106" cy="82" r="5" fill="var(--bg-subtle)" />
      {/* Texte simulé sur le billet */}
      <rect x="32" y="36" width="60" height="6" rx="3" fill="var(--primary-solid-fg)" fillOpacity=".7" />
      <rect x="32" y="48" width="44" height="4" rx="2" fill="var(--primary-solid-fg)" fillOpacity=".4" />
      <rect x="32" y="58" width="52" height="4" rx="2" fill="var(--primary-solid-fg)" fillOpacity=".4" />
      {/* QR code stylisé */}
      <rect x="112" y="34" width="16" height="16" rx="2" fill="var(--primary-solid-fg)" fillOpacity=".15" />
      <rect x="114" y="36" width="5" height="5" rx="1" fill="var(--primary-solid-fg)" fillOpacity=".5" />
      <rect x="121" y="36" width="5" height="5" rx="1" fill="var(--primary-solid-fg)" fillOpacity=".5" />
      <rect x="114" y="43" width="5" height="5" rx="1" fill="var(--primary-solid-fg)" fillOpacity=".5" />
      {/* Étiquette prix */}
      <rect x="112" y="56" width="18" height="10" rx="3" fill="var(--accent-solid)" />
      <rect x="116" y="59" width="10" height="4" rx="1.5" fill="white" fillOpacity=".8" />
    </svg>
  );
}

function TontineArtwork() {
  return (
    <svg
      viewBox="0 0 160 112"
      className="h-full w-auto"
      fill="none"
      aria-hidden="true"
    >
      {/* Cercle central (roue de la tontine) */}
      <circle cx="80" cy="56" r="38" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="80" cy="56" r="26" fill="var(--accent)" fillOpacity=".12" />
      {/* Avatars des membres autour du cercle */}
      {/* Haut */}
      <circle cx="80" cy="16" r="10" fill="var(--accent)" fillOpacity=".25" />
      <circle cx="80" cy="16" r="10" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="80" y="20" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--accent-solid-fg)">A</text>
      {/* Droite */}
      <circle cx="120" cy="56" r="10" fill="var(--accent)" fillOpacity=".25" />
      <circle cx="120" cy="56" r="10" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="120" y="60" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--accent-solid-fg)">B</text>
      {/* Bas */}
      <circle cx="80" cy="96" r="10" fill="var(--accent)" fillOpacity=".25" />
      <circle cx="80" cy="96" r="10" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="80" y="100" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--accent-solid-fg)">C</text>
      {/* Gauche */}
      <circle cx="40" cy="56" r="10" fill="var(--accent)" fillOpacity=".25" />
      <circle cx="40" cy="56" r="10" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="40" y="60" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--accent-solid-fg)">D</text>
      {/* Centre : pile de pièces */}
      <ellipse cx="80" cy="60" rx="14" ry="5" fill="var(--accent)" fillOpacity=".4" />
      <ellipse cx="80" cy="56" rx="14" ry="5" fill="var(--accent)" fillOpacity=".6" />
      <ellipse cx="80" cy="52" rx="14" ry="5" fill="var(--accent)" />
      <text x="80" y="55.5" textAnchor="middle" fontSize="7" fontWeight="800" fill="white">XOF</text>
      {/* Flèches de circulation */}
      <path d="M80 26 L80 30" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M110 56 L106 56" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M80 82 L80 86" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M50 56 L54 56" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CotisationArtwork() {
  return (
    <svg
      viewBox="0 0 160 112"
      className="h-full w-auto"
      fill="none"
      aria-hidden="true"
    >
      {/* Fond carte */}
      <rect x="14" y="20" width="132" height="72" rx="8" fill="var(--success)" fillOpacity=".1" stroke="var(--success)" strokeWidth="1.5" />
      {/* Barre de progression collecte */}
      <rect x="24" y="70" width="112" height="10" rx="5" fill="var(--success)" fillOpacity=".2" />
      <rect x="24" y="70" width="78" height="10" rx="5" fill="var(--success)" />
      <text x="108" y="79" fontSize="7" fontWeight="700" fill="var(--success)">70%</text>
      {/* Icône mobile money */}
      <rect x="24" y="30" width="28" height="28" rx="6" fill="var(--success)" fillOpacity=".15" />
      {/* Signal WiFi stylisé = mobile money */}
      <path d="M38 50 L38 44" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" />
      <path d="M34 50 C34 46 42 46 42 50" stroke="var(--success)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M30 50 C30 42 46 42 46 50" stroke="var(--success)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Ligne Wave */}
      <rect x="62" y="30" width="20" height="8" rx="2" fill="var(--success)" fillOpacity=".2" />
      <text x="72" y="37.5" textAnchor="middle" fontSize="6" fontWeight="800" fill="var(--success)">Wave</text>
      {/* Ligne Orange Money */}
      <rect x="86" y="30" width="28" height="8" rx="2" fill="var(--success)" fillOpacity=".2" />
      <text x="100" y="37.5" textAnchor="middle" fontSize="5.5" fontWeight="800" fill="var(--success)">Orange</text>
      {/* Ligne MTN */}
      <rect x="118" y="30" width="18" height="8" rx="2" fill="var(--success)" fillOpacity=".2" />
      <text x="127" y="37.5" textAnchor="middle" fontSize="6" fontWeight="800" fill="var(--success)">MTN</text>
      {/* Membres payés */}
      <circle cx="62" cy="54" r="7" fill="var(--success)" fillOpacity=".3" stroke="var(--success)" strokeWidth="1" />
      <circle cx="75" cy="54" r="7" fill="var(--success)" fillOpacity=".3" stroke="var(--success)" strokeWidth="1" />
      <circle cx="88" cy="54" r="7" fill="var(--success)" fillOpacity=".3" stroke="var(--success)" strokeWidth="1" />
      {/* Checkmark */}
      <path d="M59 54 L61 56.5 L65 51.5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M72 54 L74 56.5 L78 51.5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Croix (impayé) */}
      <path d="M85.5 51.5 L90.5 56.5 M90.5 51.5 L85.5 56.5" stroke="var(--fg-muted)" strokeWidth="1.5" strokeLinecap="round" />
      {/* + icône membre supplémentaire */}
      <circle cx="101" cy="54" r="7" fill="var(--border)" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="2 2" />
      <text x="101" y="57" textAnchor="middle" fontSize="9" fill="var(--fg-muted)">+</text>
    </svg>
  );
}
