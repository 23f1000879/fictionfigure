import React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { getProducts, getCategories } from "@/lib/services/productService";
import { CollectionListingView } from "@/components/collection/CollectionListingView";
import { notFound } from "next/navigation";

export const revalidate = 60; // 60s Vercel Edge ISR Cache

interface CollectionSlugPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({
  params,
  searchParams,
}: CollectionSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const cat = categories.find((c: any) => c.slug === slug || c.id === slug);

  if (!cat) {
    return {
      title: "Collection Not Found | FICTIONFIGURE",
      robots: { index: false, follow: true },
    };
  }

  const title = `${cat.name} Collection | FICTIONFIGURE`;
  const description =
    cat.description ||
    `Browse authentic ${cat.name} collectible figures, statues, keychains, and merchandise at FICTIONFIGURE.`;
  const canonical = `https://www.fictionfigures.in/collections/${cat.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "FICTIONFIGURE",
      images: cat.imageUrl ? [{ url: cat.imageUrl }] : [],
    },
  };
}

export default async function CollectionSlugPage({
  params,
  searchParams,
}: CollectionSlugPageProps) {
  const { slug } = await params;
  const resolvedParams = ((await searchParams) || {}) as Record<string, string | undefined>;

  const categories = await getCategories();
  const cat = categories.find((c: any) => c.slug === slug || c.id === slug);

  const filters = {
    category: slug,
    brand: resolvedParams.brand,
    franchise: resolvedParams.franchise,
    minPrice: resolvedParams.minPrice ? Number(resolvedParams.minPrice) : undefined,
    maxPrice: resolvedParams.maxPrice ? Number(resolvedParams.maxPrice) : undefined,
    inStockOnly: resolvedParams.inStockOnly === "true",
    sortBy: (resolvedParams.sortBy as any) || "newest",
    page: resolvedParams.page ? Number(resolvedParams.page) : 1,
    limit: 12,
  };

  const { products, totalCount, totalPages, currentPage, brands, franchises } =
    await getProducts(filters);

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
      "name": "Collections",
      "item": "https://www.fictionfigures.in/collections",
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": cat?.name || slug,
      "item": `https://www.fictionfigures.in/collections/${slug}`,
    },
  ];

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

      <main className="flex-1 bg-[#0A0A0C] text-[#F8FAFC] min-h-screen">
        <CollectionListingView
          title={cat?.name ? `${cat.name} COLLECTION` : slug.toUpperCase()}
          eyebrow="CATEGORY COLLECTION"
          description={
            cat?.description ||
            `Explore products in the ${cat?.name || slug} collection currently available in the FICTIONFIGURE catalog.`
          }
          categoryImage={cat?.imageUrl || cat?.image || null}
          activeCategorySlug={slug}
          baseUrl={`/collections/${slug}`}
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
