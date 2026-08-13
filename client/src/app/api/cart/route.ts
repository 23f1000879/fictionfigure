import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCart, addItemToCart, updateCartItemQuantity, removeCartItem } from "@/lib/services/cartService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get("fictionfigure_session")?.value;
    const { searchParams } = new URL(req.url);
    const guestToken = searchParams.get("guestToken") || "guest-default";

    const cart = await getOrCreateCart(userId, guestToken);
    return NextResponse.json({ success: true, cart });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch cart" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get("fictionfigure_session")?.value;
    const body = await req.json();

    const cart = await addItemToCart({
      variantId: body.variantId,
      quantity: body.quantity || 1,
      userId,
      guestToken: body.guestToken || "guest-default",
    });

    return NextResponse.json({ success: true, cart });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add to cart" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { cartItemId, quantity } = await req.json();
    await updateCartItemQuantity(cartItemId, quantity);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update cart" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cartItemId = searchParams.get("cartItemId");
    if (!cartItemId) return NextResponse.json({ error: "cartItemId required" }, { status: 400 });

    await removeCartItem(cartItemId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to remove item" }, { status: 400 });
  }
}
