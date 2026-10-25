import { EditorialShell } from "@/components/layout/editorial/editorial-shell";

import shell from "@/components/layout/editorial/editorial-shell.module.css";

export const metadata = {
  title: "Politique de confidentialité",
  description: "Informations sur les données personnelles traitées par Event.",
};

const sections = [
  {
    title: "Données traitées",
    paragraphs: [
      "Selon les fonctions que vous utilisez, le service peut traiter les informations de compte et de profil que vous fournissez, les événements que vous publiez, vos réservations et commandes, ainsi que vos publications et interactions dans les salons.",
      "Le numéro de téléphone fourni à l'inscription est conservé séparément des informations de profil visibles. Il sert à préremplir les commandes de billets, peut être modifié avant chaque paiement et est transmis au prestataire choisi pour préparer la demande de paiement. Event ne collecte pas les codes secrets Mobile Money ni les données de carte : la validation se fait sur le parcours sécurisé du prestataire.",
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
    <EditorialShell>
      <div className={shell.wrap}>
        <div className={shell.page} style={{ display: "grid", gap: 34, maxWidth: 900 }}>
          <header className={shell["page-head"]}>
            <p className={shell.eyebrow}>Informations légales</p>
            <h1
              className={shell["page-title"]}
              style={{ fontSize: "clamp(30px, 4.4vw, 50px)" }}
            >
              Politique de confidentialité
            </h1>
            <p className={shell["mono-label"]}>Version du 26 septembre 2026</p>
          </header>

          <div className={shell.prose}>
            <p>
              Cette politique décrit les catégories de données susceptibles d’être traitées lorsque
              vous utilisez Event. Les traitements effectifs et les durées de conservation doivent
              être confirmés par l’éditeur du service.
            </p>
            {sections.map((section, index) => (
              <section key={section.title}>
                <h2>
                  {index + 1}. {section.title}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </div>
    </EditorialShell>
  );
}
