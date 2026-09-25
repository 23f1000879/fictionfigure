"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Badge } from "@/components/ui/Badge";

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
  const [isAdding, setIsAdding] = useState(false);

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

  const primaryImage =
    currentVariant?.imageUrl ||
    images[imageIndex]?.url ||
    images[0]?.url ||
    "";

  // Hover image swap: display second image if multiple images exist
  const secondaryImage =
    hasMultipleImages
      ? images[(imageIndex + 1) % images.length]?.url
      : null;

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

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock || isAdding) return;

    setIsAdding(true);
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
      image: primaryImage,
      quantity: 1,
      sku: variantToAdd.sku || "",
      brand: product.brand || product.category?.name || "FictionFigure",
    });

    setTimeout(() => {
      setIsAdding(false);
    }, 400);
  };

  const brandOrCategory = product.brand || product.category?.name || "COLLECTIBLE";

  return (
    <div className="group relative bg-[#121318] rounded-2xl border border-white/[0.08] hover:border-[#F5C518]/40 hover:shadow-cardHover transition-all duration-300 overflow-hidden flex flex-col justify-between text-white box-border h-full">
      {/* Edge-to-Edge Product Image Area */}
      <div className="relative w-full aspect-[3/4] bg-[#0E0F13] overflow-hidden rounded-t-2xl flex items-center justify-center">
        <Link href={`/products/${product.slug}`} className="block w-full h-full relative">
          {primaryImage ? (
            <>
              {/* Primary Image */}
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={`object-contain object-center transition-all duration-300 group-hover:scale-[1.03] ${
                  secondaryImage ? "group-hover:opacity-0" : ""
                }`}
              />

              {/* Secondary Image (Fades in on hover) */}
              {secondaryImage && (
                <Image
                  src={secondaryImage}
                  alt={`${product.name} alternate view`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-contain object-center opacity-0 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-300 pointer-events-none"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-[#64748B] font-mono">
              Artwork unavailable
            </div>
          )}
        </Link>

        {/* Floating Wishlist Heart Button with dark glass backdrop */}
        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await toggleWishlist(product.id);
          }}
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-xl bg-[#121318]/80 backdrop-blur-md border border-white/10 shadow-md hover:scale-110 hover:border-white/25 text-white transition-all flex items-center justify-center cursor-pointer"
          aria-label={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? "fill-rose-500 text-rose-500" : "text-white/80 hover:text-white"
            }`}
          />
        </button>

        {/* Multi-Image Controls */}
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-xl bg-[#121318]/80 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-[#1A1C24] shadow-sm"
              aria-label="Previous product image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-xl bg-[#121318]/80 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-[#1A1C24] shadow-sm"
              aria-label="Next product image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Stock & Discount Badges */}
        <div className="absolute bottom-2.5 left-2.5 z-10 flex flex-wrap gap-1.5 pointer-events-none">
          {!inStock ? (
            <Badge variant="danger" size="sm">Sold Out</Badge>
          ) : isLowStock ? (
            <Badge variant="warning" size="sm">Only {currentStock} Left</Badge>
          ) : isOnSale && discountPercent > 0 ? (
            <Badge variant="gold" size="sm">{discountPercent}% OFF</Badge>
          ) : null}
        </div>
      </div>

      {/* Product Details & Purchase Actions Container */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-[#121318]">
        <div className="space-y-1.5">
          {/* Brand/Category Micro-Label */}
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-semibold text-[#F5C518]">
            <span className="truncate">{brandOrCategory}</span>
            {product.rating && product.rating > 0 ? (
              <span className="flex items-center gap-1 text-white/90 text-xs font-mono ml-2 shrink-0">
                <Star className="w-3 h-3 fill-[#F5C518] text-[#F5C518]" />
                <span>{product.rating.toFixed(1)}</span>
                {product.reviewCount ? (
                  <span className="text-[#64748B] text-[10px]">({product.reviewCount})</span>
                ) : null}
              </span>
            ) : null}
          </div>

          {/* Product Name */}
          <Link
            href={`/products/${product.slug}`}
            className="block font-semibold text-sm sm:text-base text-white hover:text-[#F5C518] transition-colors line-clamp-2 leading-snug"
          >
            {product.name}
          </Link>

          {/* Dynamic Generic Variant Selector */}
          {hasVariants && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {variants.map((variant, idx) => {
                const isSelected = idx === selectedVariantIndex;
                const isVariantInStock = variant.inventoryCount > 0;
                return (
                  <button
                    key={variant.id || idx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedVariantIndex(idx);
                    }}
                    className={`text-[10px] px-2 py-1 rounded-md border font-medium transition-all ${
                      isSelected
                        ? "border-[#F5C518] bg-[#F5C518]/10 text-[#F5C518] font-bold"
                        : "border-white/10 bg-white/[0.04] text-[#94A3B8] hover:border-white/20"
                    } ${!isVariantInStock ? "opacity-40 line-through" : ""}`}
                  >
                    {variant.title}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pricing and Action Button */}
        <div className="space-y-3 pt-2 border-t border-white/[0.06]">
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-bold text-white tracking-tight">
              {formatPrice(currentPrice)}
            </span>
            {isOnSale && currentCompareAt && (
              <span className="text-xs sm:text-sm text-[#64748B] line-through">
                {formatPrice(currentCompareAt)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={!inStock || isAdding}
            className={`
              w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2
              ${
                !inStock
                  ? "bg-white/[0.04] text-[#64748B] border border-white/5 cursor-not-allowed"
                  : isAdding
                  ? "bg-[#F5C518] text-[#0A0A0C] scale-95"
                  : "bg-white/[0.06] hover:bg-[#F5C518] text-white hover:text-[#0A0A0C] border border-white/10 hover:border-[#F5C518] shadow-sm hover:shadow-goldGlow active:scale-95"
              }
            `}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{!inStock ? "Sold Out" : isAdding ? "Added to Bag" : "Add to Bag"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
