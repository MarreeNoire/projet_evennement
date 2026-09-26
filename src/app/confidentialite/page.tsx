import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata = {
  title: "Politique de confidentialité | Event",
  description: "Informations sur les données personnelles traitées par Event.",
};

const sections = [
  {
    title: "Données traitées",
    paragraphs: [
      "Selon les fonctions que vous utilisez, le service peut traiter les informations de compte et de profil que vous fournissez, les événements que vous publiez, vos réservations et commandes, ainsi que vos publications et interactions dans les salons.",
      "Les données nécessaires à un paiement peuvent être transmises au prestataire de paiement choisi lors de la commande. Les coordonnées de paiement complètes ne doivent pas être saisies dans les publications ou les champs de profil.",
    ],
  },
  {
    title: "Utilisation des données",
    paragraphs: [
      "Ces données servent au fonctionnement des comptes, à l’affichage des profils et des événements, à la gestion des réservations et billets, aux échanges dans les salons, à la sécurité et au traitement des demandes adressées au service.",
      "Les informations communiquées à un organisateur sont limitées à celles nécessaires à la gestion de son événement et au contrôle des billets. Les contenus publiés dans un salon sont visibles selon les paramètres d’accès du salon.",
    ],
  },
  {
    title: "Prestataires et conservation",
    paragraphs: [
      "L’hébergement de l’application et de ses données, l’envoi de courriels et le traitement des paiements peuvent faire intervenir des prestataires techniques. Les données sont accessibles aux personnes habilitées dans la mesure nécessaire à leurs fonctions.",
      "Les durées de conservation dépendent de la nature des données et des obligations applicables. Les durées précises doivent être communiquées par l’éditeur du service avant son ouverture au public.",
    ],
  },
  {
    title: "Vos demandes",
    paragraphs: [
      "Pour demander l’accès, la rectification ou la suppression de vos données, ou poser une question sur leur traitement, utilisez la page Contact. Une demande peut nécessiter la vérification de votre identité.",
      "Cette page présente les traitements de manière générale. L’identité et les coordonnées du responsable du traitement, les durées détaillées et les coordonnées de l’autorité compétente doivent être ajoutées par l’éditeur avant publication définitive.",
    ],
  },
];

export default function ConfidentialitePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page mx-auto w-full max-w-4xl flex-1 py-10 md:py-14">
        <header className="mb-8 border-b border-border pb-5">
          <p className="eyebrow">Informations légales</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Politique de confidentialité
          </h1>
          <p className="mt-3 text-sm text-fg-muted">Version du 26 septembre 2026</p>
        </header>
        <div className="space-y-8 text-sm leading-7 text-fg-muted">
          <p>
            Cette politique décrit les catégories de données susceptibles d’être traitées lorsque vous utilisez Event. Les traitements effectifs et les durées de conservation doivent être confirmés par l’éditeur du service.
          </p>
          {sections.map((section, index) => (
            <section key={section.title} className="border-t border-border pt-5">
              <h2 className="mb-2 text-lg font-semibold text-fg">
                {index + 1}. {section.title}
              </h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-2">{paragraph}</p>)}
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
