# FictionFigure — System Architecture

This document describes the high-level system architecture, service components, module boundaries, and data flow of the **FictionFigure** platform.

---

## 1. System Topology

```text
                               FictionFigure Architecture
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
          Storefront Frontend                             Admin Dashboard
        (React 18 / Next.js SSR)                       (React 18 / Protected RSC)
                     │                                             │
                     └──────────────────────┬──────────────────────┘
                                            │
                                   Type-Safe API Layer
                             (Next.js App Router API + Zod)
                                            │
           ┌──────────────────┬─────────────┼─────────────┬──────────────────┐
           ▼                  ▼             ▼             ▼                  ▼
     Product Service    Order Service  User Auth    Inventory Service  AI Assistant Service
           │                  │             │             │                  │
           └──────────────────┴─────────────┼─────────────┴──────────────────┘
                                            │
                                      Prisma ORM
                                            │
                                            ▼
                                  PostgreSQL Database
                                            │
                                   External Service Layer
                           ┌────────────────┼────────────────┐
                           ▼                ▼                ▼
                     S3 Storage     Payment Gateways     LLM Engine
                     Abstraction      (Stripe/UPI)       (OpenAI/Gemini)
```

---

## 2. Component Boundaries & Layering

### 2.1 Presentation Layer (`/src/app` & `/src/components`)
- **Storefront Components (`/src/components/storefront`)**: Header, Footer, Hero, CategoryGrid, FeaturedSection, Newsletter.
- **Product Components (`/src/components/product`)**: ProductCard, ProductGrid, ProductGallery, VariantSelector, ProductFilters, PriceDisplay.
- **Cart & Checkout (`/src/components/cart`, `/src/components/checkout`)**: CartDrawer, CartItem, CheckoutForm, OrderSummary.
- **Customer Account (`/src/components/account`)**: AccountSidebar, OrderHistoryTable, AddressBook, ProfileEditor.
- **Admin Dashboard (`/src/components/admin`)**: AdminSidebar, MetricsCard, SalesChart, DataTable, InventoryAdjuster, OrderStatusTimeline.
- **AI Widget (`/src/components/ai`)**: AIChatDrawer, QuickPromptPill, ProductRecommendationCard.

### 2.2 Application Services Layer (`/src/lib/services` or `/src/server/services`)
- **`productService`**: Queries categories, products, images, variants, applies search/filter criteria.
- **`cartService`**: Manages cart session persistence and item validation.
- **`orderService`**: Executes order transactions, validates totals, handles inventory locking and status updates.
- **`inventoryService`**: Audits stock levels, logs inventory adjustments, flags low-stock items.
- **`discountService`**: Evaluates coupon code validity, minimum cart thresholds, and expiry dates.
- **`authService`**: Handles user authentication, password hashing (bcrypt), token/session management, role checks.
- **`aiService`**: Dispatches system prompt context with tool definitions to LLM and executes data lookup tools safely.

### 2.3 Data Access & Persistence Layer (`/src/lib/db`)
- **Prisma Client**: Provides type-safe SQL query generation for PostgreSQL.
- **Db Seeder (`/prisma/seed.ts`)**: Populates realistic initial catalog, brands, variants, admin/customer credentials, and orders.

---

## 3. Directory Layout Standard

```text
e:/anime_website/
├── docs/                     # Architectural documentation (Phase 0)
│   ├── decision.md
│   ├── flow.md
│   ├── architecture.md
│   ├── database.md
│   ├── design-system.md
│   ├── progress.md
│   └── testing.md
├── prisma/                   # Database schema & migrations
│   ├── schema.prisma
│   └── seed.ts
├── public/                   # Public static assets & uploads
│   └── images/
├── src/
│   ├── app/                  # Next.js App Router Pages & API routes
│   │   ├── (storefront)/     # Main storefront public layout & pages
│   │   ├── (auth)/           # /login, /signup, /forgot-password
│   │   ├── account/          # /account/* customer dashboard
│   │   ├── admin/            # /admin/* management dashboard
│   │   └── api/              # Backend REST / RPC endpoints
│   ├── components/           # Reusable UI components
│   │   ├── ui/               # Base primitives (Button, Input, Modal, Badge, Toast, Drawer)
│   │   ├── storefront/       # Header, Footer, Hero, Newsletter
│   │   ├── product/          # Card, Grid, Gallery, VariantSelector
│   │   ├── cart/             # Drawer, Item, Subtotal
│   │   ├── checkout/         # Multi-step checkout forms
│   │   ├── admin/            # Data tables, Charts, Form Editors
│   │   └── ai/               # Chat floating widget & assistant
│   ├── lib/                  # Services, DB client, Zod schemas, Utilities
│   │   ├── db/               # Prisma client singletons
│   │   ├── services/         # Domain business logic
│   │   ├── schemas/          # Zod validation schemas
│   │   ├── auth/             # Session & JWT utilities
│   │   └── utils.ts          # Formatting, currency, classnames
│   └── types/                # Global TypeScript definitions
```
