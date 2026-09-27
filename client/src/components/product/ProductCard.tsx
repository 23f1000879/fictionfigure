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
      brand: product.brand || product.category?.name || "Fiction Figures",
    });

    setTimeout(() => {
      setIsAdding(false);
    }, 400);
  };

  const brandOrCategory = product.category?.name || product.brand || "Collectible";
  const hasRealRating = Boolean(product.rating && product.rating > 0 && product.reviewCount && product.reviewCount > 0);

  return (
    <div className="group relative flex flex-col h-full bg-[#111318] rounded-[10px] border border-white/[0.08] hover:border-white/[0.2] transition-colors duration-300 overflow-hidden text-[#F7F7F5]">
      {/* Artwork — dominates the card */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-[radial-gradient(ellipse_at_50%_35%,#22242c_0%,#111318_55%,#0b0c0f_100%)]">
        <Link href={`/products/${product.slug}`} className="absolute inset-0 block" aria-label={product.name}>
          {primaryImage ? (
            <>
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
                className={`object-contain transition-all duration-500 ease-out group-hover:scale-[1.04] ${
                  secondaryImage ? "group-hover:opacity-0" : ""
                }`}
              />
              {secondaryImage && (
                <Image
                  src={secondaryImage}
                  alt=""
                  aria-hidden
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
                  className="object-contain opacity-0 group-hover:opacity-100 group-hover:scale-[1.04] transition-all duration-500 ease-out pointer-events-none"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[11px] text-[#6E717A]">
              Artwork unavailable
            </div>
          )}
        </Link>

        {/* Wishlist */}
        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await toggleWishlist(product.id);
          }}
          className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-[#08090B]/55 backdrop-blur-md border border-white/15 flex items-center justify-center hover:border-white/40 transition-colors"
          aria-label={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${isWishlisted ? "fill-[#F5C518] text-[#F5C518]" : "text-white"}`}
          />
        </button>

        {/* Image stepper */}
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-[#08090B]/60 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center"
              aria-label="Previous product image"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-[#08090B]/60 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center"
              aria-label="Next product image"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {/* Status badge */}
        <div className="absolute top-2 left-2 z-10 flex gap-1 pointer-events-none">
          {!inStock ? (
            <Badge variant="danger" size="sm">Sold Out</Badge>
          ) : isLowStock ? (
            <Badge variant="warning" size="sm">Only {currentStock} Left</Badge>
          ) : isOnSale && discountPercent > 0 ? (
            <Badge variant="gold" size="sm">{discountPercent}% OFF</Badge>
          ) : null}
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col px-3 pt-2.5 pb-3 gap-2">
        <div className="min-w-0">
          <Link
            href={`/products/${product.slug}`}
            className="block text-[13px] font-semibold leading-snug text-[#F7F7F5] hover:text-[#F5C518] transition-colors line-clamp-2 min-h-[2.2em]"
          >
            {product.name}
          </Link>
          <p className="mt-0.5 text-[11px] text-[#9A9DA5] truncate">{brandOrCategory}</p>
        </div>

        {hasVariants && (
          <div className="flex flex-wrap gap-1">
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
                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                    isSelected
                      ? "border-[#F5C518] text-[#F5C518]"
                      : "border-white/10 text-[#9A9DA5] hover:border-white/25"
                  } ${!isVariantInStock ? "opacity-40 line-through" : ""}`}
                >
                  {variant.title}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-[14px] font-extrabold text-[#F5C518] tracking-tight">{formatPrice(currentPrice)}</span>
            {isOnSale && currentCompareAt && (
              <span className="text-[11px] text-[#6E717A] line-through truncate">{formatPrice(currentCompareAt)}</span>
            )}
          </div>
          {hasRealRating && (
            <span className="flex items-center gap-0.5 text-[11px] text-[#F7F7F5]/90 shrink-0">
              <Star className="w-3 h-3 fill-[#F5C518] text-[#F5C518]" />
              {product.rating!.toFixed(1)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={!inStock || isAdding}
          className={`h-8 w-full rounded-[6px] text-[10px] font-extrabold uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 transition-colors ${
            !inStock
              ? "bg-white/[0.03] text-[#6E717A] border border-white/5 cursor-not-allowed"
              : isAdding
              ? "bg-[#F5C518] text-[#08090B] border border-[#F5C518]"
              : "bg-transparent text-[#F7F7F5] border border-white/15 hover:bg-[#F5C518] hover:border-[#F5C518] hover:text-[#08090B]"
          }`}
        >
          <ShoppingBag className="w-3 h-3" />
          <span>{!inStock ? "Sold Out" : isAdding ? "Added" : "Add to Bag"}</span>
        </button>
      </div>
    </div>
  );
}
