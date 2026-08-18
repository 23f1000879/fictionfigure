"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Star, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    brand: string;
    price: number;
    compareAtPrice?: number | null;
    rating?: number | null;
    reviewCount?: number | null;
    category?: { name: string };
    images: { url: string; altText?: string | null }[];
    variants?: { id: string; title: string; price: number; sku: string; inventoryCount: number }[];
  };
  lowStockThreshold?: number;
}

export function ProductCard({ product, lowStockThreshold = 5 }: ProductCardProps) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  const primaryImage = product.images?.[0]?.url || "";
  const secondaryImage = product.images?.[1]?.url || primaryImage;

  const defaultVariant = product.variants?.[0];
  const stock = defaultVariant ? defaultVariant.inventoryCount : 0;
  const inStock = stock > 0;
  const isLowStock = inStock && stock <= lowStockThreshold;
  const isOnSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);
  const hasRealRating = Boolean(product.reviewCount && product.reviewCount > 0 && product.rating);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!defaultVariant || !inStock) return;

    addItem({
      variantId: defaultVariant.id,
      productId: product.id,
      title: product.name,
      variantTitle: defaultVariant.title,
      price: defaultVariant.price || product.price,
      image: primaryImage,
      quantity: 1,
      sku: defaultVariant.sku || "",
      brand: product.brand || "FictionFigure",
    });
  };

  return (
    <div className="group flex flex-col bg-white border border-[#E5E5E2] hover:border-[#111111] transition-all duration-200">
      {/* Image Container */}
      <div className="relative aspect-[3/4] bg-[#F0F0ED] overflow-hidden">
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          {primaryImage ? (
            <>
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {secondaryImage !== primaryImage && (
                <Image
                  src={secondaryImage}
                  alt={`${product.name} alternate view`}
                  fill
                  className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-[#6B6B6B] font-mono">
              Image unavailable
            </div>
          )}
        </Link>

        {/* Wishlist Button */}
        <button
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await toggleWishlist(product.id);
          }}
          className="absolute top-2 right-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/90 backdrop-blur-xs border border-[#E5E5E2] hover:bg-white text-[#111111] transition-all z-10"
          aria-label="Save to Wishlist"
        >
          <Heart
            className={`w-4 h-4 ${
              isWishlisted ? "fill-[#111111] text-[#111111]" : "text-[#111111]"
            }`}
          />
        </button>

        {/* Status Badges */}
        {!inStock ? (
          <span className="absolute bottom-3 left-3 bg-[#A83232] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 z-10">
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="absolute bottom-3 left-3 bg-[#B86E00] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 z-10">
            Only {stock} left
          </span>
        ) : isOnSale ? (
          <span className="absolute bottom-3 left-3 bg-[#111111] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 z-10">
            Sale
          </span>
        ) : null}
      </div>

      {/* Product Content Details */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-[#6B6B6B] font-semibold mb-1">
            <span className="truncate max-w-[100px] sm:max-w-none">{product.brand || "FictionFigure"}</span>
            {hasRealRating ? (
              <div className="flex items-center space-x-1 shrink-0">
                <Star className="w-3 h-3 fill-[#111111] text-[#111111]" />
                <span className="text-[#111111] font-mono">{product.rating?.toFixed(1)}</span>
                <span className="text-[#6B6B6B] font-mono text-[9px]">({product.reviewCount})</span>
              </div>
            ) : (
              <span className="text-[9px] text-[#6B6B6B] font-mono shrink-0">No reviews yet</span>
            )}
          </div>

          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="text-xs font-semibold text-[#111111] line-clamp-2 hover:underline leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#F0F0ED]">
          <div className="flex flex-col sm:flex-row sm:items-baseline space-y-0.5 sm:space-y-0 sm:space-x-2">
            <span className="text-xs sm:text-sm font-semibold font-mono text-[#111111]">
              {formatPrice(product.price)}
            </span>
            {isOnSale && product.compareAtPrice && (
              <span className="text-[10px] sm:text-xs text-[#6B6B6B] line-through font-mono">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          {inStock ? (
            <button
              onClick={handleQuickAdd}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center border border-[#E5E5E2] hover:border-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
              title="Add to Cart"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          ) : (
            <button
              disabled
              className="min-w-[44px] min-h-[44px] flex items-center justify-center border border-[#E5E5E2] opacity-40 cursor-not-allowed text-[#6B6B6B]"
              title="Out of Stock"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
