import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get("fictionfigure_session")?.value;
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ success: true, message: "Locally wishlisted" });
    }

    let wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId },
        include: { items: true },
      });
    }

    const existing = wishlist.items.find((item) => item.productId === productId);

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, wishlisted: false });
    } else {
      await prisma.wishlistItem.create({
        data: { wishlistId: wishlist.id, productId },
      });
      return NextResponse.json({ success: true, wishlisted: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Wishlist operation failed" }, { status: 500 });
  }
}
