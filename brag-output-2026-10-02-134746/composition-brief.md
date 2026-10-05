# Hyperframes Composition Brief: Event

## Objective
Create a short launch-style brag video for Event that makes the app’s event-to-community flow immediately clear.

## Output
- Composition directory: `brag-output-2026-10-02-134746/composition/`
- Rendered video: `brag-output-2026-10-02-134746/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 22.9 seconds

## Source Material
- Project root: `C:/Projets_informatiques/projet_evennement`
- Primary files read: `README.md`, `src/app/globals.css`, `src/components/brand/logo.tsx`, `src/components/home/home-hero.tsx`, `src/components/events/event-ticketing.tsx`, `src/app/evenements/[slug]/page.tsx`
- Product name: Event (project package / repository identity: Rassemble)
- Tagline / strongest claim: “Le fil des événements et des rencontres.”
- Key UI or visual moment to recreate: the search field, ticket artwork, QR ticket and event salon sequence.
- Copy that must appear verbatim:
  - “Le fil des événements et des rencontres”
  - “Rechercher un événement”
  - “Rechercher”
  - “Avant, pendant, après”
  - “Suis les échanges dans les salons et découvre les événements publiés sur Event.”

## Creative Direction
- Tone preset: polished
- Creative direction: quiet, tactile product film; warm paper and precise interface motion.
- Interpretation: spacious transitions, grounded UI details, restrained type, and only a few sound accents.
- Angle: one event is more than a listing; Event carries a person from curiosity to a ticket to the conversation that surrounds the gathering.
- Hook: draw the Event mark on warm paper, then land the real headline.
- Outro / punchline: “Suis les échanges dans les salons et découvre les événements publiés sur Event.”
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign
  - Any implication that the illustrative event, QR pattern, payment, or messages are real transaction data

## Visual Identity
- Background: #e4ddd1
- Text: #282622
- Accent: #60352c
- Display font: Inter (project font)
- Body font: Inter (project font)
- Visual references from the project: two-arch Event mark, ticket silhouette, warm stone paper surfaces, ink text and muted terracotta.

## Storyboard
Use the storyboard in `brag-plan.md` as the creative contract.

Scene summary:
1. La signature — 3.2s — Event mark and product headline.
2. La découverte — 5.5s — search field, illustrative event card and ticket action.
3. Le billet — 4.3s — illustrative QR ticket resolves; clearly decorative, not redeemable.
4. Le salon — 5.5s — the “Avant, pendant, après” phrase and an illustrative salon.
5. La promesse — 4.4s — Event identity and actual supporting copy.

## Audio
- Audio role: warm bed with sparse professional accents.
- Audio arc: warm, light motion; soft interface confirmation; gentle brand landing.
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`
- Music treatment: start at 0, low under copy, fade through the last 0.5–0.8s.
- Music cue guidance: bundled preset `happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.md`; the ticket transition lands at 8.74s and the salon opens at 13.11s. The 22.93s cue is outside the 22.9s cut. Cues are optional; do not compress reading time.
- Audio-reactive treatment: not implemented; the HyperFrames audio-analysis helper skill was unavailable in this runtime, so the composition does not claim to react to the track.
- Audio-coupled moments:
  - Event card reveal — possible beat reveal.
  - QR pass settle — soft confirmation.
  - Salon reveal — soft card movement.
- SFX selection guidance: choose two or three low-intensity, low-HF-risk cues; match clicks and reveals to visible actions.
- SFX analysis guidance: `C:/Users/Lemic/.codex/plugins/cache/brag/brag/0.4.0/skills/brag/assets/sfx/sfx-analysis.md`
- Exact SFX choice: select after the implemented motion is known.
- Audio files: copy the chosen music and any selected SFX into `composition/assets/`.

## Hyperframes Instructions
Use the current Hyperframes composition contract and CLI validation rather than a stale template. Keep all motion seek-safe, all shown copy grounded in the source project, the QR pattern decorative, and the entire sequence within 15–25 seconds. Run `npx hyperframes check` before rendering. Use only local composition and rendering; do not publish remotely.
