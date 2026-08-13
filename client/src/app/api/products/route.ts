import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/services/productService";
import { productFilterSchema } from "@/lib/schemas/product";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;
    const category = searchParams.get("category") || undefined;
    const brand = searchParams.get("brand") || undefined;
    const franchise = searchParams.get("franchise") || undefined;
    const material = searchParams.get("material") || undefined;
    const scale = searchParams.get("scale") || undefined;
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const inStockOnly = searchParams.get("inStockOnly") === "true";
    const featuredOnly = searchParams.get("featuredOnly") === "true";
    const sortBy = (searchParams.get("sortBy") as any) || "featured";
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 12;

    const validatedFilters = productFilterSchema.parse({
      query,
      category,
      brand,
      franchise,
      material,
      scale,
      minPrice,
      maxPrice,
      inStockOnly,
      featuredOnly,
      sortBy,
      page,
      limit,
    });

    const result = await getProducts(validatedFilters);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API /api/products error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 400 }
    );
  }
}
