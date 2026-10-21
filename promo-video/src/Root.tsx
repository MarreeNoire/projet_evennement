import { Composition, Folder } from "remotion";

import { Promo } from "./Promo";
import { TOTAL_DURATION } from "./theme";

/* Trois déclinaisons de la même publicité : 9:16 pour les stories et Reels,
   1:1 pour le fil, 16:9 pour le paysage (YouTube, écrans). */

export const RemotionRoot = () => (
  <Folder name="Event">
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
