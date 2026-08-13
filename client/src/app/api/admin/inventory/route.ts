import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { variantId, adjustment, reason } = await req.json();

    if (!variantId || typeof adjustment !== "number") {
      return NextResponse.json({ error: "Variant ID and adjustment quantity are required" }, { status: 400 });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { inventory: true },
    });

    if (!variant) {
      return NextResponse.json({ error: "Product variant not found" }, { status: 404 });
    }

    const newStock = Math.max(0, variant.inventoryCount + adjustment);

    const updated = await prisma.$transaction(async (tx) => {
      const updatedVariant = await tx.productVariant.update({
        where: { id: variantId },
        data: { inventoryCount: newStock },
      });

      if (variant.inventory) {
        await tx.inventory.update({
          where: { id: variant.inventory.id },
          data: { quantity: newStock },
        });

        await tx.inventoryTransaction.create({
          data: {
            inventoryId: variant.inventory.id,
            type: adjustment > 0 ? "RESTOCK" : "ADJUSTMENT",
            changeQuantity: adjustment,
            previousQuantity: variant.inventoryCount,
            newQuantity: newStock,
            reason: reason || "Manual admin inventory adjustment",
          },
        });
      }

      return updatedVariant;
    });

    return NextResponse.json({ success: true, variant: updated });
  } catch (error: any) {
    console.error("API /api/admin/inventory error:", error);
    return NextResponse.json({ error: error.message || "Failed to adjust inventory" }, { status: 500 });
  }
}
