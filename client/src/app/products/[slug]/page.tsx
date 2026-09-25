import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { getProductBySlug } from "@/lib/services/productService";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export const revalidate = 0;

interface ProductPageProps {
  params: { slug: string } | Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = (await params) as { slug: string };
  const slug = resolvedParams?.slug;
  const data = await getProductBySlug(slug);
  if (!data || !data.product) {
    return {};
  }
  const { product } = data;
  const title = `${product.brand ? product.brand + " " : ""}${product.name} | FictionFigure`;
  const desc =
    product.shortDescription ||
    product.description?.replace(/<[^>]*>/g, "").slice(0, 160) ||
    "";

  return {
    title,
    description: desc,
    alternates: {
      canonical: `https://www.fictionfigures.in/products/${product.slug}`,
    },
    openGraph: {
      title,
      description: desc,
      url: `https://www.fictionfigures.in/products/${product.slug}`,
      images: product.images?.[0]?.url ? [{ url: product.images[0].url }] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: product.images?.[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = (await params) as { slug: string };
  const slug = resolvedParams?.slug;
  const data = await getProductBySlug(slug);

  if (!data || !data.product) {
    notFound();
  }

  const { product, relatedProducts } = data;

  const currentVariant = product.variants?.[0];
  const inStock = currentVariant ? currentVariant.inventoryCount > 0 : false;

  const productSchema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images?.map((img: any) => img.url) || [],
    "description":
      product.shortDescription || product.description?.replace(/<[^>]*>/g, ""),
    "sku": product.sku || product.id,
    "offers": {
      "@type": "Offer",
      "url": `https://www.fictionfigures.in/products/${product.slug}`,
      "priceCurrency": "INR",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "priceValidUntil": "2027-12-31",
    },
  };

  if (product.brand && product.brand.trim()) {
    productSchema.brand = {
      "@type": "Brand",
      "name": product.brand.trim(),
    };
  }

  if (product.reviewCount && product.reviewCount > 0 && product.rating) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviewCount,
      "bestRating": "5",
      "worstRating": "1",
    };

    if (product.reviews && product.reviews.length > 0) {
      productSchema.review = product.reviews.slice(0, 3).map((r: any) => ({
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": r.authorName || "Anonymous Collector",
        },
        "datePublished": new Date(r.createdAt || Date.now())
          .toISOString()
          .split("T")[0],
        "reviewBody": r.comment || "",
        "name": r.title || "Collector Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": r.rating,
          "bestRating": "5",
          "worstRating": "1",
        },
      }));
    }
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
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
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.category?.name || "Figures",
        "item": `https://www.fictionfigures.in/shop?category=${
          product.category?.slug || "figures"
        }`,
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": product.name,
        "item": `https://www.fictionfigures.in/products/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <SearchModal />
      <CartDrawer />

      <main className="bg-[#0A0A0C] text-[#F8FAFC] min-h-screen py-8 sm:py-12">
        <div className="editorial-container space-y-16">
          <ProductDetailClient product={product} />

          {/* Related Products Section */}
          {relatedProducts && relatedProducts.length > 0 && (
            <section className="space-y-6 pt-12 border-t border-white/10" aria-label="Related Figures">
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#F5C518] mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>SAME UNIVERSE COLLECTION</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white">
                    YOU MAY ALSO LIKE
                  </h3>
                </div>

                {product.category?.slug && (
                  <Link
                    href={`/shop?category=${product.category.slug}`}
                    className="text-xs font-mono font-bold uppercase tracking-wider text-[#94A3B8] hover:text-[#F5C518] transition-colors flex items-center group"
                  >
                    <span>View all in {product.category.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {relatedProducts.map((relProduct: any) => (
                  <ProductCard key={relProduct.id} product={relProduct} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
