import { prisma } from "@/lib/db/prisma";

export async function aiSearchProducts(query?: string, categorySlug?: string, maxPrice?: number) {
  const where: any = { status: "ACTIVE" };

  if (query) {
    where.OR = [
      { name: { contains: query } },
      { description: { contains: query } },
      { brand: { contains: query } },
      { franchise: { contains: query } },
    ];
  }

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (maxPrice) {
    where.price = { lte: maxPrice };
  }

  const products = await prisma.product.findMany({
    where,
    take: 5,
    orderBy: { rating: "desc" },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: { select: { title: true, price: true, inventoryCount: true } },
    },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    price: p.price,
    category: p.category.name,
    rating: p.rating,
    imageUrl: p.images[0]?.url,
    inStock: p.variants.some((v) => v.inventoryCount > 0),
  }));
}

export async function aiGetOrderStatus(orderNumber: string) {
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ orderNumber: orderNumber.trim() }, { id: orderNumber.trim() }],
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    return { found: false, message: `No order record found for order identifier ${orderNumber}.` };
  }

  return {
    found: true,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: order.totalAmount,
    shippingMethod: order.shippingMethod,
    trackingNumber: order.trackingNumber || "Assigned upon dispatch",
    itemCount: order.items.length,
    date: order.createdAt,
  };
}

export function aiGetStorePolicy(policyType: string) {
  const lower = policyType.toLowerCase();

  if (lower.includes("return") || lower.includes("refund")) {
    return "FictionFigure offers a 14-day hassle-free return window for unopened collector items in their original factory seal. Damaged or defective statues are replaced free of charge with priority courier handling.";
  }

  if (lower.includes("ship") || lower.includes("delivery")) {
    return "Standard insured ground shipping takes 3–5 business days across India (Free on orders above ₹10,000). Express Air Shipping delivers in 24–48 hours for a flat fee of ₹500.";
  }

  if (lower.includes("authent") || lower.includes("real") || lower.includes("fake")) {
    return "Every figure and statue sold on FictionFigure is 100% authentic, directly sourced from licensed manufacturers (AetherArts, Kurogane Atelier, Mythos Craft, Ironclad). Includes tamper-proof holographic seal of authenticity.";
  }

  return "FictionFigure is a premium online destination for curated figures, statues, and limited-edition designer toys. All orders are packed in reinforced double-walled collector boxes.";
}
