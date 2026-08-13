# FictionFigure — Database Schema Specification

This document defines the complete PostgreSQL relational database schema for **FictionFigure**.

---

## 1. Relational Entity ERD Overview

```text
 User ───────< Address
  │
  ├──────────< Order ──────────< OrderItem ───> ProductVariant ───> Product ───> Category
  │              │
  │              ├─────────────> Payment
  │              └─────────────> Coupon
  │
  ├──────────< Cart ───────────< CartItem ────> ProductVariant
  │
  ├──────────< Wishlist ───────< WishlistItem ─> Product
  │
  ├──────────< Review ─────────────────────────> Product
  │
  └──────────< Conversation ───< ChatMessage
```

---

## 2. Entity Definitions

### 2.1 User & Auth Entities
- **`User`**: `id`, `email` (unique), `passwordHash`, `firstName`, `lastName`, `phone`, `role` (`CUSTOMER` | `ADMIN`), `createdAt`, `updatedAt`.
- **`Role`**: Enum (`CUSTOMER`, `ADMIN`).
- **`Address`**: `id`, `userId`, `fullName`, `streetAddress`, `apartment`, `city`, `state`, `postalCode`, `country`, `phone`, `isDefault`, `createdAt`.

### 2.2 Catalog & Product Entities
- **`Category`**: `id`, `name`, `slug` (unique), `description`, `imageUrl`, `parentId`, `createdAt`.
- **`Product`**: `id`, `name`, `slug` (unique), `brand`, `shortDescription`, `description`, `price`, `compareAtPrice`, `costPrice`, `sku`, `categoryId`, `status` (`DRAFT` | `ACTIVE` | `ARCHIVED`), `featured`, `rating`, `reviewCount`, `material`, `scale`, `franchise`, `createdAt`, `updatedAt`.
- **`ProductImage`**: `id`, `productId`, `url`, `altText`, `sortOrder`, `isPrimary`.
- **`ProductVariant`**: `id`, `productId`, `title` (e.g. "1/6 Scale - Classic Edition"), `sku` (unique), `price`, `compareAtPrice`, `inventoryCount`, `imageUrl`, `createdAt`.
- **`VariantOption`**: `id`, `variantId`, `name` (e.g. "Scale", "Color"), `value` (e.g. "1/6 Scale", "Metallic Black").

### 2.3 Inventory Management
- **`Inventory`**: `id`, `variantId` (unique), `quantity`, `reservedQuantity`, `lowStockThreshold`.
- **`InventoryTransaction`**: `id`, `inventoryId`, `type` (`RESTOCK` | `ORDER_DEDUCTION` | `RETURN` | `ADJUSTMENT`), `changeQuantity`, `previousQuantity`, `newQuantity`, `reason`, `createdAt`.

### 2.4 Cart & Wishlist Entities
- **`Cart`**: `id`, `userId` (optional for guests), `guestToken` (optional), `createdAt`, `updatedAt`.
- **`CartItem`**: `id`, `cartId`, `variantId`, `quantity`, `createdAt`.
- **`Wishlist`**: `id`, `userId` (unique), `createdAt`.
- **`WishlistItem`**: `id`, `wishlistId`, `productId`, `createdAt`.

### 2.5 Order & Payment Engine
- **`Order`**: `id`, `orderNumber` (unique string e.g. `FF-1001`), `userId`, `status` (`PENDING` | `PROCESSING` | `SHIPPED` | `DELIVERED` | `CANCELLED`), `subtotal`, `discountAmount`, `shippingAmount`, `taxAmount`, `totalAmount`, `shippingAddressJson`, `shippingMethod`, `trackingNumber`, `couponId`, `createdAt`, `updatedAt`.
- **`OrderItem`**: `id`, `orderId`, `productId`, `variantId`, `title`, `sku`, `price`, `quantity`, `total`.
- **`Payment`**: `id`, `orderId`, `paymentMethod` (`CREDIT_CARD` | `UPI` | `RAZORPAY`), `transactionRef`, `status` (`PENDING` | `PAID` | `FAILED`), `amount`, `createdAt`.
- **`Coupon`**: `id`, `code` (unique), `discountType` (`PERCENTAGE` | `FIXED`), `discountValue`, `minOrderValue`, `maxUsage`, `usedCount`, `startDate`, `endDate`, `isActive`, `createdAt`.

### 2.6 Social & AI Assistant Entities
- **`Review`**: `id`, `productId`, `userId`, `authorName`, `rating` (1 to 5), `title`, `comment`, `createdAt`.
- **`Conversation`**: `id`, `userId` (optional), `guestToken` (optional), `createdAt`, `updatedAt`.
- **`ChatMessage`**: `id`, `conversationId`, `sender` (`USER` | `ASSISTANT` | `SYSTEM`), `content`, `metadataJson`, `createdAt`.
- **`Notification`**: `id`, `userId`, `title`, `message`, `read`, `createdAt`.

---

## 3. Prisma Schema Reference Structure

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  CUSTOMER
  ADMIN
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
}

enum DiscountType {
  PERCENTAGE
  FIXED
}
```
