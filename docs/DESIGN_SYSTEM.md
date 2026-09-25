# FICTIONFIGURE — Cinematic Dark Anime-Commerce Design System
**Version:** 2.0 (Phase 8.0 Foundation)  
**Target Brand Feel:** Premium Anime Collectible Brand, Cinematic Dark Canvas, Collectible-Card Atmosphere.

---

## 1. Design Philosophy
FICTIONFIGURE's storefront is designed around the concept of a **Collector's Sanctuary**. Unlike conventional white e-commerce templates, FICTIONFIGURE embraces a deep, atmospheric dark theme where the rich, vibrant colors of high-end anime scale figures and statues take center stage.

- **Cinematic Canvas:** Deep obsidian and charcoal surfaces (`#0A0A0C`, `#121318`, `#181920`) providing intense visual depth without harsh pure-black crushing.
- **Brand Radiance:** Signature radiant gold and yellow accents (`#F5C518`, `#D4AF37`) used selectively for brand recognition, primary conversion actions, and authenticity badges.
- **Glass & Translucency:** Layered surfaces with subtle backdrop blur (`backdrop-blur-xl`, `rgba(18, 19, 24, 0.75)`) and ultra-fine borders (`rgba(255, 255, 255, 0.08)`).
- **Tactile Collectible Cards:** Elevated, rounded cards (`rounded-2xl`) with soft ambient lighting and hover elevation.
- **Restrained Motion:** High-end, snappy micro-interactions (150ms–250ms) that feel premium and respect `prefers-reduced-motion`.

---

## 2. Color Tokens

### 2.1 Backgrounds
| Token Name | Hex / CSS Variable | Purpose |
| :--- | :--- | :--- |
| **Canvas Background** | `#0A0A0C` / `--ff-bg` | Global page body background |
| **Deep Background** | `#060708` / `--ff-bg-deep` | Footer, immersive hero backgrounds |
| **Charcoal Background** | `#0F1014` | Secondary container backgrounds |

### 2.2 Layered Surfaces
| Token Name | Hex / CSS Variable | Purpose |
| :--- | :--- | :--- |
| **Surface Default** | `#121318` / `--ff-surface` | Primary cards, list panels, modal bases |
| **Surface Elevated** | `#181920` / `--ff-surface-elevated` | Active tabs, elevated hover states, drawers |
| **Surface Soft** | `#1F212A` / `--ff-surface-soft` | Chips, segmented controls, table headers |
| **Surface Glass** | `rgba(18, 19, 24, 0.75)` | Translucent sticky headers, floating control bars |
| **Surface Input** | `#0E0F13` | Text inputs, dropdown selectors |

### 2.3 Borders & Dividers
| Token Name | Value | Purpose |
| :--- | :--- | :--- |
| **Border Default** | `rgba(255, 255, 255, 0.08)` | Standard card and container outline |
| **Border Light** | `rgba(255, 255, 255, 0.14)` | Hover borders, focus indicators |
| **Border Subtle** | `rgba(255, 255, 255, 0.04)` | Subtle row dividers inside lists |
| **Border Gold** | `rgba(245, 197, 24, 0.30)` | Active accents, featured collectible cards |

### 2.4 Brand Gold & Semantic Accents
| Token Name | Hex | Purpose |
| :--- | :--- | :--- |
| **Gold Bright** | `#F5C518` | Primary CTA buttons, star ratings, active highlights |
| **Gold Accent** | `#D4AF37` | Secondary brand accents, subtle gradient stops |
| **Gold Glow** | `rgba(245, 197, 24, 0.25)` | Glow shadows on primary interactive elements |
| **Success** | `#10B981` | In-stock badges, confirmed orders, positive status |
| **Warning** | `#F59E0B` | Low-stock counters, pending notifications |
| **Danger / Alert** | `#EF4444` | Sold out status, delete actions, validation errors |
| **Accent Purple** | `#8B5CF6` | Limited edition badges, scale indicators |
| **Accent Cyan** | `#06B6D4` | Official import badges, authenticity tags |

---

## 3. Typography System
Built on top of **Inter** (`var(--font-inter)`), optimized for high legibility across dark backgrounds.

- **Hero Display:** `text-3xl` to `text-5xl`, `font-black`, `tracking-tight`, high-contrast white.
- **Section Headings:** `text-2xl` to `text-3xl`, `font-bold`, `tracking-tight`.
- **Card Titles:** `text-sm` to `text-base`, `font-semibold`, line-clamp-2.
- **Micro-Labels:** `text-[10px]` to `text-xs`, `font-bold`, `font-mono`, `uppercase`, `tracking-widest` (`0.15em` to `0.2em`).
- **Prices:** `font-bold`, `tracking-tight`, with clear strikethrough compare-at formatting.

---

## 4. Corner Radius System
Standardized rounded geometry to create a modern, tactile feel:
- **`sm` (8px):** Tags, micro-badges, chips.
- **`md` (12px):** Buttons, small interactive elements, toast alerts.
- **`lg` (16px):** Form inputs, list items, small containers.
- **`xl` (20px):** Standard cards, product cards, modal dialogs.
- **`2xl` (24px):** Large hero containers, feature banners.
- **`full` (9999px):** Status pills, circular icon buttons, avatars.

---

## 5. Button & Action System
Every clickable element features deliberate state styling:

1. **`btn-gold` (Primary Brand Action):**
   - Background: Gradient from `#F5C518` to `#D4AF37`.
   - Text: Deep `#0A0A0C` (high contrast, ultra-bold).
   - Hover: Brightness boost (`brightness-105`), upward translation (`-translate-y-0.5`), glowing shadow (`shadow-amber-500/35`).
   - Active: Scale down (`scale-[0.98]`).
2. **`btn-primary` (Dark Elevated Action):**
   - Background: `#181920` with `border-white/12`.
   - Text: High-contrast pure white.
   - Hover: `#22242D` with `border-white/20`.
3. **`btn-secondary` (Translucent Surface Action):**
   - Background: `rgba(255, 255, 255, 0.04)` with `border-white/[0.08]`.
   - Hover: `rgba(255, 255, 255, 0.08)`.
4. **`IconButton`:**
   - 44px minimum touch target size for universal mobile compliance.
   - Circular/rounded-square options with badge counts and accessible `aria-label`.

---

## 6. Micro-Interactions & Animation Rules
- **Duration:** 150ms–250ms for snappy, lag-free responsiveness.
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (smooth, natural deceleration).
- **Card Hover:** Subtle upward translation (`translate-y(-2px)`), border illumination (`border-[#F5C518]/35`), and soft glow.
- **Product Image Hover:** Scale `1.02` to `1.04` with smooth opacity transition to secondary angle where available.
- **Reduced Motion:** All transitions gracefully disable or reduce under `prefers-reduced-motion: reduce`.

---

## 7. Accessibility & Mobile Standards
- **Minimum Touch Target:** >= 44px x 44px for all mobile interactive targets.
- **Contrast Ratios:** Primary text on `#0A0A0C` canvas achieves > 15:1 contrast (WCAG AAA compliant).
- **Focus Rings:** High-visibility amber focus ring (`focus-visible:ring-2 focus-visible:ring-[#F5C518]/50`).
- **Semantic HTML:** Native `<button>`, `<input>`, `<dialog>`, and `<nav>` elements with descriptive ARIA attributes.
