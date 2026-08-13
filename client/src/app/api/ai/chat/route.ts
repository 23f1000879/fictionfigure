import { NextRequest, NextResponse } from "next/server";
import { aiSearchProducts, aiGetOrderStatus, aiGetStorePolicy } from "@/lib/services/aiService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message string required" }, { status: 400 });
    }

    const lower = message.toLowerCase();

    // 1. Order Tracking Query
    if (lower.includes("order") || lower.includes("ff-") || lower.includes("tracking") || lower.includes("status")) {
      const match = message.match(/ff-\d+/i) || message.match(/\b\d{4}\b/);
      const orderNum = match ? match[0].toUpperCase() : "FF-1001";
      const orderInfo = await aiGetOrderStatus(orderNum);

      if (orderInfo.found) {
        return NextResponse.json({
          reply: `Order **${orderInfo.orderNumber}** is currently in **${orderInfo.status}** status. Delivered via *${orderInfo.shippingMethod}* (Tracking: ${orderInfo.trackingNumber}). Total value: ₹${orderInfo.totalAmount?.toLocaleString()}.`,
          type: "ORDER_STATUS",
          order: orderInfo,
        });
      } else {
        return NextResponse.json({
          reply: `I searched our records for order identifier **${orderNum}** but could not find a matching order. Please check your order confirmation email or format (e.g., FF-1001).`,
          type: "TEXT",
        });
      }
    }

    // 2. Policy Query
    if (lower.includes("shipping") || lower.includes("return") || lower.includes("refund") || lower.includes("authentic") || lower.includes("policy")) {
      const policyReply = aiGetStorePolicy(message);
      return NextResponse.json({
        reply: policyReply,
        type: "TEXT",
      });
    }

    // 3. Product Catalog Search & Recommendation Query
    let maxPrice: number | undefined = undefined;
    const priceMatch = lower.match(/(?:under|below|less than|max)\s*₹?\s*(\d+)/i);
    if (priceMatch && priceMatch[1]) {
      maxPrice = parseInt(priceMatch[1], 10);
    }

    let categorySlug: string | undefined = undefined;
    if (lower.includes("anime")) categorySlug = "anime-figures";
    else if (lower.includes("statue")) categorySlug = "premium-statues";
    else if (lower.includes("toy") || lower.includes("vinyl")) categorySlug = "designer-toys";
    else if (lower.includes("game")) categorySlug = "game-characters";

    const products = await aiSearchProducts(message, categorySlug, maxPrice);

    if (products.length > 0) {
      return NextResponse.json({
        reply: `Based on your request, here are top curated figures from our catalog matching your criteria:`,
        type: "PRODUCT_RECOMMENDATIONS",
        products,
      });
    } else {
      return NextResponse.json({
        reply: `I couldn't find exact matching figures for "${message}" in our active collection right now. You can explore our full catalog at /shop or browse by brand (AetherArts, Kurogane Atelier, Mythos Craft).`,
        type: "TEXT",
      });
    }
  } catch (error: any) {
    console.error("API /api/ai/chat error:", error);
    return NextResponse.json({ error: "AI Assistant service error" }, { status: 500 });
  }
}
