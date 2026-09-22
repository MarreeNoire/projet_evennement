import { CalendarCheck, MessagesSquare, Search } from "lucide-react";

/* Les 3 étapes du parcours : Découvrir → Réserver → Rencontrer. */

export function HowItWorks() {
  const steps = [
    {
      icon: <Search className="size-5" aria-hidden="true" />,
      title: "1. Découvre",
      text: "Explore les événements : concerts, conférences, formations, networking.",
    },
    {
      icon: <CalendarCheck className="size-5" aria-hidden="true" />,
      title: "2. Réserve",
      text: "Paie en mobile money (Wave, Orange, MTN, Moov) ou carte, reçois ton billet QR.",
    },
    {
      icon: <MessagesSquare className="size-5" aria-hidden="true" />,
      title: "3. Rencontre",
      text: "Rejoins le salon : discute, networke et revois tes contacts après.",
    },
  ];

  return (
    <section className="container-page grid gap-4 py-12 md:grid-cols-3">
      {steps.map((step) => (
        <div key={step.title} className="rounded-2xl border border-border bg-surface p-6">
          <span
            className="flex size-10 items-center justify-center rounded-full bg-primary-subtle text-primary"
            aria-hidden="true"
          >
            {step.icon}
          </span>
          <h2 className="mt-4 font-display text-base font-semibold">{step.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{step.text}</p>
        </div>
      ))}
    </section>
  );
}
