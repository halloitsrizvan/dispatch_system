---
name: Clinical Command
colors:
  surface: '#0e1511'
  surface-dim: '#0e1511'
  surface-bright: '#333b37'
  surface-container-lowest: '#08100c'
  surface-container-low: '#161d1a'
  surface-container: '#1a211d'
  surface-container-high: '#242c28'
  surface-container-highest: '#2f3632'
  on-surface: '#dce4de'
  on-surface-variant: '#bbcac1'
  inverse-surface: '#dce4de'
  inverse-on-surface: '#2a322e'
  outline: '#85948c'
  outline-variant: '#3c4a43'
  surface-tint: '#3adfab'
  primary: '#42e5b0'
  on-primary: '#003828'
  primary-container: '#00c896'
  on-primary-container: '#004d38'
  inverse-primary: '#006c4f'
  secondary: '#bec7d2'
  on-secondary: '#29313a'
  secondary-container: '#414a53'
  on-secondary-container: '#b0b9c4'
  tertiary: '#ffbca2'
  on-tertiary: '#591d00'
  tertiary-container: '#ff9467'
  on-tertiary-container: '#762b05'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#60fcc6'
  primary-fixed-dim: '#3adfab'
  on-primary-fixed: '#002116'
  on-primary-fixed-variant: '#00513b'
  secondary-fixed: '#dae3ee'
  secondary-fixed-dim: '#bec7d2'
  on-secondary-fixed: '#141c24'
  on-secondary-fixed-variant: '#3f4850'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb598'
  on-tertiary-fixed: '#370e00'
  on-tertiary-fixed-variant: '#7b2f09'
  background: '#0e1511'
  on-background: '#dce4de'
  surface-variant: '#2f3632'
typography:
  h1-technical:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  h2-technical:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.01em
  data-display-lg:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  data-display-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-regular:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
  ui-label-bold:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  ui-label-standard:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 12px
  panel-padding: 16px
---

## Brand & Style
The design system is a high-performance operational framework designed for mission-critical medical dispatch. It adopts a **Clinical-Minimalist** style, blending the urgency of a hospital command center with the precision of a modern logistics dashboard. 

The aesthetic is cold, calculated, and professional. It prioritizes information density and cognitive load reduction, ensuring phlebotomists and dispatchers can make split-second decisions without visual interference. The interface relies on subtle luminescence and sharp geometry rather than heavy decorative elements, evoking a sense of "digital instruments" rather than traditional web software.

## Colors
The palette is rooted in deep obsidian tones to minimize eye strain during long shifts. 
- **Primary Teal (#00C896):** Used for "Active," "Sterile," and "Ready" states. It serves as the primary action color and focal point.
- **Functional Accents:** Warning Amber (#F59E0B) is reserved for delayed dispatches or pending results, while Danger Red (#EF4444) is strictly for STAT orders or medical emergencies.
- **Neutral Scale:** The background and surface colors provide a layered foundation for information hierarchy, using the Text Secondary (#8B949E) for non-essential metadata and borders for structural definition.

## Typography
This design system utilizes a tri-font strategy to separate intent:
- **Headings (IBM Plex Sans):** Condensed and technical. Used for page titles and major module headers to convey authority.
- **Data & Body (JetBrains Mono):** A monospace typeface ensures that timestamps, lab IDs, and numerical values align perfectly in tables. It reinforces the "system log" aesthetic.
- **UI Labels (DM Sans):** Used for buttons, menu items, and form labels. Its geometric clarity provides a modern contrast to the technical data fonts.

## Layout & Spacing
The layout follows a **4px baseline grid** to achieve high information density without sacrificing legibility. 
- **Grid System:** A 12-column fluid grid is used for the main dashboard, but specific "Terminal Panels" use fixed widths (e.g., 320px sidebar) to maintain constant visibility of the dispatch queue.
- **Density:** Padding is intentionally tight (12px to 16px) to maximize the amount of data visible on a single screen, reducing the need for scrolling. 
- **Mapping:** The central workspace often features a Mapbox integration using a "Midnight" or "Dark" tileset that matches the `#0D1117` background.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Subtle Luminescence** rather than traditional drop shadows.
- **Z-Axis Hierarchy:** The base layer is `#0D1117`. Elevated panels use `#161B22`. Hover states or active selections utilize a `1px` solid border of `#30363D`.
- **Glow Effect:** Active or "Live" elements (like a phlebotomist currently in transit) feature a `0px 0px 8px rgba(0, 200, 150, 0.3)` outer glow to signify status.
- **Glassmorphism:** Reserved strictly for overlays and modals to maintain context of the underlying dashboard. Use a background blur of `12px` and a surface opacity of `80%`.

## Shapes
The design system employs a **Soft-Sharp** geometry. 
- **Base Radius:** 4px (`0.25rem`) for cards, input fields, and buttons to maintain a professional, instrument-like feel.
- **Interactive Elements:** Larger components like modals or main content containers use 8px (`0.5rem`).
- **Icons:** Use linear, 2px stroke-weight icons with sharp joins to match the technical nature of the typography.

## Components
- **Buttons:** Primary buttons are solid teal (#00C896) with black text. Secondary buttons are outlined with `#30363D`. Use `DM Sans` bold for all labels.
- **Status Chips:** Small, high-contrast badges with a `dot` indicator. "Stat" chips should pulse subtly.
- **Data Tables:** Border-heavy with no zebra-striping. Use `#30363D` for horizontal separators. All numbers must be right-aligned using `JetBrains Mono`.
- **Input Fields:** Dark background (#0D1117), 1px border (#30363D). Focus state changes border to Teal and adds a subtle inner glow.
- **Dispatch Cards:** High-density summaries containing Patient Name, Location, and Time-to-SLA. Use a vertical color bar on the left edge to indicate priority.
- **Live Map Markers:** Teal circles with a pulsing ring for active phlebotomists; static grey icons for completed stops.