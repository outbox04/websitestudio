---
version: alpha
name: TLORA Studio
description: Dark luxury operating interface for Vietnamese studio websites, AI concept tools, registration, payment, and customer galleries.
colors:
  primary: "#07080A"
  on-primary: "#F8F5EE"
  secondary: "#101115"
  on-secondary: "#CBC0B0"
  tertiary: "#D8B766"
  on-tertiary: "#07080A"
  accent-soft: "#F3D88E"
  surface: "#14110F"
  surface-raised: "#1C1813"
  border: "#2A2722"
  muted: "#8C8174"
  success: "#34D399"
  danger: "#FCA5A5"
typography:
  h1:
    fontFamily: var(--font-body), Inter, Arial, sans-serif
    fontSize: 3rem
    fontWeight: 900
    lineHeight: 1.08
    letterSpacing: 0
  h2:
    fontFamily: var(--font-body), Inter, Arial, sans-serif
    fontSize: 2rem
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: 0
  body-md:
    fontFamily: var(--font-body), Inter, Arial, sans-serif
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0
  body-sm:
    fontFamily: var(--font-body), Inter, Arial, sans-serif
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  label-caps:
    fontFamily: var(--font-body), Inter, Arial, sans-serif
    fontSize: 0.75rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.12em
  button:
    fontFamily: var(--font-body), Inter, Arial, sans-serif
    fontSize: 0.875rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
components:
  app-shell:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-md}"
  section-dark:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-primary}"
    padding: 48px
  card:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.lg}"
    padding: 24px
  card-raised:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.xl}"
    padding: 24px
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.on-tertiary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px
  button-ghost:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px
  input:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 12px
  muted-label:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.muted}"
    typography: "{typography.label-caps}"
  border-line:
    backgroundColor: "{colors.border}"
    textColor: "{colors.on-primary}"
    height: 1px
  success-state:
    backgroundColor: "{colors.success}"
    textColor: "{colors.primary}"
  danger-state:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.primary}"
---

## Overview

TLORA Studio is a dark premium operating room for Vietnamese photography studios: part black-box editing suite, part boutique showroom, part practical booking desk. The audience is studio owners and staff who need to move through registration, payment, customer galleries, AI concept generation, and site-building without feeling like they are inside a generic SaaS dashboard.

The TLORA product UI should feel cinematic but controlled. Public TLORA pages may carry the mood of a luxury studio portfolio, while admin and builder screens should stay quieter, denser, and more operational. The job of the UI is to help a studio look expensive and run smoothly; decoration is only useful when it reinforces that confidence.

Studio subdomain websites are customer-facing brand surfaces. They may use independent colors, typography, imagery, and theme personalities chosen by each studio. Do not force subdomain website themes to use TLORA's dark-and-gold palette. TLORA tokens apply to the TLORA shell, admin tools, payment, onboarding, builder controls, customer gallery product UI, and AI tools; customer website previews and published subdomain pages should respect their own theme settings.

## Colors

The TLORA product palette is a low-light studio environment with one warm metallic signal.

- **Primary / Black Studio (`#07080A`):** The default page background. It should feel like a quiet editing room, not a pure black void.
- **On Primary / Warm Ivory (`#F8F5EE`):** Main text, key headings, and high-confidence labels. It keeps the dark UI human and readable.
- **Surface Layers (`#101115`, `#14110F`, `#1C1813`):** Panels, cards, sidebars, modals, tool areas, and section changes. Use tonal layering before shadows.
- **Tertiary / TLORA Gold (`#D8B766`):** The single brand accent. It marks primary actions, selected steps, active controls, revenue/payment emphasis, and important metrics.
- **Accent Soft (`#F3D88E`):** Hover, focus, and soft highlight states. Use it as light catching on gold, not as a second brand color.
- **Muted Warm Gray (`#8C8174`, `#CBC0B0`):** Helper text, captions, metadata, placeholders, legal copy, and secondary navigation.

Do not flood large backgrounds with gold. Gold becomes premium because it is scarce.

For subdomain website themes, use the studio's configured `primary_color`, `accent_color`, uploaded logo, imagery, and theme-specific palette. TLORA gold may appear in builder chrome or editing outlines, but should not override the studio's published brand.

## Typography

Typography should sound like a confident studio consultant: direct, polished, and easy to scan in Vietnamese.

- **Headings:** Use the app body font with heavy weights for authority. Headings are compact and deliberate, with normal letter spacing so Vietnamese text remains clean.
- **Body:** Use comfortable line height for long-form pages, policies, checkout notes, and customer instructions.
- **Labels:** Uppercase `label-caps` works for plan names, sections, status labels, and admin metadata. Keep it short; long Vietnamese labels should stay sentence case.
- **Code/Data:** Use `var(--font-code)` only for domains, slugs, IDs, references, and technical fields.

Avoid viewport-scaled text that can overflow. Use fixed responsive sizes or `clamp()` only when the container has stable bounds.

## Layout

The layout follows a showroom-plus-workbench model.

Public TLORA pages may use cinematic full-width bands, strong imagery, and constrained editorial content. Product, admin, builder, and payment screens should behave like tools: predictable navigation, compact controls, visible state, and fast comparison.

Subdomain website themes should be audited for visual quality, mobile fit, contrast, imagery, and content hierarchy, not for matching TLORA colors. A wedding studio, concept studio, family studio, or fashion studio can each have its own palette if it remains coherent and usable.

Use an 8px rhythm through the spacing tokens. Keep repeated items in stable grids. Gallery tiles, upload areas, AI previews, plan cards, buttons, badges, and toolbars should have fixed or constrained dimensions so loading states, hover states, labels, and generated content do not shift the layout.

Mobile layouts should stack into a single readable column with persistent access to the next action. Never let badges, floating controls, or image overlays cover essential text.

## Elevation & Depth

Depth comes from tonal layers, fine borders, and occasional soft shadow. The base page is the dark studio. Panels sit one tone above it. Modals, sticky headers, checkout summaries, and builder sidebars may sit higher with a warmer raised surface.

Use shadows sparingly and keep them dark, soft, and functional. Glass or blur effects are acceptable for sticky navigation and overlays when text contrast remains strong. Avoid glow as decoration; a gold glow is only appropriate for focused controls or a single high-value hero moment.

## Shapes

The shape language is soft-technical: precise enough for a tool, warm enough for a studio brand.

Use `rounded.md` for buttons, inputs, selects, compact controls, and admin surfaces. Use `rounded.lg` for cards and grouped panels. Use `rounded.xl` only for larger feature panels, checkout summaries, modals, and media previews with enough breathing room. Use `rounded.pill` for badges and compact status chips.

## Components

### Action Elements

Primary buttons are gold with dark text. They should be easy to find but should not appear more than once per decision area. Ghost buttons stay dark with muted light text and a visible border or hover state. Destructive actions should not use gold.

### Cards And Panels

Cards are for repeated items, modals, and framed tool surfaces. Do not put cards inside cards. Use borders and tonal surface changes to group content before adding heavy shadows.

### Subdomain Themes

Published studio websites and theme HTML files are allowed to define their own palettes and art direction. The builder/editor UI around them should use TLORA tokens, while the iframe preview and generated customer website should preserve the selected theme and studio brand colors.

### Forms And Checkout

Inputs should use dark surfaces, warm ivory text, clear muted labels, and gold focus states. Payment and registration screens should make the current step, total cost, domain, and next action visually obvious.

### Galleries And Media

Images are first-class content. Gallery, concept, portfolio, and studio-site screens should use real imagery or generated concept output rather than decorative placeholders. Media controls must remain legible over bright and dark photos.

Icon buttons should use lucide-react icons when available and include accessible labels.

## Do's and Don'ts

- **Do** keep TLORA pages cinematic, premium, and practical.
- **Do** use real studio, gallery, customer, product, or generated concept imagery when building public-facing pages.
- **Do** make admin and builder screens quieter, denser, and more tool-like than landing pages.
- **Do** preserve strong contrast for Vietnamese text, especially on legal pages, forms, galleries, and checkout.
- **Do** let studio subdomain websites use their own brand colors and theme-specific visual language.
- **Don't** create one-note gold or brown pages. Balance the gold accent with dark neutrals and readable text.
- **Don't** use decorative blobs, gradient orbs, bokeh decoration, or generic stock-like backgrounds.
- **Don't** add nested cards, oversized marketing heroes, or ornamental sections to operational screens.
- **Don't** force published studio subdomain themes to look like TLORA's product UI.
- **Don't** overlap text, buttons, badges, or image controls on mobile or desktop.
