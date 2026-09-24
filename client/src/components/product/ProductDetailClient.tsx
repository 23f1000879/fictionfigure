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
import { API_BASE, safeApiFetch } from "@/lib/api";
import { ProductReviews } from "./ProductReviews";

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

  // Helper to retrieve token from all supported localStorage keys
  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("fictionfigure_token") || localStorage.getItem("token");
  };

  // Restock Request State
  const [hasRequestedRestock, setHasRequestedRestock] = useState(false);
  const [requestedQuantity, setRequestedQuantity] = useState(1);
  const [desiredRestockQty, setDesiredRestockQty] = useState(1);
  const [restockRequestId, setRestockRequestId] = useState<string | null>(null);
  const [isRestockLoading, setIsRestockLoading] = useState(false);
  const [restockNotice, setRestockNotice] = useState<string | null>(null);
  const [restockErr, setRestockErr] = useState<string | null>(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isClothingCategory = Boolean(
    product.category?.slug === "clothing" ||
    product.category?.slug === "tshirt" ||
    product.category?.slug === "t-shirt" ||
    product.category?.slug === "tshirts" ||
    product.category?.slug === "t-shirts" ||
    product.category?.name?.toLowerCase()?.includes("clothing") ||
    product.category?.name?.toLowerCase()?.includes("tshirt") ||
    product.category?.name?.toLowerCase()?.includes("t shirt") ||
    product.category?.name?.toLowerCase()?.includes("t-shirt")
  );

  const hasVariants = Boolean(
    product.variants &&
    (product.variants.length > 1 ||
      (product.variants.length === 1 &&
        product.variants[0].title !== "Standard Edition" &&
        product.variants[0].title !== "Standard" &&
        product.variants[0].title !== "Default Title"))
  );

  const [variantError, setVariantError] = useState<string | null>(null);

  const currentVariant = product.variants[selectedVariantIndex] || product.variants[0];
  const currentPrice = currentVariant?.price || product.price;
  const currentCompareAt = currentVariant?.compareAtPrice || product.compareAtPrice;
  const inStock = currentVariant ? currentVariant.inventoryCount > 0 : false;
  const isLowStock = currentVariant && currentVariant.inventoryCount > 0 && currentVariant.inventoryCount <= 3;

  const currentImage =
    currentVariant?.imageUrl ||
    product.images[selectedImageIndex]?.url ||
    product.images[0]?.url ||
    "";

  // Check if customer already has a pending restock request for this product
  React.useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    safeApiFetch<{ success: boolean; requests: any[] }>(`${API_BASE}/restock-requests/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        if (data.success && Array.isArray(data.requests)) {
          const existing = data.requests.find(
            (r: any) => r.productId === product.id && r.status === "PENDING"
          );
          if (existing) {
            setHasRequestedRestock(true);
            setRequestedQuantity(existing.quantity);
            setRestockRequestId(existing.id);
          }
        }
      })
      .catch(() => {});
  }, [product.id]);

  const handleRestockButtonClick = () => {
    const token = getAuthToken();
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    setDesiredRestockQty(1);
    setShowRestockModal(true);
  };

  const handleConfirmRestockRequest = async () => {
    const token = getAuthToken();
    if (!token) {
      setShowAuthModal(true);
      setShowRestockModal(false);
      return;
    }

    setIsRestockLoading(true);
    setRestockErr(null);
    setRestockNotice(null);

    try {
      const data = await safeApiFetch<{ success: boolean; message?: string; request?: any; error?: string }>(
        `${API_BASE}/restock-requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product.id,
            quantity: desiredRestockQty,
          }),
        }
      );

      if (data.success && data.request) {
        setHasRequestedRestock(true);
        setRequestedQuantity(data.request.quantity);
        setRestockRequestId(data.request.id);
        setRestockNotice(data.message || "You're on the restock priority list!");
        setShowRestockModal(false);
      } else {
        setRestockErr(data.error || "Unable to submit restock request. Please try again.");
      }
    } catch (err: any) {
      setRestockErr(err.message || "Unable to submit restock request. Please try again.");
    } finally {
      setIsRestockLoading(false);
    }
  };

  const handleUpdateRestockQuantity = async (newQty: number) => {
    if (!restockRequestId) return;
    const token = getAuthToken();
    if (!token) return;

    setIsRestockLoading(true);
    try {
      const data = await safeApiFetch<{ success: boolean; request?: any }>(
        `${API_BASE}/restock-requests/${restockRequestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity: Math.max(1, newQty) }),
        }
      );

      if (data.success && data.request) {
        setRequestedQuantity(data.request.quantity);
        setRestockNotice("Requested quantity updated.");
      }
    } catch (err: any) {
      setRestockErr(err.message || "Failed to update quantity.");
    } finally {
      setIsRestockLoading(false);
    }
  };

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
    if (!currentVariant || !inStock) return;
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
    <div className="space-y-8 sm:space-y-12 lg:space-y-16 w-full max-w-full overflow-hidden box-border">
      {/* Breadcrumb Navigation - Scrollable on mobile */}
      <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] overflow-x-auto whitespace-nowrap scrollbar-none w-full max-w-full py-1">
        <Link href="/" className="hover:text-[#111111] shrink-0">
          Home
        </Link>
        <span className="shrink-0">/</span>
        <Link href="/shop" className="hover:text-[#111111] shrink-0">
          Shop
        </Link>
        <span className="shrink-0">/</span>
        <Link href={`/shop?category=${product.category.slug}`} className="hover:text-[#111111] shrink-0">
          {product.category.name}
        </Link>
        <span className="shrink-0">/</span>
        <span className="text-[#111111] shrink-0">{product.name}</span>
      </div>

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 w-full max-w-full box-border">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4 w-full max-w-full box-border">
          {/* Large Main Image */}
          <div className="relative aspect-[3/4] w-full max-w-full bg-white border border-[#E5E5E2] overflow-hidden group box-border">
            {currentImage ? (
              <Image
                src={currentImage}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                className="object-cover cursor-zoom-in max-w-full"
                onClick={() => setIsLightboxOpen(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-[#6B6B6B]">
                No image preview
              </div>
            )}

            <button
              onClick={() => setIsLightboxOpen(true)}
              className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-xs border border-[#E5E5E2] hover:bg-white text-[#111111] transition-all min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Expand image"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnail Selector Strip */}
          {product.images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2 w-full max-w-full scrollbar-none box-border">
              {product.images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 bg-white border shrink-0 overflow-hidden transition-all ${
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
        <div className="space-y-6 sm:space-y-8 w-full max-w-full box-border">
          <div className="space-y-2 w-full max-w-full">
            <div className="flex flex-wrap justify-between items-center text-xs uppercase font-semibold tracking-widest text-[#6B6B6B] gap-2">
              <span className="truncate max-w-[200px]">{product.brand}</span>
              <div className="flex items-center space-x-1 bg-white px-2 py-0.5 border border-[#E5E5E2] shrink-0">
                <Star className="w-3.5 h-3.5 fill-[#111111] text-[#111111]" />
                <span className="font-mono text-[#111111] font-semibold">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-[#6B6B6B] font-mono">({product.reviewCount})</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#111111] tracking-tight leading-snug break-words max-w-full">
              {product.name}
            </h1>

            <p className="text-xs text-[#6B6B6B] leading-relaxed break-words max-w-full">
              {product.shortDescription}
            </p>
          </div>

          {/* Price & Stock Display */}
          <div className="p-4 bg-white border border-[#E5E5E2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full max-w-full box-border">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl font-bold font-mono text-[#111111]">
                  {formatPrice(currentPrice)}
                </span>
                {currentCompareAt && (
                  <span className="text-xs sm:text-sm font-mono text-[#6B6B6B] line-through">
                    {formatPrice(currentCompareAt)}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#6B6B6B] uppercase font-mono block mt-1 break-all">
                SKU: {currentVariant.sku}
              </span>
            </div>

            <div className="shrink-0 self-start sm:self-auto">
              {inStock ? (
                isLowStock ? (
                  <span className="bg-[#B86E00] text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 inline-block">
                    Only {currentVariant.inventoryCount} Left
                  </span>
                ) : (
                  <span className="bg-[#2E6B44] text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 inline-block">
                    In Stock
                  </span>
                )
              ) : (
                <span className="bg-[#A83232] text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 inline-block">
                  Sold Out
                </span>
              )}
            </div>
          </div>

          {/* Generic Variant Selector */}
          {hasVariants && (
            <div className="space-y-3 w-full max-w-full">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#111111] block font-mono">
                SELECT VARIANT: <span className="text-[#D4AF37] font-bold">{currentVariant?.title}</span>
              </label>
              <div className="flex flex-wrap gap-2.5 w-full max-w-full">
                {product.variants.map((v, idx) => {
                  const isSelected = selectedVariantIndex === idx;
                  const isOutOfStock = v.inventoryCount <= 0;

                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => {
                        setSelectedVariantIndex(idx);
                        setVariantError(null);
                      }}
                      className={`min-h-[44px] px-4 py-2 border text-xs font-bold font-mono transition-all flex items-center justify-center space-x-2 relative ${
                        isSelected
                          ? "border-[#111111] bg-[#111111] text-white shadow-sm"
                          : isOutOfStock
                          ? "border-[#E5E5E2] bg-[#F7F7F5] text-[#A0A0A0] cursor-not-allowed opacity-50 line-through"
                          : "border-[#E5E5E2] bg-white text-[#111111] hover:border-[#111111]"
                      }`}
                    >
                      <span>{v.title}</span>
                      {v.price && v.price !== product.price && (
                        <span className={`text-[10px] font-normal ${isSelected ? "text-[#D4AF37]" : "text-[#6B6B6B]"}`}>
                          ({formatPrice(v.price)})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {variantError && (
                <div className="p-3 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold">
                  {variantError}
                </div>
              )}
            </div>
          )}

          {/* Quantity Controls & Action Buttons */}
          <div className="space-y-4 pt-2 w-full max-w-full box-border">
            <div className="flex flex-wrap items-center gap-3 w-full max-w-full">
              <div className="flex items-center space-x-2 shrink-0">
                <label className="text-xs font-semibold uppercase tracking-widest text-[#111111]">
                  Qty:
                </label>
                <div className="flex items-center border border-[#E5E5E2] bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B6B6B] hover:text-[#111111]"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-xs font-mono font-semibold text-[#111111]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B6B6B] hover:text-[#111111]"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`min-w-[44px] min-h-[44px] flex items-center justify-center border transition-colors ${
                    isWishlisted
                      ? "border-[#111111] bg-[#111111] text-white"
                      : "border-[#E5E5E2] bg-white text-[#111111] hover:border-[#111111]"
                  }`}
                  title="Save to Wishlist"
                  aria-label="Save to Wishlist"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? "fill-white" : ""}`} />
                </button>

                <button
                  onClick={handleShare}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center border border-[#E5E5E2] bg-white text-[#111111] hover:border-[#111111]"
                  title="Share figure"
                  aria-label="Share figure"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-[#2E6B44]" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons: Add to Cart & Buy Now (In Stock) vs Request Restock (Out of Stock) */}
            {inStock ? (
              <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full max-w-full box-border">
                <button
                  onClick={handleAddToCart}
                  className="w-full min-h-[48px] px-6 py-3.5 bg-white border-2 border-[#111111] text-[#111111] text-xs font-bold uppercase tracking-widest hover:bg-[#111111] hover:text-white transition-colors flex items-center justify-center max-w-full box-border"
                >
                  <ShoppingBag className="w-4 h-4 mr-2 shrink-0" /> Add to Cart
                </button>

                <button
                  onClick={handleBuyNow}
                  className="w-full min-h-[48px] px-6 py-3.5 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center max-w-full box-border"
                >
                  Buy Now <ChevronRight className="w-4 h-4 ml-1 shrink-0" />
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2 w-full max-w-full box-border">
                {restockNotice && (
                  <div className="p-3 bg-[#E8F5E9] border border-[#2E6B44] text-[#2E6B44] text-xs font-semibold">
                    {restockNotice}
                  </div>
                )}
                {restockErr && (
                  <div className="p-3 bg-[#FFEBEE] border border-[#A83232] text-[#A83232] text-xs font-semibold">
                    {restockErr}
                  </div>
                )}

                {hasRequestedRestock ? (
                  <div className="bg-[#FAF9F6] border border-[#E5E5E2] p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#2E6B44]">
                      <span className="flex items-center">
                        <Check className="w-4 h-4 mr-1.5" /> RESTOCK REQUESTED
                      </span>
                      <span className="font-mono text-[#111111]">Requested Qty: {requestedQuantity}</span>
                    </div>
                    <p className="text-[11px] text-[#6B6B6B]">
                      You're on the priority notification list! We will contact you when new stock arrives.
                    </p>
                    <div className="flex items-center gap-2 pt-1 border-t border-[#E5E5E2]">
                      <span className="text-[11px] font-semibold text-[#111111] uppercase tracking-wider">
                        Update Quantity:
                      </span>
                      <div className="flex items-center border border-[#E5E5E2] bg-white">
                        <button
                          onClick={() => handleUpdateRestockQuantity(Math.max(1, requestedQuantity - 1))}
                          disabled={isRestockLoading}
                          className="px-2.5 py-1 text-xs font-semibold text-[#6B6B6B] hover:text-[#111111] disabled:opacity-40"
                        >
                          -
                        </button>
                        <span className="px-2.5 font-mono text-xs font-semibold text-[#111111]">
                          {requestedQuantity}
                        </span>
                        <button
                          onClick={() => handleUpdateRestockQuantity(requestedQuantity + 1)}
                          disabled={isRestockLoading}
                          className="px-2.5 py-1 text-xs font-semibold text-[#6B6B6B] hover:text-[#111111] disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRestockButtonClick}
                    disabled={isRestockLoading}
                    className="w-full min-h-[48px] px-6 py-3.5 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed max-w-full box-border"
                  >
                    {isRestockLoading ? "REQUESTING..." : "NOTIFY ME WHEN RESTOCKED"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* QUANTITY SELECTOR MODAL */}
          {showRestockModal && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white border border-[#E5E5E2] p-6 max-w-md w-full space-y-5 text-[#111111] text-xs shadow-2xl">
                <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B] block">
                      Priority Restock Alert
                    </span>
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#111111]">
                      Request Restock
                    </h3>
                  </div>
                  <button onClick={() => setShowRestockModal(false)} className="text-[#6B6B6B] hover:text-[#111111]">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-[#6B6B6B]">
                    How many units of <strong>"{product.name}"</strong> would you like to request?
                  </p>
                  <div className="flex items-center space-x-3 pt-2">
                    <span className="font-semibold text-xs text-[#111111] uppercase tracking-wider">Quantity:</span>
                    <div className="flex items-center border border-[#E5E5E2] bg-[#FAF9F6]">
                      <button
                        type="button"
                        onClick={() => setDesiredRestockQty(Math.max(1, desiredRestockQty - 1))}
                        className="px-3 py-1.5 text-sm font-bold text-[#6B6B6B] hover:text-[#111111]"
                      >
                        -
                      </button>
                      <span className="px-4 font-mono text-sm font-bold text-[#111111]">{desiredRestockQty}</span>
                      <button
                        type="button"
                        onClick={() => setDesiredRestockQty(desiredRestockQty + 1)}
                        className="px-3 py-1.5 text-sm font-bold text-[#6B6B6B] hover:text-[#111111]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#E5E5E2]">
                  <button
                    type="button"
                    onClick={() => setShowRestockModal(false)}
                    className="px-4 py-2.5 border border-[#E5E5E2] font-semibold text-xs uppercase tracking-wider text-[#6B6B6B] hover:text-[#111111]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRestockRequest}
                    disabled={isRestockLoading}
                    className="px-6 py-2.5 bg-[#111111] text-white font-bold text-xs uppercase tracking-widest hover:bg-black disabled:opacity-50"
                  >
                    {isRestockLoading ? "SUBMITTING..." : "REQUEST RESTOCK"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AUTHENTICATION REQUIRED PROMPT MODAL */}
          {showAuthModal && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white border border-[#E5E5E2] p-6 max-w-sm w-full space-y-4 text-center text-[#111111] text-xs shadow-2xl">
                <div className="w-10 h-10 rounded-full bg-[#FAF9F6] border border-[#E5E5E2] flex items-center justify-center mx-auto text-[#111111]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#111111]">
                    Sign In Required
                  </h3>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed">
                    Please sign in to request a restock notification for this collectible.
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/login?redirect=/products/${product.slug}`)}
                    className="w-full py-3 bg-[#111111] text-white font-bold text-xs uppercase tracking-widest hover:bg-black"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(false)}
                    className="w-full py-2.5 border border-[#E5E5E2] text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] hover:text-[#111111]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Guarantees List */}
          <div className="grid grid-cols-3 gap-2 py-4 border-y border-[#E5E5E2] text-[10px] sm:text-[11px] text-[#6B6B6B] w-full max-w-full box-border">
            <div className="flex flex-col items-center text-center p-1">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#111111] mb-1" />
              <span>100% Authentic</span>
            </div>
            <div className="flex flex-col items-center text-center p-1">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-[#111111] mb-1" />
              <span>Insured Shipping</span>
            </div>
            <div className="flex flex-col items-center text-center p-1">
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-[#111111] mb-1" />
              <span>14-Day Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accordion Information Tabs - Scrollable Tab Strip on Mobile */}
      <div className="bg-white border border-[#E5E5E2] w-full max-w-full overflow-hidden box-border">
        <div className="flex border-b border-[#E5E5E2] overflow-x-auto text-xs font-semibold uppercase tracking-widest w-full max-w-full scrollbar-none whitespace-nowrap">
          {(["description", "specs", "included", "shipping"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 sm:px-6 py-3.5 sm:py-4 border-b-2 transition-all shrink-0 ${
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

        <div className="p-4 sm:p-6 md:p-8 text-xs text-[#111111] leading-relaxed w-full max-w-full overflow-hidden box-border">
          {activeTab === "description" && (
            <div className="space-y-4 max-w-3xl w-full">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
                Craftsmanship & Story
              </h4>
              <p className="whitespace-pre-line text-[#6B6B6B] break-words">{product.description}</p>
            </div>
          )}

          {activeTab === "specs" && (
            <div className="max-w-xl w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <tbody>
                  <tr className="border-b border-[#E5E5E2]">
                    <td className="py-2.5 font-semibold text-[#6B6B6B] uppercase text-[10px] sm:text-[11px] w-1/3 pr-2">Studio Brand</td>
                    <td className="py-2.5 font-semibold text-[#111111] break-all">{product.brand || "Not Specified"}</td>
                  </tr>
                  <tr className="border-b border-[#E5E5E2]">
                    <td className="py-2.5 font-semibold text-[#6B6B6B] uppercase text-[10px] sm:text-[11px] pr-2">Material Composition</td>
                    <td className="py-2.5 break-all">{product.material || "Not Specified"}</td>
                  </tr>
                  <tr className="border-b border-[#E5E5E2]">
                    <td className="py-2.5 font-semibold text-[#6B6B6B] uppercase text-[10px] sm:text-[11px] pr-2">Scale / Ratio</td>
                    <td className="py-2.5 break-all">{product.scale || "Not Specified"}</td>
                  </tr>
                  <tr className="border-b border-[#E5E5E2]">
                    <td className="py-2.5 font-semibold text-[#6B6B6B] uppercase text-[10px] sm:text-[11px] pr-2">Franchise</td>
                    <td className="py-2.5 break-all">{product.franchise || "Not Specified"}</td>
                  </tr>
                  <tr className="border-b border-[#E5E5E2]">
                    <td className="py-2.5 font-semibold text-[#6B6B6B] uppercase text-[10px] sm:text-[11px] pr-2">Master SKU</td>
                    <td className="py-2.5 font-mono break-all">{product.sku}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "included" && (
            <div className="space-y-3 max-w-lg w-full">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
                Collector Box Contents
              </h4>
              <ul className="space-y-2 text-[#6B6B6B] list-disc list-inside break-words">
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
            <div className="space-y-4 max-w-2xl text-[#6B6B6B] w-full">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
                Collector Protection Policy
              </h4>
              <p className="break-words">
                All orders are packed inside double-walled corrugated outer shipping boxes with high-density foam padding to guarantee mint condition delivery.
              </p>
              <p className="break-words">
                Unopened items in original factory seal can be returned within 14 days of receipt. Free replacements provided immediately in case of transit damage.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Verified Customer Reviews Section */}
      <ProductReviews
        productId={product.id}
        productSlug={product.slug}
        productName={product.name}
      />

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 text-white hover:text-[#6B6B6B] min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close image preview"
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
