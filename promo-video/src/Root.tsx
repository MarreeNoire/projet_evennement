import { Composition, Folder } from "remotion";

import { Promo } from "./Promo";
import { HeroJourneyFilm } from "./HeroJourney";
import { AGNES_HERO_DURATION, AgnesHeroFilm } from "./AgnesHeroFilm";
import { TOTAL_DURATION } from "./theme";

/* Trois déclinaisons de la même publicité : 9:16 pour les stories et Reels,
   1:1 pour le fil, 16:9 pour le paysage (YouTube, écrans). */

export const RemotionRoot = () => (
  <Folder name="Event">
    <Composition id="AgnesHeroFilm" component={AgnesHeroFilm} durationInFrames={AGNES_HERO_DURATION} fps={24} width={1280} height={720} />
    <Composition id="HeroJourney" component={HeroJourneyFilm} durationInFrames={630} fps={30} width={1280} height={720} />
    <Composition
      id="EventPubVerticale"
      component={Promo}
      durationInFrames={TOTAL_DURATION}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="EventPubCarre"
      component={Promo}
      durationInFrames={TOTAL_DURATION}
      fps={30}
      width={1080}
      height={1080}
    />
    <Composition
      id="EventPubPaysage"
      component={Promo}
      durationInFrames={TOTAL_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
  </Folder>
);
