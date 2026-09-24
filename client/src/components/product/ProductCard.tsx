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
    <div className="group flex flex-col bg-transparent border-none transition-all duration-180">
      {/* Product Image Display with Object Contain for zero cropping */}
      <div className="relative aspect-[3/4] bg-[#FFFFFF] border border-[#E5E5E2] group-hover:border-[#111111] overflow-hidden p-3 transition-all duration-180">
        <Link href={`/products/${product.slug}`} className="block w-full h-full relative">
          {primaryImage ? (
            <>
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-contain object-center group-hover:scale-104 transition-transform duration-200"
              />
              {secondaryImage !== primaryImage && (
                <Image
                  src={secondaryImage}
                  alt={`${product.name} alternate view`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-contain object-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-[#6B6B6B] font-mono">
              Image unavailable
            </div>
          )}
        </Link>

        {/* Wishlist Toggle Button */}
        <button
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await toggleWishlist(product.id);
          }}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-white/90 backdrop-blur-xs border border-[#E5E5E2] hover:border-[#111111] hover:bg-white text-[#111111] transition-all z-10 rounded-none"
          aria-label="Save to Wishlist"
        >
          <Heart
            className={`w-3.5 h-3.5 ${
              isWishlisted ? "fill-[#111111] text-[#111111]" : "text-[#111111]"
            }`}
          />
        </button>

        {/* Status Badges */}
        {!inStock ? (
          <span className="absolute bottom-2 left-2 bg-[#A83232] text-white text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 z-10 rounded-none">
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="absolute bottom-2 left-2 bg-[#B86E00] text-white text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 z-10 rounded-none">
            Only {stock} left
          </span>
        ) : isOnSale ? (
          <span className="absolute bottom-2 left-2 bg-[#111111] text-white text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 z-10 rounded-none">
            Sale
          </span>
        ) : null}
      </div>

      {/* Product Content Details */}
      <div className="pt-2.5 pb-1 px-0.5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-[#6B6B6B] font-bold mb-0.5">
            <span className="truncate max-w-[120px]">{product.brand || product.category?.name || "FictionFigure"}</span>
            {hasRealRating ? (
              <div className="flex items-center space-x-1 shrink-0">
                <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                <span className="text-[#111111] font-mono text-[10px]">{product.rating?.toFixed(1)}</span>
              </div>
            ) : null}
          </div>

          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="text-xs font-semibold text-[#111111] line-clamp-2 group-hover:text-[#D4AF37] transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-[#E5E5E2]/60">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xs sm:text-sm font-bold font-mono text-[#111111]">
              {formatPrice(product.price)}
            </span>
            {isOnSale && product.compareAtPrice && (
              <span className="text-[10px] text-[#6B6B6B] line-through font-mono">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          {inStock ? (
            <button
              onClick={handleQuickAdd}
              className="w-7 h-7 flex items-center justify-center bg-white border border-[#E5E5E2] hover:border-[#111111] hover:bg-[#111111] hover:text-white text-[#111111] transition-all rounded-none"
              aria-label="Add to Cart"
              title="Add to Cart"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              disabled
              className="w-7 h-7 flex items-center justify-center bg-white border border-[#E5E5E2] opacity-40 cursor-not-allowed text-[#6B6B6B] rounded-none"
              aria-label="Out of Stock"
              title="Out of Stock"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
