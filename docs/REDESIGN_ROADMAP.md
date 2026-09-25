# FICTIONFIGURE — Complete Frontend Redesign Roadmap
**Strategic Goal:** Transform the entire FICTIONFIGURE storefront into a cinematic, dark anime-commerce sanctuary with collectible-card aesthetics, maintaining 100% backend, database, and business logic integrity.

---

## Migration Phases Overview

```
Phase 8.0: Design Foundation & Token Architecture (CURRENT)
   ↓
Phase 8.1: Global Shell, Header & Navigation
   ↓
Phase 8.2: Cinematic Homepage & Hero Overhaul
   ↓
Phase 8.3: Shop, Collections & Series Catalog
   ↓
Phase 8.4: Collectible Product Detail Page (PDP)
   ↓
Phase 8.5: Slide-out Cart Drawer & Full Cart Experience
   ↓
Phase 8.6: Streamlined Checkout & Payment Confirmation
   ↓
Phase 8.7: Collector Account, Orders & Shipment Tracking
   ↓
Phase 8.8: Vault Wishlist & Instant Real-Time Search
   ↓
Phase 8.9: Final Responsive Matrix, Performance & Accessibility Polish
```

---

## Detailed Phase Breakdown

### Phase 8.0 — Design Foundation (Current Phase)
- Establish centralized dark theme tokens (`#0A0A0C`, `#121318`, `#181920`, `#F5C518`).
- Configure Tailwind design tokens, typography hierarchy, and standardized border radii (`8px` to `24px`).
- Create core reusable component library (`Button`, `IconButton`, `Badge`, `Card`, `Input`, `Skeleton`, `EmptyState`, `Tabs`).
- Redesign `ProductCard` into a dark elevated collectible card foundation.
- Create `/design-system` interactive showcase route.
- Author `docs/DESIGN_SYSTEM.md` and `docs/REDESIGN_ROADMAP.md`.

### Phase 8.1 — Global Shell & Navigation
- Rebuild `Header.tsx` with sticky translucent dark glass (`backdrop-blur-xl`, `rgba(18, 19, 24, 0.75)`).
- Redesign the Announcement Bar with rotating CMS messages and gold accents.
- Modernize `Footer.tsx` with rich brand storytelling, newsletter subscription, and clear trust badges.
- Deliver an animated mobile drawer navigation with high-touch 48px targets.

### Phase 8.2 — Homepage Experience
- Implement dynamic hero banner with cinematic poster artwork and radiant CTA buttons.
- Modernize Featured Figures horizontal reel / grid.
- Implement Anime Series Collections showcase with large collectible artwork cards.
- Refresh "Fresh Drops for Collectors" promotional spotlight and "Join the Collector's Club" newsletter card.

### Phase 8.3 — Shop & Collection Catalog
- Redesign `/shop` and `/collections/[slug]` pages with dark collectible grid layouts.
- Modernize filter drawer & desktop sidebar (Scale, Anime Series, Stock Status, Price Range).
- Implement dark sort dropdowns and result count indicators.

### Phase 8.4 — Product Detail Page (PDP)
- Implement cinematic product image gallery with thumbnail rail, zoom lens, and multi-angle viewer.
- Create rich specification cards (Scale, Dimensions, Series, Manufacturer, Sculptor, Authenticity Guarantee).
- Redesign Generic Variant selectors, stock status alerts, and sticky bottom bar for mobile.
- Modernize Product Reviews with star ratings and verified buyer badges.

### Phase 8.5 — Cart Experience
- Redesign slide-out `CartDrawer.tsx` with dark glass container, free shipping meter, and line item cards.
- Redesign full `/cart` page with quantity steppers, discount code input, and order summary.

### Phase 8.6 — Checkout & Payment
- Modernize checkout steps (Shipping Address, Payment Method, Order Review).
- Ensure seamless visual integration with Razorpay modal and COD flows.
- Redesign `/order/[id]` confirmation and tracking page.

### Phase 8.7 — Customer Account & Orders
- Redesign `/account` entry sanctuary with editorial quick links and recent orders.
- Modernize `/account/orders` and `/account/orders/[id]` with visual shipment timeline and tracking details.
- Modernize `/account/addresses` and `/account/profile` with sleek dark form surfaces.

### Phase 8.8 — Wishlist & Search
- Modernize `/account/wishlist` with instant add-to-cart and stock notifications.
- Implement real-time search overlay modal with instant product previews, series tags, and recent searches.

### Phase 8.9 — Final Responsive & Accessibility Polish
- Comprehensive verification across 320px–430px mobile, 768px–1024px tablet, and 1280px–1920px desktop viewports.
- Lighthouse performance, contrast ratios, keyboard navigation, and reduced-motion audits.

---

## Strict Implementation Safeguards
1. **Zero Database Mutations:** Production database schema and existing data remain untouched throughout all phases.
2. **Preserve Real CMS Integration:** All content (banners, slides, announcements, categories, products) continues to be fed dynamically from existing backend APIs.
3. **Continuous Build Validation:** Every phase must pass `npm run build:client` with zero TypeScript or React errors.
