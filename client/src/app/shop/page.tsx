import React, { Suspense } from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductFilters } from "@/components/product/ProductFilters";
import { getProducts, getCategories, getBrandsAndMetadata } from "@/lib/services/productService";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/context/CartContext";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpDown } from "lucide-react";

export const revalidate = 60; // 60s Vercel Edge ISR Cache for Catalog

interface ShopPageProps {
  searchParams?: any;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const resolvedParams = ((await searchParams) || {}) as Record<string, string | undefined>;

  const filters = {
    query: resolvedParams.query,
    category: resolvedParams.category,
    brand: resolvedParams.brand,
    franchise: resolvedParams.franchise,
    material: resolvedParams.material,
    scale: resolvedParams.scale,
    minPrice: resolvedParams.minPrice ? Number(resolvedParams.minPrice) : undefined,
    maxPrice: resolvedParams.maxPrice ? Number(resolvedParams.maxPrice) : undefined,
    inStockOnly: resolvedParams.inStockOnly === "true",
    featuredOnly: resolvedParams.featuredOnly === "true",
    sortBy: (resolvedParams.sortBy as any) || "featured",
    page: resolvedParams.page ? Number(resolvedParams.page) : 1,
    limit: 12,
  };

  const { products, totalCount, totalPages, currentPage, categories, brands, franchises } =
    await getProducts(filters);

  const activeCategoryObj = categories.find((c: any) => c.slug === filters.category);
  const formattedCountText =
    totalCount === 1 ? "1 Product" : totalCount === 0 ? "No Products" : `${totalCount} Products`;

  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="editorial-container py-12 text-[#111111]">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 mb-8 border-b border-[#E5E5E2] gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-2">
              <Link href="/" className="hover:text-[#111111]">
                Home
              </Link>
              <span>/</span>
              <span className="text-[#111111]">Shop</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#111111] tracking-tight">
              {activeCategoryObj ? activeCategoryObj.name : "All Figures & Collectibles"}
            </h1>
            <p className="text-xs text-[#6B6B6B] mt-1 max-w-lg">
              {activeCategoryObj?.description ||
                "Curated museum-grade statues, anime scale figures, designer toys, and articulated pieces."}
            </p>
          </div>

          {/* Sort Selector & Product Count Header */}
          <div className="flex items-center justify-between md:justify-end gap-4 text-xs">
            <span className="text-[#6B6B6B] font-mono font-semibold">{formattedCountText}</span>

            {/* Sort Controls */}
            <div className="flex items-center space-x-2 bg-white border border-[#E5E5E2] px-3 py-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span className="text-[#6B6B6B] uppercase font-semibold text-[10px]">Sort:</span>
              <form action="/shop" method="GET" className="inline">
                {filters.category && <input type="hidden" name="category" value={filters.category} />}
                {filters.brand && <input type="hidden" name="brand" value={filters.brand} />}
                {filters.franchise && <input type="hidden" name="franchise" value={filters.franchise} />}
                {filters.inStockOnly && <input type="hidden" name="inStockOnly" value="true" />}
                {filters.minPrice && <input type="hidden" name="minPrice" value={filters.minPrice} />}
                {filters.maxPrice && <input type="hidden" name="maxPrice" value={filters.maxPrice} />}
                <select
                  name="sortBy"
                  defaultValue={filters.sortBy}
                  className="bg-transparent font-semibold text-[#111111] focus:outline-none cursor-pointer text-xs"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name_asc">Name: A-Z</option>
                </select>
              </form>
            </div>
          </div>
        </div>

        {/* Catalog Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block space-y-6">
            <Suspense fallback={<div className="text-xs text-[#6B6B6B]">Loading filters...</div>}>
              <ProductFilters
                categories={categories}
                brands={brands}
                franchises={franchises}
              />
            </Suspense>
          </aside>

          {/* Product Grid Container */}
          <div className="space-y-8">
            {products.length === 0 ? (
              <div className="text-center py-20 bg-white border border-[#E5E5E2] p-8 space-y-4">
                <h3 className="text-base font-semibold text-[#111111]">
                  NO FIGURES FOUND
                </h3>
                <p className="text-xs text-[#6B6B6B] max-w-md mx-auto">
                  We couldn't find any collectibles matching your selected filters. Try resetting filters or searching for another character.
                </p>
                <Link
                  href="/shop"
                  className="inline-block px-6 py-2.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black transition-colors"
                >
                  Clear Filters & View All
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {products.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-8 border-t border-[#E5E5E2] text-xs">
                {currentPage > 1 ? (
                  <Link
                    href={`/shop?${new URLSearchParams({
                      ...resolvedParams,
                      page: String(currentPage - 1),
                    }).toString()}`}
                    className="flex items-center px-4 py-2 border border-[#E5E5E2] text-[#111111] hover:border-[#111111] font-semibold uppercase tracking-wider"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Previous
                  </Link>
                ) : (
                  <span className="opacity-40 cursor-not-allowed flex items-center px-4 py-2 border border-[#E5E5E2] text-[#6B6B6B] uppercase font-semibold">
                    <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Previous
                  </span>
                )}

                <span className="font-mono text-[#6B6B6B]">
                  Page {currentPage} of {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Link
                    href={`/shop?${new URLSearchParams({
                      ...resolvedParams,
                      page: String(currentPage + 1),
                    }).toString()}`}
                    className="flex items-center px-4 py-2 border border-[#E5E5E2] text-[#111111] hover:border-[#111111] font-semibold uppercase tracking-wider"
                  >
                    Next <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </Link>
                ) : (
                  <span className="opacity-40 cursor-not-allowed flex items-center px-4 py-2 border border-[#E5E5E2] text-[#6B6B6B] uppercase font-semibold">
                    Next <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
