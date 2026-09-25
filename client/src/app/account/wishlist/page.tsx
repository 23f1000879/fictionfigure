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
import { AccountShell } from "@/components/account/AccountShell";
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
        <main className="editorial-container py-16 text-[#F7F7F5] min-h-[60vh] flex items-center justify-center">
          <div className="text-center text-xs text-[#9A9DA5] space-y-2">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#F7F7F5]" />
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

      <AccountShell>
        {/* Page Header */}
        <div className="flex items-center space-x-3 border-b border-white/[0.08] pb-6">
          <Link
            href="/account"
            className="p-2 border border-white/[0.08] hover:border-white/30 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-[#F7F7F5]" />
          </Link>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9A9DA5] block">
              Collector Vault
            </span>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#F7F7F5]">
              Saved Wishlist ({wishlistCount})
            </h1>
          </div>
        </div>

        {/* Account Tab Navigation */}

        {/* Wishlist Grid / Empty State */}
        {wishlistProducts.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-[#111318] border border-white/[0.08] space-y-4 text-xs">
            <Heart className="w-8 h-8 text-[#9A9DA5] mx-auto opacity-40" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#F7F7F5]">Your saved wishlist is empty right now.</h3>
              <p className="text-[#9A9DA5]">Explore our catalog to add scale figures and statues to your sanctuary.</p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#F5C518] text-[#08090B] text-xs font-semibold uppercase tracking-widest hover:bg-[#FFD43B] transition-colors"
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
      </AccountShell>

      <Footer />
    </>
  );
}
