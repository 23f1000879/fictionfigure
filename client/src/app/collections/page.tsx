import React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { getProducts, getCategories } from "@/lib/services/productService";
import { CollectionListingView } from "@/components/collection/CollectionListingView";

export const revalidate = 60;

interface CollectionsPageProps {
  searchParams?: Promise<Record<string, string | undefined>>;
}

export const metadata: Metadata = {
  title: "All Collections & Categories | FICTIONFIGURE",
  description: "Explore all authentic anime figure collections, manga, keychains, posters, and apparel in the FICTIONFIGURE catalog.",
  alternates: {
    canonical: "https://www.fictionfigures.in/collections",
  },
};

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const resolvedParams = ((await searchParams) || {}) as Record<string, string | undefined>;

  const filters = {
    category: resolvedParams.category,
    brand: resolvedParams.brand,
    franchise: resolvedParams.franchise,
    minPrice: resolvedParams.minPrice ? Number(resolvedParams.minPrice) : undefined,
    maxPrice: resolvedParams.maxPrice ? Number(resolvedParams.maxPrice) : undefined,
    inStockOnly: resolvedParams.inStockOnly === "true",
    sortBy: (resolvedParams.sortBy as any) || "newest",
    page: resolvedParams.page ? Number(resolvedParams.page) : 1,
    limit: 12,
  };

  const { products, totalCount, totalPages, currentPage, categories, brands, franchises } =
    await getProducts(filters);

  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="flex-1 bg-[#F7F7F5] min-h-screen">
        <CollectionListingView
          title="ALL COLLECTIONS & CATEGORIES"
          eyebrow="CATALOG EXPLORER"
          description="Browse curated scale figures, statues, manga, posters, and apparel across all FICTIONFIGURE collections."
          baseUrl="/collections"
          products={products}
          totalCount={totalCount}
          totalPages={totalPages}
          currentPage={currentPage}
          categories={categories}
          brands={brands}
          franchises={franchises}
        />
      </main>

      <Footer />
    </>
  );
}
