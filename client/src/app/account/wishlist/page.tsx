"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ArrowLeft, Loader2 } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { API_BASE } from "@/lib/api";

export default function AccountWishlistPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/products?limit=2`)
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-[#111111] space-y-8">
      <div className="flex items-center space-x-3 border-b border-[#E5E5E2] pb-6">
        <Link href="/account" className="p-2 border border-[#E5E5E2] hover:border-[#111111]">
          <ArrowLeft className="w-4 h-4 text-[#111111]" />
        </Link>
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Collector Vault
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">
            Saved Wishlist ({products.length})
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#6B6B6B]">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Loading wishlist...
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E5E5E2] space-y-4 text-xs">
          <Heart className="w-8 h-8 text-[#6B6B6B] mx-auto" />
          <p className="text-[#6B6B6B]">Your saved wishlist is empty right now.</p>
          <Link
            href="/shop"
            className="inline-block px-6 py-3 bg-[#111111] text-white font-semibold uppercase tracking-wider"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
