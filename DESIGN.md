---
name: Event
description: A social network for discovering and sharing events.
colors:
  slate-blue: "#3d5c67"
  slate-blue-deep: "#344c55"
  soft-gray: "#e6e9ea"
  card-gray: "#f4f5f3"
  graphite: "#252d31"
  graphite-night: "#191e21"
  secondary-ink: "#505b60"
  quiet-ink: "#667277"
  rule: "#cbd2d4"
  muted-gold: "#d0bf89"
  forest: "#526d62"
  signal-red: "#a23227"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3.25rem, 7vw + 0.25rem, 7rem)"
    fontWeight: 700
    lineHeight: 0.91
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.slate-blue}"
    textColor: "#ffffff"
    typography: "Inter, ui-sans-serif, system-ui, sans-serif; 600"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.soft-gray}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "44px"
  input:
    backgroundColor: "{colors.card-gray}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
    height: "44px"
---

# Design System: Event

## Overview

**Creative North Star: "Le fil des sorties"**

Event feels like a calm, contemporary social network for finding and sharing events. A soft gray canvas, quiet card surfaces, readable graphite type and muted slate-blue actions keep the feed comfortable to scan. Real event covers supplied by organizers provide the imagery; the interface does not invent photographic proof or promotional content.

The same grammar carries from the participant feed to event discovery, profiles and organizer tools. The social feed and participant connections lead, while search and booking remain close at hand. Dense operational screens use the same colors and controls with tighter spacing. Light and dark themes keep muted contrast without relying on gradients or glass effects.

**Key Characteristics:**

- Soft gray backgrounds with graphite text and muted slate-blue actions.
- Compact, gently rounded controls, clear borders and restrained shadows.
- Event dates, places, prices and statuses appear as text, not decoration.
- Organizer statistics come from application data.
- No purple gradients, pill-shaped buttons, emoji icons, generated photographs, invented testimonials or customer metrics.

## Colors

Soft gray and graphite carry most of the screen. Slate blue marks the main action and current navigation; muted gold, forest and red are reserved for real semantic states.

### Primary
- **Slate blue** (#3d5c67): Main actions, active links and emphasis on light backgrounds.
- **Pale slate** (#a6c3ca): Primary links and focus accents on dark backgrounds.

### Secondary
- **Muted gold** (#d0bf89): Ticket-level and attention states where the label also explains the meaning.
- **Forest** (#526d62): Confirmed success states.
- **Signal red** (#a23227): Destructive actions and errors.

### Neutral
- **Soft gray** (#e6e9ea): Main light theme background.
- **Card gray** (#f4f5f3): Content surfaces and form fields.
- **Graphite** (#252d31): Main text and dark panels.
- **Night** (#191e21): Main dark theme background.
- **Secondary ink** (#505b60): Supporting copy on light surfaces.
- **Quiet ink** (#667277): Secondary labels on light surfaces.
- **Rule** (#cbd2d4): Light theme dividers and borders.

### Named Rules
**The Social Feed Rule.** Use alignment, avatars, timestamps and light separators to make posts easy to follow. Keep surfaces calm and avoid decorative gradients, blur or excessive contrast.

## Typography

**Display Font:** Inter, loaded locally by Next.js after build.
**Body Font:** Inter.

**Character:** Compact, heavy headlines contrast with readable interface copy. Large titles use tight leading; data uses tabular numerals where values need comparison.

### Hierarchy
- **Display** (700, fluid up to 7rem, 0.91 line-height): Main entry headline.
- **Headline** (700, 2rem to 3.25rem, 1.05 line-height): Page titles and major sections.
- **Title** (600 to 700, 1rem to 1.5rem): Event and panel titles.
- **Body** (400, 0.9375rem, 1.55 line-height): Supporting information, with a readable measure.
- **Label** (600, 0.75rem to 0.875rem): Form labels and compact metadata. Keep labels in sentence case unless they are short category markers.

## Layout

Use a centered content container up to 80rem, with 1rem mobile gutters, 1.5rem tablet gutters and 2rem desktop gutters. Main content uses consistent 8px steps, with larger gaps between independent sections. On wide screens, event search and content can use a two-column split; on narrow screens, the same order becomes a single column with no horizontal overflow.

Public event grids use three columns at wide desktop, two at tablet and one on small screens. Organizer and admin navigation sits beside the work area on desktop and yields to the existing mobile navigation on narrow screens.

## Elevation & Depth

Borders and tonal background changes carry hierarchy. Shadows remain small and neutral, reserved for overlays and popovers. No colored glow, glass blur or translate-on-hover card lift.

## Shapes

Buttons, inputs, badges and cards use 4px to 10px corners. Icon-only controls keep square hit areas. Avatars and purpose-built circular marks can remain circular. Keep badges compact and rectangular, and never use pill-shaped buttons.

## Components

- **Primary button:** Slate-blue fill, white label, compact radius, clear hover and keyboard focus states.
- **Secondary button:** Muted gray fill with graphite label and a visible border.
- **Input:** Soft gray surface, strong neutral border and persistent label; focus uses the slate-blue focus token.
- **Event card:** Real organizer-provided cover, rectangular category marker and readable date, place, price and organizer details.
- **Navigation:** The active page is identified by a subtle background and text color; inactive items remain quiet without pill backgrounds.
- **Status:** Pair each semantic color with a readable label. Do not rely on color alone.

## Do's and Don'ts

- Do use real, published event details and organizer-provided media.
- Do keep the participant feed, discovery path and social connections prominent, with organizer tools easy to scan.
- Do preserve dark mode, keyboard focus, reduced motion and high-contrast support.
- Do use Lucide icons with labels or accessible names for icon-only controls.
- Don't invent testimonials, customers, counts, payment methods or other product facts.
- Don't add generated photographs, emoji icons, vague promotional copy or em dashes.
- Don't use purple gradients, pill-shaped buttons, glass cards or arbitrary background decoration.
