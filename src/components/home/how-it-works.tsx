/* =============================================================================
   Le principe en trois temps : Découvrir → Réserver → Rencontrer.
   Liste numérotée éditoriale (chiffres italiques + filet d'encre), pas trois
   cartes identiques avec une icône dans un rond.
   ========================================================================== */

const STEPS = [
  {
    number: "01",
    title: "Découvre",
    text: "Explore les événements : concerts, conférences, formations, networking.",
  },
  {
    number: "02",
    title: "Réserve",
    text: "Paie en mobile money (Wave, Orange, MTN, Moov) ou carte, reçois ton billet QR.",
  },
  {
    number: "03",
    title: "Rencontre",
    text: "Rejoins le salon : discute, networke et revois tes contacts après.",
  },
] as const;

export function HowItWorks() {
  return (
    <section aria-labelledby="principe" className="container-page py-14 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_2.2fr] lg:gap-16">
        <div>
          <p className="eyebrow">Le principe</p>
          <h2
            id="principe"
            className="mt-3 font-display text-3xl leading-[1.05] font-semibold md:text-4xl"
          >
            Trois temps, un seul billet.
          </h2>
        </div>

        <ol className="grid gap-8 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((step) => (
            <li key={step.number} className="border-t border-border pt-4">
              <span className="font-display text-5xl font-light text-primary italic tabular-nums">
                {step.number}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
