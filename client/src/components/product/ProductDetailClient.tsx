"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  ChevronRight,
  Plus,
  Minus,
  Maximize2,
  X,
  Share2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    slug: string;
    brand: string;
    shortDescription: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    sku: string;
    rating: number;
    reviewCount: number;
    material?: string | null;
    scale?: string | null;
    franchise?: string | null;
    whatsIncluded?: string | null;
    category: { name: string; slug: string };
    images: { id: string; url: string; altText?: string | null }[];
    variants: {
      id: string;
      title: string;
      sku: string;
      price: number;
      compareAtPrice?: number | null;
      inventoryCount: number;
      imageUrl?: string | null;
      options: { name: string; value: string }[];
    }[];
    reviews: {
      id: string;
      authorName: string;
      rating: number;
      title: string;
      comment: string;
      createdAt: Date;
    }[];
  };
}

export function ProductDetailClient({ product }: ProductDetailProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "included" | "shipping">("description");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const currentVariant = product.variants[selectedVariantIndex] || product.variants[0];
  const currentPrice = currentVariant?.price || product.price;
  const currentCompareAt = currentVariant?.compareAtPrice || product.compareAtPrice;
  const inStock = currentVariant ? currentVariant.inventoryCount > 0 : false;
  const isLowStock = currentVariant && currentVariant.inventoryCount > 0 && currentVariant.inventoryCount <= 3;

  const currentImage = product.images[selectedImageIndex]?.url || product.images[0]?.url || "";

  const handleAddToCart = () => {
    if (!currentVariant || !inStock) return;
    addItem({
      variantId: currentVariant.id,
      productId: product.id,
      title: product.name,
      variantTitle: currentVariant.title,
      price: currentPrice,
      image: currentImage,
      quantity,
      sku: currentVariant.sku,
      brand: product.brand,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="space-y-16">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-[#6B6B6B]">
        <Link href="/" className="hover:text-[#111111]">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[#111111]">
          Shop
        </Link>
        <span>/</span>
        <Link href={`/shop?category=${product.category.slug}`} className="hover:text-[#111111]">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-[#111111] truncate max-w-[200px]">{product.name}</span>
      </div>

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          {/* Large Main Image */}
          <div className="relative aspect-[3/4] bg-white border border-[#E5E5E2] overflow-hidden group">
            {currentImage ? (
              <Image
                src={currentImage}
                alt={product.name}
                fill
                priority
                className="object-cover cursor-zoom-in"
                onClick={() => setIsLightboxOpen(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-[#6B6B6B]">
                No image preview
              </div>
            )}

            <button
              onClick={() => setIsLightboxOpen(true)}
              className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-xs border border-[#E5E5E2] hover:bg-white text-[#111111] transition-all"
              title="Expand image"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnail Selector Strip */}
          {product.images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-20 bg-white border shrink-0 overflow-hidden transition-all ${
                    selectedImageIndex === idx
                      ? "border-[#111111] ring-1 ring-[#111111]"
                      : "border-[#E5E5E2] opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Purchase Controls */}
        <div className="space-y-8">
          <div>
            <div className="flex justify-between items-center text-xs uppercase font-semibold tracking-widest text-[#6B6B6B] mb-2">
              <span>{product.brand}</span>
              <div className="flex items-center space-x-1 bg-white px-2 py-0.5 border border-[#E5E5E2]">
                <Star className="w-3.5 h-3.5 fill-[#111111] text-[#111111]" />
                <span className="font-mono text-[#111111] font-semibold">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-[#6B6B6B] font-mono">({product.reviewCount})</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold text-[#111111] tracking-tight leading-snug">
              {product.name}
            </h1>

            <p className="text-xs text-[#6B6B6B] mt-2 leading-relaxed">
              {product.shortDescription}
            </p>
          </div>

          {/* Price & Stock Display */}
          <div className="p-4 bg-white border border-[#E5E5E2] flex items-center justify-between">
            <div>
              <div className="flex items-baseline space-x-3">
                <span className="text-2xl font-bold font-mono text-[#111111]">
                  {formatPrice(currentPrice)}
                </span>
                {currentCompareAt && (
                  <span className="text-sm font-mono text-[#6B6B6B] line-through">
                    {formatPrice(currentCompareAt)}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#6B6B6B] uppercase font-mono block mt-1">
                SKU: {currentVariant.sku}
              </span>
            </div>

            <div>
              {inStock ? (
                isLowStock ? (
                  <span className="bg-[#B86E00] text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1">
                    Only {currentVariant.inventoryCount} Left
                  </span>
                ) : (
                  <span className="bg-[#2E6B44] text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1">
                    In Stock
                  </span>
                )
              ) : (
                <span className="bg-[#A83232] text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1">
                  Sold Out
                </span>
              )}
            </div>
          </div>

          {/* Variant Selector */}
          {product.variants.length > 1 && (
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#111111] block">
                Select Edition / Scale:
              </label>
              <div className="grid grid-cols-2 gap-3">
                {product.variants.map((v, idx) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariantIndex(idx)}
                    className={`p-3 text-left border transition-all text-xs ${
                      selectedVariantIndex === idx
                        ? "border-[#111111] bg-white font-semibold text-[#111111]"
                        : "border-[#E5E5E2] bg-[#F7F7F5] text-[#6B6B6B] hover:border-[#111111]"
                    }`}
                  >
                    <span className="block font-medium">{v.title}</span>
                    <span className="font-mono text-[11px] block mt-0.5 text-[#111111]">
                      {formatPrice(v.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Controls & Action Buttons */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-4">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#111111]">
                Qty:
              </label>
              <div className="flex items-center border border-[#E5E5E2] bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-[#6B6B6B] hover:text-[#111111]"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-xs font-mono font-semibold text-[#111111]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 text-[#6B6B6B] hover:text-[#111111]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`p-2.5 border transition-colors ${
                  isWishlisted
                    ? "border-[#111111] bg-[#111111] text-white"
                    : "border-[#E5E5E2] bg-white text-[#111111] hover:border-[#111111]"
                }`}
                title="Save to Wishlist"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? "fill-white" : ""}`} />
              </button>

              <button
                onClick={handleShare}
                className="p-2.5 border border-[#E5E5E2] bg-white text-[#111111] hover:border-[#111111]"
                title="Share figure"
              >
                {copiedLink ? <Check className="w-4 h-4 text-[#2E6B44]" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className="w-full py-3.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                <ShoppingBag className="w-4 h-4 mr-2" /> Add to Cart
              </button>

              <button
                onClick={handleBuyNow}
                disabled={!inStock}
                className="w-full py-3.5 bg-transparent border border-[#111111] text-[#111111] text-xs font-semibold uppercase tracking-widest hover:bg-[#111111] hover:text-white disabled:opacity-50 transition-colors"
              >
                Buy Now
              </button>
            </div>
          </div>

          {/* Guarantees List */}
          <div className="grid grid-cols-3 gap-2 py-4 border-y border-[#E5E5E2] text-[11px] text-[#6B6B6B]">
            <div className="flex flex-col items-center text-center p-2">
              <ShieldCheck className="w-5 h-5 text-[#111111] mb-1" />
              <span>100% Authentic</span>
            </div>
            <div className="flex flex-col items-center text-center p-2">
              <Truck className="w-5 h-5 text-[#111111] mb-1" />
              <span>Insured Shipping</span>
            </div>
            <div className="flex flex-col items-center text-center p-2">
              <RotateCcw className="w-5 h-5 text-[#111111] mb-1" />
              <span>14-Day Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accordion Information Tabs */}
      <div className="bg-white border border-[#E5E5E2]">
        <div className="flex border-b border-[#E5E5E2] overflow-x-auto text-xs font-semibold uppercase tracking-widest">
          {(["description", "specs", "included", "shipping"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "border-[#111111] text-[#111111] bg-[#F7F7F5]"
                  : "border-transparent text-[#6B6B6B] hover:text-[#111111]"
              }`}
            >
              {tab === "description" && "Description"}
              {tab === "specs" && "Specifications"}
              {tab === "included" && "What's Included"}
              {tab === "shipping" && "Shipping & Returns"}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8 text-xs text-[#111111] leading-relaxed">
          {activeTab === "description" && (
            <div className="space-y-4 max-w-3xl">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
                Craftsmanship & Story
              </h4>
              <p className="whitespace-pre-line text-[#6B6B6B]">{product.description}</p>
            </div>
          )}

          {activeTab === "specs" && (
            <div className="max-w-xl">
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr className="border-b border-[#E5E5E2]">
                    <td className="py-2.5 font-semibold text-[#6B6B6B] uppercase text-[11px] w-1/3">Studio Brand</td>
                    <td className="py-2.5 font-semibold text-[#111111]">{product.brand || "Not Specified"}</td>
                  </tr>
                  <tr className="border-b border-[#E5E5E2]">
                    <td className="py-2.5 font-semibold text-[#6B6B6B] uppercase text-[11px]">Material Composition</td>
                    <td className="py-2.5">{product.material || "Not Specified"}</td>
                  </tr>
                  <tr className="border-b border-[#E5E5E2]">
                    <td className="py-2.5 font-semibold text-[#6B6B6B] uppercase text-[11px]">Scale / Ratio</td>
                    <td className="py-2.5">{product.scale || "Not Specified"}</td>
                  </tr>
                  <tr className="border-b border-[#E5E5E2]">
                    <td className="py-2.5 font-semibold text-[#6B6B6B] uppercase text-[11px]">Franchise</td>
                    <td className="py-2.5">{product.franchise || "Not Specified"}</td>
                  </tr>
                  <tr className="border-b border-[#E5E5E2]">
                    <td className="py-2.5 font-semibold text-[#6B6B6B] uppercase text-[11px]">Master SKU</td>
                    <td className="py-2.5 font-mono">{product.sku}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "included" && (
            <div className="space-y-3 max-w-lg">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
                Collector Box Contents
              </h4>
              <ul className="space-y-2 text-[#6B6B6B] list-disc list-inside">
                {product.whatsIncluded ? (
                  product.whatsIncluded
                    .split(/\r?\n|,/)
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .map((item, idx) => <li key={idx}>{item}</li>)
                ) : (
                  <li>1x Main Collectible Statue ({product.name})</li>
                )}
              </ul>
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="space-y-4 max-w-2xl text-[#6B6B6B]">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
                Collector Protection Policy
              </h4>
              <p>
                All orders are packed inside double-walled corrugated outer shipping boxes with high-density foam padding to guarantee mint condition delivery.
              </p>
              <p>
                Unopened items in original factory seal can be returned within 14 days of receipt. Free replacements provided immediately in case of transit damage.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews Section */}
      {product.reviews.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-[#E5E5E2]">
          <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-4">
            <h3 className="text-lg font-semibold text-[#111111] tracking-tight">
              Collector Reviews ({product.reviews.length})
            </h3>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 fill-[#111111] text-[#111111]" />
              <span className="font-mono text-[#111111] font-bold">
                {product.rating.toFixed(1)} / 5.0
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.reviews.map((rev) => (
              <div key={rev.id} className="p-4 bg-white border border-[#E5E5E2] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-[#111111]">{rev.authorName}</span>
                  <div className="flex text-[#111111]">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-[#111111]" />
                    ))}
                  </div>
                </div>
                <h5 className="text-xs font-semibold text-[#111111]">{rev.title}</h5>
                <p className="text-xs text-[#6B6B6B] leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 p-2 text-white hover:text-[#6B6B6B]"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full max-w-4xl h-[80vh]">
            <Image
              src={currentImage}
              alt={product.name}
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
