# FictionFigure — Testing & QA Verification Plan

This document details the test matrix and verification criteria required for **FictionFigure**.

---

## 1. Storefront Test Matrix

| Flow / Component | Test Objective | Expected Result |
| :--- | :--- | :--- |
| **Global Navigation** | Test links, search modal trigger, cart drawer open | Clean overlay transitions, search opens with autofocus |
| **Catalog Filter** | Apply Category, Price range, Brand filters | Product grid updates dynamically with match count |
| **Product Detail** | Switch variant (Scale/Color) | SKU, Price, Inventory status update instantly |
| **Cart Operations** | Add item, increase qty, delete item, apply coupon | Subtotal updates via server calculation, drawer reflects exact count |
| **Checkout Process** | Fill multi-step form, validate inputs, submit order | Form enforces mandatory fields; server creates order and returns order ID |
| **Customer Account** | View order history, update address, edit profile | Reflects database state without page refreshes |
| **AI Assistant** | Ask product query, check order #FF-1001, policy question | Returns real catalog figures, live order status, verified return rules |

---

## 2. Admin Test Matrix

| Section | Test Objective | Expected Result |
| :--- | :--- | :--- |
| **Admin Authorization** | Attempt access to `/admin` as guest or customer | Redirected to `/login` with access denied toast |
| **Metrics & Analytics** | Change range filter (7d / 30d / 90d) | Charts and KPIs update accurately |
| **Product CRUD** | Add new product with variants and images, edit existing product | Product appears immediately on `/admin/products` and storefront `/shop` |
| **Order Management** | Change order status (Processing -> Shipped) | Status badge updates, order timeline logs timestamp |
| **Inventory Adjuster** | Perform stock adjustment (+10 or -5) | Inventory count updates, transaction recorded |
| **Discounts** | Create new promo code `SUMMER20` | Coupon usable at checkout and validates threshold |

---

## 3. Performance & Responsive Quality Bar

- **Mobile Viewports (375px - 430px)**: Zero horizontal scrolling, touch-friendly tap targets (>44px), collapsible filter sheet.
- **Tablet Viewports (768px - 1024px)**: 3-column product grid, responsive table views.
- **Desktop Viewports (1280px - 1440px)**: 4-column product grid, 1340px centered container, crisp 1px borders.
