import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SectionHeading } from "@/components/home/SectionHeading";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { getProductBySlug } from "@/lib/services/productService";
import {
  OG_IMAGE,
  OPEN_GRAPH_DEFAULTS,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  breadcrumbSchema,
  cleanText,
  displayBrand,
  getStoreFacts,
  jsonLd,
  merchantReturnPolicy,
  metaDescription,
  shippingDetails,
  titleCase,
} from "@/lib/seo";

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
  const name = cleanText(product.name);
  const brand = displayBrand(product.brand);
  const title = brand === SITE_NAME ? name : `${brand} ${name}`;
  const desc = metaDescription(
    product.shortDescription || product.description,
    `Buy ${name} online in India at Fiction Figures. Pan-India delivery, Cash on Delivery and UPI.`
  );
  const url = `/products/${product.slug}`;
  const image = product.images?.[0]?.url;

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      ...OPEN_GRAPH_DEFAULTS,
      title,
      description: desc,
      url,
      images: image ? [{ url: image, alt: name }] : [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: image ? [image] : [OG_IMAGE.url],
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
  const storeFacts = await getStoreFacts();
  const productName = cleanText(product.name);
  const productUrl = absoluteUrl(`/products/${product.slug}`);

  const currentVariant = product.variants?.[0];
  const inStock = currentVariant ? currentVariant.inventoryCount > 0 : false;

  const productSchema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    "name": productName,
    "url": productUrl,
    "image": product.images?.map((img: any) => img.url) || [],
    "description": metaDescription(product.shortDescription || product.description, productName, 5000),
    "sku": cleanText(product.sku) || product.id,
    "brand": { "@type": "Brand", "name": displayBrand(product.brand) },
    ...(product.category?.name ? { "category": titleCase(product.category.name) } : {}),
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "INR",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "priceValidUntil": "2027-12-31",
      "seller": { "@id": `${SITE_URL}/#organization`, "@type": "Organization", "name": SITE_NAME },
      "shippingDetails": shippingDetails(storeFacts, Number(product.price) || 0),
      "hasMerchantReturnPolicy": merchantReturnPolicy(),
    },
  };

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

  const crumbs = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    ...(product.category?.slug ? [{ name: titleCase(product.category.name), path: `/collections/${product.category.slug}` }] : []),
    { name: productName, path: `/products/${product.slug}` },
  ]);

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(productSchema)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(crumbs)} />
      <SearchModal />
      <CartDrawer />

      <main className="bg-background text-foreground pt-5 pb-16 lg:pt-6 lg:pb-20">
        <div className="ff-container space-y-14 lg:space-y-16">
          <ProductDetailClient product={product} />

          {relatedProducts && relatedProducts.length > 0 && (
            <section className="space-y-4 lg:space-y-5" aria-label="Related figures">
              <SectionHeading
                eyebrow="Same Universe"
                title="You May Also Like"
                linkText={product.category?.slug ? `View all ${product.category.name}` : undefined}
                linkUrl={product.category?.slug ? `/collections/${product.category.slug}` : undefined}
              />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 3xl:grid-cols-6 gap-3 lg:gap-4">
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
