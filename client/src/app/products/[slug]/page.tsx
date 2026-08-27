import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/context/CartContext";
import { getProductBySlug } from "@/lib/services/productService";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
  const title = `${product.brand ? product.brand + ' ' : ''}${product.name} | FictionFigure`;
  const desc = product.shortDescription || product.description?.replace(/<[^>]*>/g, "").slice(0, 160) || "";
  
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
    }
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
    "description": product.shortDescription || product.description?.replace(/<[^>]*>/g, ""),
    "sku": product.sku || product.id,
    "offers": {
      "@type": "Offer",
      "url": `https://www.fictionfigures.in/products/${product.slug}`,
      "priceCurrency": "INR",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "priceValidUntil": "2027-12-31"
    }
  };

  if (product.brand && product.brand.trim()) {
    productSchema.brand = {
      "@type": "Brand",
      "name": product.brand.trim()
    };
  }

  if (product.reviewCount && product.reviewCount > 0 && product.rating) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    };

    if (product.reviews && product.reviews.length > 0) {
      productSchema.review = product.reviews.slice(0, 3).map((r: any) => ({
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": r.authorName || "Anonymous Collector"
        },
        "datePublished": new Date(r.createdAt || Date.now()).toISOString().split('T')[0],
        "reviewBody": r.comment || "",
        "name": r.title || "Collector Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": r.rating,
          "bestRating": "5",
          "worstRating": "1"
        }
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
        "item": "https://www.fictionfigures.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Shop",
        "item": "https://www.fictionfigures.in/shop"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.category?.name || "Figures",
        "item": `https://www.fictionfigures.in/shop?category=${product.category?.slug || "figures"}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": product.name,
        "item": `https://www.fictionfigures.in/products/${product.slug}`
      }
    ]
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

      <main className="editorial-container py-12 space-y-16">
        <ProductDetailClient product={product} />

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="space-y-6 pt-12 border-t border-[#E5E5E2]">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
                  Same Collection
                </span>
                <h3 className="text-xl font-semibold text-[#111111] tracking-tight">
                  You May Also Like
                </h3>
              </div>

              <Link
                href={`/shop?category=${product.category.slug}`}
                className="text-xs font-semibold text-[#111111] hover:underline flex items-center"
              >
                View all in {product.category.name} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.id} product={relProduct} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
