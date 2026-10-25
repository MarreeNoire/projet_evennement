import { EditorialShell } from "@/components/layout/editorial/editorial-shell";

import shell from "@/components/layout/editorial/editorial-shell.module.css";

export const metadata = {
  title: "Conditions générales d’utilisation",
  description: "Règles d’utilisation de la plateforme Event.",
};

const sections = [
  {
    title: "Service",
    text: "Event permet de consulter des événements publiés par des organisateurs, de réserver ou acheter des billets lorsque cette fonction est disponible, et d’accéder aux espaces de discussion associés. Les informations propres à chaque événement sont présentées sur sa page.",
  },
  {
    title: "Compte et publications",
    text: "Vous êtes responsable des informations que vous ajoutez à votre compte et des contenus que vous publiez. Utilisez le service de façon licite, respectez les autres personnes et ne publiez pas de contenu frauduleux, menaçant, haineux ou portant atteinte aux droits d’autrui. Des contenus ou comptes peuvent être modérés lorsqu’un signalement ou un motif de sécurité le justifie.",
  },
  {
    title: "Événements et billets",
    text: "L’organisateur est responsable de la description, du prix, des conditions d’accès et de la tenue de son événement. Avant de payer, vérifiez les informations de l’événement ainsi que les conditions d’annulation et de remboursement communiquées par l’organisateur. Une commande n’est confirmée qu’après validation du paiement et émission du billet par le service.",
  },
  {
    title: "Paiements et assistance",
    text: "Les moyens de paiement proposés sont ceux affichés au moment de la commande. Le traitement peut être assuré par un prestataire externe. Pour une question relative à une commande, contactez l’organisateur concerné et utilisez également la page Contact de Event si une assistance de la plateforme est nécessaire.",
  },
  {
    title: "Disponibilité et évolution",
    text: "Certaines fonctions peuvent être temporairement indisponibles pour maintenance ou en raison d’un incident technique. Les présentes conditions et les coordonnées de l’éditeur doivent être vérifiées et complétées par celui-ci avant la mise en service publique de la plateforme.",
  },
];

export default function CGUPage() {
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
              Conditions générales d’utilisation
            </h1>
            <p className={shell["mono-label"]}>Version du 26 septembre 2026</p>
          </header>

          <div className={shell.prose}>
            <p>
              Ces conditions décrivent les principales règles d’utilisation du service. Elles
              doivent être relues et complétées par l’éditeur, notamment avec son identité et ses
              coordonnées, avant publication définitive.
            </p>
            {sections.map((section, index) => (
              <section key={section.title}>
                <h2>
                  {index + 1}. {section.title}
                </h2>
                <p>{section.text}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </EditorialShell>
  );
}
