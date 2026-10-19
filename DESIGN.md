---
name: Event
description: Plateforme de découverte, billetterie et organisation d'événements.
colors:
  eucalyptus: "#506964"
  ivoire: "#F5F4EC"
  brume: "#E9EBE1"
  miel-mat: "#CDB66F"
  terre-cuite-douce: "#A85D55"
  sauge: "#667F72"
  corail-doux: "#CE806B"
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
    surface: "matte honey keyline on muted eucalyptus desktop stage; light mobile stage"
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

- **Ground:** ivory `#F5F4EC` for discovery content; muted eucalyptus `#506964` on the desktop opening scene. The mobile hero and navigation use light mist `#E9EBE1` and ivory surfaces.
- **Accents:** matte honey `#CDB66F`, soft terracotta `#A85D55`, sage `#667F72`, and muted coral `#CE806B`. Use them as deliberate graphic marks, never as a background gradient.
- **Type:** Syne for display and event names; Plus Jakarta Sans for metadata, search and controls.
- **Spacing:** 4px base scale, 8/16/24/32/48px steps. Sections breathe; metadata stays compact.
- **Shape:** square corners for poster frames and actions, small radius only on compact controls. Keep the imagery and type ahead of containers.
- **Motion:** staged title reveal, 3D poster depth that responds to horizontal scroll, and short interaction feedback. Use transform and opacity; disable decorative movement for `prefers-reduced-motion`.
- **Mobile:** light hero and navigation surfaces, fixed safe-area bottom navigation, persistent compact search, swipeable poster rails, touch targets of at least 44px.

## Event truth

Only published events and organizer supplied covers, logos, dates, cities and prices appear on discovery surfaces. Missing covers use a typographic event poster made from the event's own title and category. Never invent attendees, popularity metrics, reviews, locations or organizer credentials.

## Accessibility

Keep keyboard focus visible, descriptive names on carousel controls, readable contrast on the indigo stage and paper surfaces, and honor reduced-motion settings. The carousel remains swipeable and operable with explicit previous/next controls.
