import React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { getProducts, getCategories } from "@/lib/services/productService";
import { titleCase } from "@/lib/seo";
import { CollectionListingView } from "@/components/collection/CollectionListingView";

export const revalidate = 60; // 60s Vercel Edge ISR Cache for Catalog

interface ShopPageProps {
  searchParams?: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const resolvedParams = ((await searchParams) || {}) as Record<string, string | undefined>;
  const categorySlug = resolvedParams.category;
  const franchiseName = resolvedParams.franchise;
  const brandName = resolvedParams.brand;

  let title = "Shop Anime Figures & Collectibles Online in India";
  let desc =
    "Shop anime figures, action figures, collectible statues, keychains and mystery boxes online at Fiction Figures. Pan-India delivery, Cash on Delivery and UPI.";

  let isIndexable = true;
  let canonical = "/shop";

  if (categorySlug) {
    const { categories } = await getProducts({ category: categorySlug, limit: 1 });
    const cat = categories.find((c: any) => c.slug === categorySlug);
    if (cat) {
      title = `${titleCase(cat.name)} — Shop Online in India`;
      desc =
        cat.description ||
        `Browse our premium collection of ${cat.name} action figures, statues, and keychains.`;
      // The collection page is the indexable home for a category.
      canonical = `/collections/${categorySlug}`;
    }
  } else if (franchiseName) {
    title = `${franchiseName} Figures & Statues`;
    desc = `Browse our premium collection of ${franchiseName} scale figures and collectibles.`;
    isIndexable = false;
  } else if (brandName) {
    title = `${brandName} Collectibles`;
    desc = `Explore premium designer figures and collectibles from ${brandName}.`;
    isIndexable = false;
  } else {
    const hasOtherFilters = Object.keys(resolvedParams).some(
      (k) => k !== "page" && k !== "sortBy"
    );
    if (hasOtherFilters) {
      isIndexable = false;
    }
  }

  return {
    title,
    description: desc,
    alternates: {
      canonical,
    },
    robots: isIndexable ? { index: true, follow: true } : { index: false, follow: true },
  };
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
    sortBy: (resolvedParams.sortBy as any) || "newest",
    page: resolvedParams.page ? Number(resolvedParams.page) : 1,
    limit: 12,
  };

  const { products, totalCount, totalPages, currentPage, categories, brands, franchises } =
    await getProducts(filters);

  const activeCategoryObj = categories.find((c: any) => c.slug === filters.category);

  const breadcrumbElements = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.fictionfigures.in",
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Shop",
      "item": "https://www.fictionfigures.in/shop",
    },
  ];

  if (activeCategoryObj) {
    breadcrumbElements.push({
      "@type": "ListItem",
      "position": 3,
      "name": activeCategoryObj.name,
      "item": `https://www.fictionfigures.in/collections/${activeCategoryObj.slug}`,
    });
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbElements,
  };

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <SearchModal />
      <CartDrawer />

      <main className="flex-1 bg-[#08090B] text-[#F7F7F5] pb-10 lg:pb-14">
        <CollectionListingView
          title={activeCategoryObj ? activeCategoryObj.name : "Shop All Collectibles"}
          eyebrow={activeCategoryObj ? "Collection" : "Curated Collector Catalog"}
          description={
            activeCategoryObj?.description ||
            "Curated museum-grade statues, anime scale figures, designer toys, and articulated pieces."
          }
          categoryImage={activeCategoryObj?.imageUrl || activeCategoryObj?.image || null}
          activeCategorySlug={filters.category || ""}
          baseUrl="/shop"
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
