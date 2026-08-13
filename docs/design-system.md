# FictionFigure — Design System Specifications

This document outlines the visual identity, typography scale, component tokens, and layout guidelines for **FictionFigure**.

---

## 1. Core Visual Principles

- **Editorial Collectibles Identity**: Premium, minimalist, warm off-white background, clean sans-serif typography, precise grid alignment, generous whitespace.
- **Anti-AI Slop Directive**: Strictly NO purple/blue neon gradients, NO glassmorphism backdrop blurs, NO generic floating cards, NO fake testimonials, NO excessive bouncing animations.

---

## 2. Color Token Scale

```text
Background:       #F7F7F5  (Warm Off-White)
Surface / Card:   #FFFFFF  (Pure White)
Muted Surface:    #F0F0ED  (Light Sand)
Primary Text:     #111111  (Deep Charcoal / Off-Black)
Secondary Text:   #6B6B6B  (Muted Neutral Grey)
Border / Line:    #E5E5E2  (Subtle Hairline Border)
Accent / Brand:   #111111  (Minimalist Solid Black Accent)
Success:          #2E6B44  (Muted Forest Green)
Warning:          #B86E00  (Muted Warm Amber)
Error:            #A83232  (Muted Deep Crimson)
```

---

## 3. Typography Scale

Font Family: `Inter`, `Geist`, or `Manrope`, system fallback sans-serif.

```text
Hero Headline:      36px – 48px | Font-Weight: 600 | Line-Height: 1.15 | Letter-Spacing: -0.02em
Section Title:      24px – 28px | Font-Weight: 600 | Line-Height: 1.25 | Letter-Spacing: -0.01em
Subtitle / Subhead: 18px – 20px | Font-Weight: 500 | Line-Height: 1.4
Body / Copy:        14px – 16px | Font-Weight: 400 | Line-Height: 1.6
Meta / Tag / Small: 12px – 13px | Font-Weight: 500 | Uppercase / Tracking-Wider
Price Display:      16px – 20px | Font-Weight: 600 | Monospace / Tabular-Nums
```

---

## 4. Spacing & Container Grid

- **Desktop Max Container**: `1340px` centered with `24px` horizontal padding (`px-6`).
- **Grid Layouts**:
  - Storefront Product Grid: 4 columns desktop (`lg:grid-cols-4`), 3 columns tablet (`md:grid-cols-3`), 2 columns mobile (`grid-cols-2`).
  - Hero Layout: Editorial 2-column or full-width image hero with restrained left-aligned content box.
  - Detail Page Layout: 2-column 50/50 split (Gallery Left, Details Right).

---

## 5. UI Component Primitives

- **Buttons**:
  - Primary: Solid `#111111` background, `#FFFFFF` text, `px-6 py-3`, slight `rounded-sm` (2px-4px radius), smooth hover effect (`bg-black/90`).
  - Secondary: Transparent background, `#111111` 1px border, `#111111` text.
  - Ghost: Minimal text link with hairline bottom border on hover.
- **Form Inputs**: `#FFFFFF` background, 1px `#E5E5E2` border, `#111111` text, `focus:border-black focus:ring-0`.
- **Badges**: Flat `#F0F0ED` background with uppercase `#111111` text, zero border, minimal padding.
- **Product Cards**: Sharp, clean hairline border (`border border-[#E5E5E2]`), full aspect-ratio image container (`aspect-[3/4]`), smooth subtle secondary image reveal on hover.

---

## 6. Animation Guidelines

- **Duration**: `150ms – 250ms` cubic-bezier easing.
- **Allowed Motion**: Smooth image scale (`group-hover:scale-[1.02]`), slide-over drawer transition for Cart/Filters, subtle opacity fade-in.
- **Forbidden Motion**: Bouncing icons, rotating badges, parallax scroll hijacking, animated color gradients.
