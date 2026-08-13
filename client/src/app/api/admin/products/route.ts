import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { productInputSchema } from "@/lib/schemas/product";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = productInputSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        brand: validated.brand,
        shortDescription: validated.shortDescription,
        description: validated.description,
        price: validated.price,
        compareAtPrice: validated.compareAtPrice || null,
        costPrice: validated.costPrice || null,
        sku: validated.sku,
        categoryId: validated.categoryId,
        status: validated.status,
        featured: validated.featured,
        material: validated.material || null,
        scale: validated.scale || null,
        franchise: validated.franchise || null,
        images: {
          create: validated.images.map((url, idx) => ({
            url,
            altText: `${validated.name} View ${idx + 1}`,
            sortOrder: idx,
            isPrimary: idx === 0,
          })),
        },
        variants: {
          create: validated.variants.map((v) => ({
            title: v.title,
            sku: v.sku,
            price: v.price,
            compareAtPrice: v.compareAtPrice || null,
            inventoryCount: v.inventoryCount,
            imageUrl: v.imageUrl || validated.images[0],
            inventory: {
              create: {
                quantity: v.inventoryCount,
                reservedQuantity: 0,
                lowStockThreshold: 3,
              },
            },
          })),
        },
      },
      include: {
        images: true,
        variants: true,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("API /api/admin/products error:", error);
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("id");

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
}
