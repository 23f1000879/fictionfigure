"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Search, ArrowRight, Home } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/shop?query=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/shop");
    }
  };

  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16 sm:py-24 bg-[#0D0E12] text-[#F7F7F5] space-y-8 w-full max-w-full overflow-hidden box-border">
        {/* Main 404 Hero Visual */}
        <div className="space-y-4 max-w-lg mx-auto">
          <span className="text-7xl sm:text-9xl font-extrabold tracking-tighter text-[#F7F7F5] font-mono select-none opacity-90 block">
            404
          </span>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-[#F7F7F5] leading-tight">
            THIS PAGE COULDN'T BE FOUND
          </h1>

          <p className="text-xs sm:text-sm text-[#9A9DA5] max-w-md mx-auto leading-relaxed">
            The page you're looking for may have moved, been removed, or no longer exists.
          </p>
        </div>

        {/* Real Storefront Search Input */}
        <form
          onSubmit={handleSearchSubmit}
          className="w-full max-w-md mx-auto relative flex items-center shadow-2xs border border-white/[0.08] rounded-lg bg-[#111318] overflow-hidden focus-within:border-[#F5C518]/60 transition-colors"
        >
          <label htmlFor="not-found-search-input" className="sr-only">
            Search products, collections
          </label>
          <input
            id="not-found-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, collections..."
            className="w-full py-3 sm:py-3.5 pl-4 pr-12 text-xs sm:text-sm text-[#F7F7F5] placeholder-[#8E8E93] bg-transparent focus:outline-none font-sans"
          />
          <button
            type="submit"
            className="absolute right-1.5 p-2 text-[#F7F7F5] hover:text-[#F5C518] transition-colors rounded-md"
            aria-label="Submit Search"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Action Buttons & Navigation */}
        <div className="space-y-6 pt-2">
          <div>
            <Link
              href="/"
              className="inline-flex items-center justify-center min-h-[48px] px-8 py-3.5 bg-[#F5C518] text-[#08090B] text-xs font-extrabold uppercase tracking-widest rounded-lg hover:bg-[#FFD43B] transition-colors shadow-xs group"
            >
              <Home className="w-4 h-4 mr-2" />
              <span>BACK TO HOME</span>
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Understated Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold uppercase tracking-wider text-[#9A9DA5] font-mono pt-4 border-t border-white/[0.08] max-w-xs mx-auto">
            <Link href="/shop" className="hover:text-white transition-colors">
              Shop
            </Link>
            <span className="text-[#E5E5E2]">•</span>
            <Link href="/collections" className="hover:text-white transition-colors">
              Collections
            </Link>
            <span className="text-[#E5E5E2]">•</span>
            <Link href="/shop?sortBy=newest" className="hover:text-white transition-colors">
              New Arrivals
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
