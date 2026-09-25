"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { Search, X, ArrowRight, Loader2, Sparkles } from "lucide-react";
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
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/products?query=${encodeURIComponent(trimmed)}&limit=8`);
        const data = await res.json();
        setResults(data.products || []);
      } catch (err) {
        console.error("Search fetch error", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md transition-opacity duration-200">
      {/* Backdrop click listener */}
      <div
        className="fixed inset-0"
        onClick={() => setIsSearchOpen(false)}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl bg-[#121318] border border-white/10 rounded-2xl shadow-2xl shadow-black overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Input Header */}
        <div className="relative flex items-center px-4 py-3.5 sm:py-4 border-b border-white/10 bg-[#0E0F13]">
          <Search className="w-5 h-5 text-[#F5C518] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search figures, scale, anime, characters..."
            className="w-full bg-transparent text-white placeholder-[#64748B] focus:outline-none text-sm sm:text-base font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 text-[#64748B] hover:text-white mr-2 shrink-0 transition-colors"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="px-2.5 py-1 text-[11px] uppercase tracking-wider text-[#94A3B8] hover:text-white bg-white/[0.04] border border-white/10 rounded-lg shrink-0 font-mono transition-all"
          >
            ESC
          </button>
        </div>

        {/* Clean Results Panel */}
        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-[#94A3B8] space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#F5C518]" />
              <span className="text-xs font-mono uppercase tracking-wider">Searching Vault Catalog...</span>
            </div>
          )}

          {!isLoading && !query && (
            <div className="text-center py-10 text-[#64748B] space-y-2">
              <Sparkles className="w-8 h-8 text-[#F5C518]/40 mx-auto" />
              <p className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">
                Type a character name, series, or scale figure to search
              </p>
            </div>
          )}

          {!isLoading && query && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#94A3B8] border-b border-white/10 pb-2.5">
                <span className="font-mono">{results.length} Figures Found</span>
                <Link
                  href={`/shop?query=${encodeURIComponent(query)}`}
                  onClick={() => setIsSearchOpen(false)}
                  className="text-[#F5C518] hover:underline flex items-center gap-1 font-semibold"
                >
                  View all in Shop <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center space-x-3 p-2.5 bg-[#181920] border border-white/[0.08] hover:border-[#F5C518]/40 hover:bg-[#1E202A] rounded-xl transition-all group min-w-0"
                  >
                    <div className="relative w-14 h-14 bg-[#0E0F13] rounded-lg shrink-0 overflow-hidden border border-white/10 flex items-center justify-center p-1">
                      {product.images?.[0]?.url ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-[#64748B]">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-[#F5C518] block tracking-wider truncate">
                        {product.brand || product.category?.name || "COLLECTIBLE"}
                      </span>
                      <h5 className="text-xs font-semibold text-white truncate group-hover:text-[#F5C518] transition-colors">
                        {product.name}
                      </h5>
                      <span className="text-xs font-mono font-bold text-white block">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="text-center py-10 space-y-2">
              <p className="text-sm text-white font-bold">No figures matched "{query}"</p>
              <p className="text-xs text-[#94A3B8]">
                Try searching by character name (e.g., Luffy, Gojo, Naruto), or browse our{" "}
                <Link
                  href="/shop"
                  onClick={() => setIsSearchOpen(false)}
                  className="text-[#F5C518] underline hover:brightness-110"
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
