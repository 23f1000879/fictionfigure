# FictionFigure — Technical Decisions

This document records the architectural and design decisions made for the **FictionFigure** e-commerce platform.

---

## Decision: Core Framework & Full-Stack Architecture

### Decision
Next.js 14 (App Router) with TypeScript, React 18, and Tailwind CSS.

### Reason
- Next.js 14 provides Server-Side Rendering (SSR), Server Components (RSC), and API route handlers in a unified project structure.
- Strong TypeScript integration ensures end-to-end type safety between database models, backend API routes, and React components.
- Excellent SEO performance through dynamic meta tag generation and server rendering for product detail pages.

### Alternatives Considered
- Vite + React SPA + Express REST API (separate repositories/servers)
- Remix

### Status
Accepted

---

## Decision: Database & ORM

### Decision
PostgreSQL with Prisma ORM.

### Reason
- Collectible commerce demands strict ACID compliance, transactional integrity (especially for order creation and inventory deduction), foreign key constraints, and relational queries across products, variants, orders, items, and inventory.
- Prisma ORM provides type-safe query generation, migration tooling, and clean seed script execution.

### Alternatives Considered
- MongoDB / Mongoose (lacks native transactional guarantees for stock decrement)
- MySQL / TypeORM

### Status
Accepted

---

## Decision: Visual Styling & Design System

### Decision
Tailwind CSS configured with a custom warm-minimalist color token scale.

### Reason
- Enables precise utility-first styling without external bloat or non-customizable component library assumptions.
- Avoids generic AI UI trends (gradient buttons, heavy glassmorphism, floating cards) by enforcing editorial color tokens (`#F7F7F5` off-white, `#111111` primary, `#6B6B6B` secondary, `#E5E5E2` borders).

### Alternatives Considered
- Tailwind default theme (too blue/indigo aligned with generic SaaS templates)
- Component libraries like Shadcn/Radix (adapted with minimal custom styling)

### Status
Accepted

---

## Decision: Server-Authoritative Price & Inventory Engine

### Decision
All cart totals, discount validations, tax calculations, shipping options, and final checkout amounts are computed strictly on the backend.

### Reason
- Prevents client-side price manipulation attacks.
- Ensures accurate inventory deduction and coupon single-use enforcement during transaction processing.

### Status
Accepted

---

## Decision: AI Shopping Assistant Architecture

### Decision
Structured LLM agent tool calling pattern (`searchProducts`, `getProduct`, `getOrderStatus`, `getStorePolicy`) with server-side validation against real database records.

### Reason
- Eliminates AI hallucination of non-existent figures, incorrect prices, or fake policies.
- Keeps assistant responses strictly grounded in seeded database context and customer account permissions.

### Status
Accepted

---

## Decision: Authentication & Authorization

### Decision
Session-based auth using standard HTTP-only cookies with JWT payloads and role-based access control (`ADMIN` vs `CUSTOMER`).

### Reason
- Protects administrative routes `/admin/*` and customer account endpoints cleanly.
- Avoids external auth dependencies that require complex third-party setup while remaining OAuth-ready.

### Status
Accepted
