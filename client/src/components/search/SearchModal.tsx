"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  category: { name: string };
  images: { url: string }[];
}

export function SearchModal() {
  const { isSearchOpen, setIsSearchOpen } = useCart();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSearchOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsSearchOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/products?query=${encodeURIComponent(query)}&limit=6`);
        const data = await res.json();
        setResults(data.products || []);
      } catch (err) {
        console.error("Search fetch error", err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-[#F7F7F5] border border-[#E5E5E2] shadow-2xl overflow-hidden rounded-none animate-in fade-in zoom-in-95 duration-200">
        {/* Input Header */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-[#E5E5E2] bg-white">
          <Search className="w-5 h-5 text-[#6B6B6B] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search figures, statues, brands, franchises..."
            className="w-full bg-transparent text-[#111111] placeholder-[#6B6B6B] focus:outline-none text-base"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-[#6B6B6B] hover:text-[#111111] mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="px-2 py-1 text-xs uppercase tracking-wider text-[#6B6B6B] hover:text-[#111111] border border-[#E5E5E2] rounded-none"
          >
            ESC
          </button>
        </div>

        {/* Search Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-[#6B6B6B]">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Searching collection catalog...</span>
            </div>
          )}

          {!isLoading && !query && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-[#6B6B6B] mb-3">
                  Popular Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  {["Anime Figures", "Premium Statues", "Designer Toys", "Game Characters", "Limited Editions"].map((cat) => (
                    <Link
                      key={cat}
                      href={`/shop?category=${encodeURIComponent(cat.toLowerCase().replace(/ /g, "-"))}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="px-3 py-1.5 text-xs font-medium bg-white border border-[#E5E5E2] text-[#111111] hover:border-[#111111] transition-colors"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-[#6B6B6B] mb-3">
                  Suggested Brands
                </h4>
                <div className="flex flex-wrap gap-2 text-xs text-[#6B6B6B]">
                  {["AetherArts Studio", "Kurogane Atelier", "Mythos Craft", "Ironclad Collectibles"].map((b) => (
                    <Link
                      key={b}
                      href={`/shop?brand=${encodeURIComponent(b)}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="hover:text-[#111111] underline underline-offset-4"
                    >
                      {b}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!isLoading && query && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#6B6B6B] border-b border-[#E5E5E2] pb-2">
                <span>{results.length} Products Found</span>
                <Link
                  href={`/shop?query=${encodeURIComponent(query)}`}
                  onClick={() => setIsSearchOpen(false)}
                  className="hover:text-[#111111] flex items-center gap-1 font-medium"
                >
                  View all results <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center space-x-3 p-2 bg-white border border-[#E5E5E2] hover:border-[#111111] transition-colors group"
                  >
                    <div className="relative w-16 h-16 bg-[#F0F0ED] shrink-0 overflow-hidden">
                      {product.images[0]?.url ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[#6B6B6B]">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-semibold text-[#6B6B6B] block tracking-wide">
                        {product.brand}
                      </span>
                      <h5 className="text-xs font-semibold text-[#111111] truncate group-hover:underline">
                        {product.name}
                      </h5>
                      <span className="text-xs font-semibold text-[#111111] mt-1 block">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm text-[#111111] font-semibold mb-1">No figures matched your query</p>
              <p className="text-xs text-[#6B6B6B]">
                Try searching by character name, franchise, or browse our{" "}
                <Link
                  href="/shop"
                  onClick={() => setIsSearchOpen(false)}
                  className="underline text-[#111111]"
                >
                  full catalog
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
