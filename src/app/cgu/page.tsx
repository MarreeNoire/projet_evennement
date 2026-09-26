import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata = {
  title: "Conditions générales d’utilisation | Event",
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
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page mx-auto w-full max-w-4xl flex-1 py-10 md:py-14">
        <header className="mb-8 border-b border-border pb-5">
          <p className="eyebrow">Informations légales</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Conditions générales d’utilisation
          </h1>
          <p className="mt-3 text-sm text-fg-muted">Version du 26 septembre 2026</p>
        </header>
        <div className="space-y-8 text-sm leading-7 text-fg-muted">
          <p>
            Ces conditions décrivent les principales règles d’utilisation du service. Elles doivent être relues et complétées par l’éditeur, notamment avec son identité et ses coordonnées, avant publication définitive.
          </p>
          {sections.map((section, index) => (
            <section key={section.title} className="border-t border-border pt-5">
              <h2 className="mb-2 text-lg font-semibold text-fg">
                {index + 1}. {section.title}
              </h2>
              <p>{section.text}</p>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
