# FictionFigure — Application Flows

This document details all primary user and administrator workflows within the **FictionFigure** platform.

---

## 1. Customer Discovery & Shopping Flow

```
Homepage (/) 
   │
   ├─► Global Navigation Search / Search Modal
   ├─► Category Showcase (/categories/:slug)
   └─► Product Catalog (/shop)
          │
          ├─► Filters: Category, Price, Availability, Brand, Franchise, Material, Rating
          ├─► Sorting: Featured, Newest, Popular, Price Low-High, Price High-Low
          └─► Select Product Card
                 │
                 ▼
         Product Detail Page (/products/:slug)
                 │
                 ├─► View High-Res Image Gallery & Zoom
                 ├─► Select Scale / Color Variant
                 ├─► Check Live Stock & SKU
                 ├─► Add to Wishlist / Move to Cart
                 └─► Click "Add to Cart" or "Buy Now"
                         │
                         ▼
                 Cart Drawer / Cart Page (/cart)
```

---

## 2. Cart & Checkout Flow

```
Cart Drawer / Page (/cart)
   │
   ├─► Modify Quantities / Remove Items
   ├─► Apply Promo Code (e.g. WELCOME10)
   ├─► Server validates prices & applies discount
   └─► Click "Proceed to Checkout"
          │
          ▼
Checkout (/checkout) — Distraction-free (No main nav header)
   │
   ├─► Step 1: Contact Information (Email, Phone)
   ├─► Step 2: Shipping Address (Name, Street, City, State, ZIP, Country)
   ├─► Step 3: Delivery Options (Standard vs. Express)
   ├─► Step 4: Payment Selection (Credit Card / UPI / Provider Abstraction)
   └─► Step 5: Review & Place Order
          │
          ▼
   [Server Transaction Engine]
   ├─ 1. Recalculates subtotal, shipping, tax, discounts
   ├─ 2. Verifies inventory sufficiency
   ├─ 3. Decrements inventory count & creates InventoryTransaction log
   ├─ 4. Creates Order & OrderItem records
   ├─ 5. Emits payment receipt reference
   └─ 6. Returns Order ID
          │
          ▼
Order Confirmation Page (/order/:id)
   ├─ Display Order Summary, Delivery Address, Status Badge
   └─ Provide "Track Order" and "Continue Shopping" CTA buttons
```

---

## 3. Customer Account & Order Tracking Flow

```
Customer Account (/account)
   │
   ├─► Overview: Recent Order status, Wishlist count summary
   ├─► Orders (/account/orders): Filterable order list with status badges
   ├─► Order Detail (/account/orders/:id): Full timeline view
   ├─► Addresses (/account/addresses): Add/Edit/Delete shipping addresses
   ├─► Wishlist (/account/wishlist): View saved figures & move to cart
   ├─► Profile (/account/profile): Name, Email, Phone editing
   └─► Settings (/account/settings): Security & Notifications
```

---

## 4. AI Shopping Assistant Workflow

```
Floating Assistant Widget (Bottom-Right)
   │
   ├─► User asks: "Recommend an anime figure under ₹10,000"
   │      │
   │      ▼
   │   AI Service calls backend `searchProducts({ maxPrice: 10000, category: "Anime Figures" })`
   │      │
   │      ▼
   │   Returns structured product list with live thumbnails & buy links
   │
   ├─► User asks: "Where is my order #FF-1002?"
   │      │
   │      ▼
   │   AI Service checks authenticated customer context & calls `getOrderStatus("FF-1002")`
   │      │
   │      ▼
   │   Returns live fulfillment step (e.g. "Shipped via Standard Air on Aug 10")
   │
   └─► User asks: "What is your return policy?"
          │
          ▼
       AI Service queries `getStorePolicy("returns")` & returns verified policy answer
```

---

## 5. Admin Management Workflows

```
Admin Dashboard (/admin)
   │
   ├─► Metrics Overview: Total Revenue, Orders, Pending, Stock Alerts
   ├─► Revenue & Orders Sales Chart
   │
   ├─► Products Management (/admin/products)
   │      ├─ Product List with SKU, Price, Stock & Status
   │      ├─ Product Creation (/admin/products/new)
   │      ├─ Product Editing (/admin/products/:id/edit) with Variant Builder
   │      └─ Inventory Management (/admin/inventory) with Quick Stock +/- adjustments
   │
   ├─► Order Fulfillment (/admin/orders)
   │      ├─ Order Table with status filtering
   │      └─ Order Detail (/admin/orders/:id): Change status (Pending → Processing → Shipped → Delivered)
   │
   ├─► Category Management (/admin/categories): CRUD for storefront taxonomy
   ├─► Discount Management (/admin/discounts): Code creation, percentage/fixed savings, thresholds
   ├─► Customer Management (/admin/customers): View accounts and lifetime values
   └─► Analytics (/admin/analytics): Sales, conversion metrics, best sellers
```
