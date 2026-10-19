---
name: Event
description: Plateforme de découverte, billetterie et organisation d'événements.
colors:
  lagon-profond: "#123D3E"
  papier-vert: "#F2F1E7"
  papier-ombre: "#E2E5D8"
  citron: "#D6E44B"
  baie: "#B34855"
  feuille: "#285E53"
  corail: "#ED7958"
typography:
  display:
    fontFamily: "Syne, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.65rem, 6vw, 5.5rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.045em"
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  event-poster:
    image: "3:4 hero / 4:3 listings; real organizer media only"
    surface: "gold keyline on indigo stage; open editorial metadata"
  search:
    placement: "sticky under the top navigation"
    height: "45px"
    shape: "compact field, 4px radius"
  mobile-navigation:
    placement: "fixed bottom, safe-area aware"
    height: "56px plus safe area"
---

## North star

Event feels like an invitation to a living city: real event posters take the stage, and a woven geometric border gives the interface a contemporary West African visual signature. The fabric reference is an original geometric treatment, not a reproduction of a specific ceremonial cloth.

## Visual system

- **Ground:** soft green paper `#F2F1E7` for discovery content; deep lagoon `#123D3E` for the opening scene.
- **Accents:** citron `#D6E44B`, berry `#B34855`, leaf `#285E53`, and coral `#ED7958`. Use them as deliberate graphic marks, never as a background gradient.
- **Type:** Syne for display and event names; Plus Jakarta Sans for metadata, search and controls.
- **Spacing:** 4px base scale, 8/16/24/32/48px steps. Sections breathe; metadata stays compact.
- **Shape:** square corners for poster frames and actions, small radius only on compact controls. Keep the imagery and type ahead of containers.
- **Motion:** staged title reveal, 3D poster depth that responds to horizontal scroll, and short interaction feedback. Use transform and opacity; disable decorative movement for `prefers-reduced-motion`.
- **Mobile:** fixed safe-area bottom navigation, persistent compact search, swipeable poster rails, touch targets of at least 44px.

## Event truth

Only published events and organizer supplied covers, logos, dates, cities and prices appear on discovery surfaces. Missing covers use a typographic event poster made from the event's own title and category. Never invent attendees, popularity metrics, reviews, locations or organizer credentials.

## Accessibility

Keep keyboard focus visible, descriptive names on carousel controls, readable contrast on the indigo stage and paper surfaces, and honor reduced-motion settings. The carousel remains swipeable and operable with explicit previous/next controls.
