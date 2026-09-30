import React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { getProducts, getCategories } from "@/lib/services/productService";
import { CollectionListingView } from "@/components/collection/CollectionListingView";
import { notFound } from "next/navigation";
import { OG_IMAGE, OPEN_GRAPH_DEFAULTS, absoluteUrl, breadcrumbSchema, cleanText, jsonLd, metaDescription, titleCase } from "@/lib/seo";

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
  const resolvedSearch = ((await searchParams) || {}) as Record<string, string | undefined>;
  const categories = await getCategories();
  const cat = categories.find((c: any) => c.slug === slug || c.id === slug);

  if (!cat) {
    return {
      title: "Collection Not Found",
      robots: { index: false, follow: true },
    };
  }

  const name = titleCase(cat.name);
  const title = `${name} — Shop Online in India`;
  const description = metaDescription(
    cat.description,
    `Shop ${name} at Fiction Figures: anime figures, collectibles and merchandise with pan-India delivery, Cash on Delivery and UPI.`
  );
  const canonical = `/collections/${cat.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    // Filtered / sorted variants share the clean canonical; only the unfiltered view is indexed.
    robots: Object.keys(resolvedSearch).some((k) => k !== "page") ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      ...OPEN_GRAPH_DEFAULTS,
      url: canonical,
      images: cat.imageUrl ? [{ url: cat.imageUrl, alt: name }] : [OG_IMAGE],
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

  const crumbs = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Collections", path: "/collections" },
    { name: titleCase(cat?.name || slug), path: `/collections/${cat?.slug || slug}` },
  ]);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: titleCase(cat?.name || slug),
    itemListElement: (products || []).map((p: any, i: number) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/products/${p.slug}`),
      name: cleanText(p.name),
    })),
  };

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(crumbs)} />
      {itemList.itemListElement.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(itemList)} />
      )}
      <SearchModal />
      <CartDrawer />

      <main className="flex-1 bg-background text-foreground pb-10 lg:pb-14">
        <CollectionListingView
          title={cat?.name || slug.toUpperCase()}
          eyebrow="Collection"
          description={
            cat?.description ||
            `Explore products in the ${cat?.name || slug} collection currently available in the Fiction Figures catalogue.`
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
