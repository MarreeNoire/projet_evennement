import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

import { SCENES, TRANSITION } from "./theme";
import { Brand } from "./scenes/Brand";
import { CheckIn } from "./scenes/CheckIn";
import { CreateEvent } from "./scenes/CreateEvent";
import { Cta } from "./scenes/Cta";
import { Hook } from "./scenes/Hook";
import { Salon } from "./scenes/Salon";
import { Tickets } from "./scenes/Tickets";

/* =============================================================================
   Publicité Event — 24 s, sept scènes.
   Les coupes glissent d'un cran vers le haut (comme un fil qu'on fait
   défiler) ; l'ouverture et la fermeture se fondent en douceur.
   ========================================================================== */

export const Promo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence name="01 · Accroche" durationInFrames={SCENES.hook}>
      <Hook />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={fade()}
      timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION })}
    />
    <TransitionSeries.Sequence name="02 · Marque" durationInFrames={SCENES.brand}>
      <Brand />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({ direction: "from-bottom" })}
      timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION })}
    />
    <TransitionSeries.Sequence name="03 · Créer" durationInFrames={SCENES.create}>
      <CreateEvent />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({ direction: "from-bottom" })}
      timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION })}
    />
    <TransitionSeries.Sequence name="04 · Vendre" durationInFrames={SCENES.tickets}>
      <Tickets />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({ direction: "from-bottom" })}
      timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION })}
    />
    <TransitionSeries.Sequence name="05 · Rassembler" durationInFrames={SCENES.salon}>
      <Salon />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({ direction: "from-bottom" })}
      timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION })}
    />
    <TransitionSeries.Sequence name="06 · Accueillir" durationInFrames={SCENES.checkIn}>
      <CheckIn />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={fade()}
      timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION })}
    />
    <TransitionSeries.Sequence name="07 · Signature" durationInFrames={SCENES.cta}>
      <Cta />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
