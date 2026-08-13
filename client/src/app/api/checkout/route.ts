import { NextRequest, NextResponse } from "next/server";
import { createOrderFromCheckout } from "@/lib/services/orderService";
import { checkoutFormSchema } from "@/lib/schemas/cart";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = checkoutFormSchema.parse(body.checkoutInput);
    const guestToken = body.guestToken || undefined;

    const order = await createOrderFromCheckout({
      checkoutInput: validatedData,
      guestToken,
    });

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
      totalAmount: order.totalAmount,
    });
  } catch (error: any) {
    console.error("API /api/checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process order checkout" },
      { status: 400 }
    );
  }
}
