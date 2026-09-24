"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    brand?: string;
    price: number;
    compareAtPrice?: number | null;
    rating?: number | null;
    reviewCount?: number | null;
    category?: { name: string };
    images: { url: string; altText?: string | null }[];
    variants?: {
      id: string;
      title: string;
      price: number;
      compareAtPrice?: number | null;
      sku: string;
      inventoryCount: number;
      imageUrl?: string | null;
    }[];
  };
  lowStockThreshold?: number;
}

export function ProductCard({ product, lowStockThreshold = 3 }: ProductCardProps) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);

  const variants = product.variants || [];
  const hasVariants = Boolean(
    variants.length > 1 ||
      (variants.length === 1 &&
        variants[0].title !== "Standard Edition" &&
        variants[0].title !== "Standard" &&
        variants[0].title !== "Default Title")
  );

  const currentVariant = variants[selectedVariantIndex] || variants[0];
  const currentPrice = currentVariant?.price || product.price;
  const currentCompareAt = currentVariant?.compareAtPrice || product.compareAtPrice;

  const currentStock = currentVariant
    ? currentVariant.inventoryCount
    : (variants[0]?.inventoryCount ?? 0);
  const inStock = currentStock > 0;
  const isLowStock = inStock && currentStock <= lowStockThreshold;

  const isOnSale = Boolean(currentCompareAt && currentCompareAt > currentPrice);
  const discountPercent = isOnSale && currentCompareAt
    ? Math.round(((currentCompareAt - currentPrice) / currentCompareAt) * 100)
    : 0;

  const images = product.images || [];
  const hasMultipleImages = images.length > 1;
  const displayImage =
    currentVariant?.imageUrl ||
    images[imageIndex]?.url ||
    images[0]?.url ||
    "";

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasMultipleImages) return;
    setImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasMultipleImages) return;
    setImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;

    const variantToAdd = currentVariant || {
      id: `${product.id}-default`,
      title: "Standard Edition",
      price: product.price,
      sku: product.id,
      inventoryCount: 10,
    };

    addItem({
      variantId: variantToAdd.id,
      productId: product.id,
      title: product.name,
      variantTitle: variantToAdd.title,
      price: currentPrice,
      image: displayImage,
      quantity: 1,
      sku: variantToAdd.sku || "",
      brand: product.brand || product.category?.name || "FictionFigure",
    });
  };

  return (
    <div className="group bg-white rounded-lg border border-[#E5E5E2] hover:border-[#111111] hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between p-3 sm:p-4 text-[#111111] box-border h-full">
      {/* Upper Area: Image & Variant Selection */}
      <div className="space-y-3">
        {/* Product Image Container */}
        <div className="relative aspect-[3/4] bg-[#FFFFFF] rounded-md overflow-hidden p-2 flex items-center justify-center">
          <Link href={`/products/${product.slug}`} className="block w-full h-full relative">
            {displayImage ? (
              <Image
                src={displayImage}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-contain object-center group-hover:scale-103 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-[#6B6B6B] font-mono">
                Image unavailable
              </div>
            )}
          </Link>

          {/* Floating Wishlist Heart Button */}
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              await toggleWishlist(product.id);
            }}
            className="absolute top-2.5 right-2.5 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-xs border border-[#E5E5E2] shadow-sm hover:scale-110 hover:bg-white text-[#111111] transition-all flex items-center justify-center cursor-pointer"
            aria-label={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                isWishlisted ? "fill-[#A83232] text-[#A83232]" : "text-[#111111]"
              }`}
            />
          </button>

          {/* Multi-Image Carousel Arrows (on hover) */}
          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/90 border border-[#E5E5E2] text-[#111111] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-white shadow-sm"
                aria-label="Previous product image"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/90 border border-[#E5E5E2] text-[#111111] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-white shadow-sm"
                aria-label="Next product image"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Stock Badges */}
          {!inStock ? (
            <span className="absolute bottom-2 left-2 bg-[#A83232] text-white text-[9px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 z-10 rounded">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="absolute bottom-2 left-2 bg-[#B86E00] text-white text-[9px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 z-10 rounded">
              Only {currentStock} Left
            </span>
          ) : isOnSale && discountPercent > 0 ? (
            <span className="absolute bottom-2 left-2 bg-[#111111] text-white text-[9px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 z-10 rounded">
              {discountPercent}% OFF
            </span>
          ) : null}
        </div>

        {/* Dynamic Generic Variant Selector */}
        {hasVariants && (
          <div className="pt-1">
            <div className="flex flex-wrap gap-1.5">
              {variants.map((v, idx) => {
                const isSelected = selectedVariantIndex === idx;
                const isOut = v.inventoryCount <= 0;
                return (
                  <button
                    key={v.id || idx}
                    type="button"
                    disabled={isOut}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedVariantIndex(idx);
                    }}
                    className={`px-2 py-1 text-[10px] font-mono font-bold rounded border transition-all ${
                      isSelected
                        ? "bg-[#111111] text-white border-[#111111] shadow-xs"
                        : isOut
                        ? "bg-[#F7F7F5] text-[#A0A0A0] border-[#E5E5E2] line-through cursor-not-allowed opacity-50"
                        : "bg-white text-[#111111] border-[#E5E5E2] hover:border-[#111111]"
                    }`}
                    title={`${v.title}${v.price && v.price !== product.price ? ` - ${formatPrice(v.price)}` : ""}${isOut ? " (Sold Out)" : ""}`}
                  >
                    {v.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Brand & Product Title */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#6B6B6B] block truncate">
            {product.brand || product.category?.name || "FICTIONFIGURE"}
          </span>

          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="text-xs sm:text-sm font-semibold text-[#111111] line-clamp-2 leading-snug group-hover:text-[#D4AF37] transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>
      </div>

      {/* Lower Area: Price & Action */}
      <div className="pt-3 space-y-3 border-t border-[#F0F0EE] mt-2">
        <div className="flex items-baseline space-x-2">
          <span className="text-sm sm:text-base font-bold font-mono text-[#111111]">
            {formatPrice(currentPrice)}
          </span>
          {isOnSale && currentCompareAt && (
            <span className="text-xs text-[#6B6B6B] line-through font-mono">
              {formatPrice(currentCompareAt)}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={!inStock}
          onClick={handleQuickAdd}
          className={`w-full py-2.5 px-3 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center space-x-1.5 ${
            inStock
              ? "bg-[#111111] hover:bg-[#2A2A2A] text-white shadow-sm cursor-pointer"
              : "bg-[#E5E5E2] text-[#999999] cursor-not-allowed"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{inStock ? "ADD TO CART" : "SOLD OUT"}</span>
        </button>
      </div>
    </div>
  );
}
