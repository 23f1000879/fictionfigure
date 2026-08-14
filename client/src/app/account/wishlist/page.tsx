"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ArrowLeft, Loader2, ShoppingBag } from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ProductCard } from "@/components/product/ProductCard";
import { AccountTabNav } from "@/components/account/AccountTabNav";
import { useWishlist } from "@/context/WishlistContext";

export default function AccountWishlistPage() {
  const router = useRouter();
  const { wishlistProducts, wishlistCount, loading } = useWishlist();
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fictionfigure_token") : null;

    // REDIRECT BEFORE DATA FETCH: If unauthenticated, redirect immediately to login with return path
    if (!token) {
      router.replace("/login?redirect=/account/wishlist");
      return;
    }

    setAuthChecking(false);
  }, [router]);

  // Loading or Auth-Redirecting State
  if (authChecking || loading) {
    return (
      <>
        <Header />
        <SearchModal />
        <CartDrawer />
        <main className="editorial-container py-16 text-[#111111] min-h-[60vh] flex items-center justify-center">
          <div className="text-center text-xs text-[#6B6B6B] space-y-2">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#111111]" />
            <span>Accessing Collector Vault...</span>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="editorial-container py-10 sm:py-16 space-y-8 text-[#111111] min-h-[70vh]">
        {/* Page Header */}
        <div className="flex items-center space-x-3 border-b border-[#E5E5E2] pb-6">
          <Link
            href="/account"
            className="p-2 border border-[#E5E5E2] hover:border-[#111111] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-[#111111]" />
          </Link>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#6B6B6B] block">
              Collector Vault
            </span>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#111111]">
              Saved Wishlist ({wishlistCount})
            </h1>
          </div>
        </div>

        {/* Account Tab Navigation */}
        <AccountTabNav activeTab="wishlist" wishlistCount={wishlistCount} />

        {/* Wishlist Grid / Empty State */}
        {wishlistProducts.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-white border border-[#E5E5E2] space-y-4 text-xs">
            <Heart className="w-8 h-8 text-[#6B6B6B] mx-auto opacity-40" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#111111]">Your saved wishlist is empty right now.</h3>
              <p className="text-[#6B6B6B]">Explore our catalog to add scale figures and statues to your sanctuary.</p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-2" /> Explore Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {wishlistProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
