import React from "react";
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
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const data = await getProductBySlug(slug);

  if (!data || !data.product) {
    notFound();
  }

  const { product, relatedProducts } = data;

  return (
    <CartProvider>
      <Header />
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
    </CartProvider>
  );
}
