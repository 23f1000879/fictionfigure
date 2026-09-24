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
  ChevronLeft,
  Plus,
  Minus,
  Maximize2,
  X,
  Share2,
  CreditCard,
  Headphones,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
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
    reviews?: {
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
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Accordion open states
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    description: true,
    specs: true,
    included: true,
    shipping: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  const hasVariants = Boolean(
    product.variants &&
    (product.variants.length > 1 ||
      (product.variants.length === 1 &&
        product.variants[0].title !== "Standard Edition" &&
        product.variants[0].title !== "Standard" &&
        product.variants[0].title !== "Default Title"))
  );

  const currentVariant = product.variants[selectedVariantIndex] || product.variants[0];
  const currentPrice = currentVariant?.price || product.price;
  const currentCompareAt = currentVariant?.compareAtPrice || product.compareAtPrice;
  const inStock = currentVariant ? currentVariant.inventoryCount > 0 : false;
  const isLowStock = currentVariant && currentVariant.inventoryCount > 0 && currentVariant.inventoryCount <= 3;

  // Compute exact discount percentage if valid
  const discountPercent =
    currentCompareAt && currentCompareAt > currentPrice
      ? Math.round(((currentCompareAt - currentPrice) / currentCompareAt) * 100)
      : 0;

  // Active image priority: variant image if present, else selected image index
  const currentImage =
    currentVariant?.imageUrl ||
    product.images[selectedImageIndex]?.url ||
    product.images[0]?.url ||
    "";

  const isWishlisted = isInWishlist(product.id);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(product.id);
  };

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

  const handlePrevImage = () => {
    if (!product.images || product.images.length === 0) return;
    setSelectedImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!product.images || product.images.length === 0) return;
    setSelectedImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-10 sm:space-y-14 w-full max-w-full overflow-hidden box-border">
      {/* Breadcrumb Navigation - Clean Editorial Path */}
      <nav className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] overflow-x-auto whitespace-nowrap scrollbar-none w-full max-w-full py-1 border-b border-[#E5E5E2] pb-3">
        <Link href="/" className="hover:text-[#111111] transition-colors shrink-0">
          Home
        </Link>
        <span className="text-[#A0A0A0] shrink-0">/</span>
        <Link href="/shop" className="hover:text-[#111111] transition-colors shrink-0">
          Shop
        </Link>
        <span className="text-[#A0A0A0] shrink-0">/</span>
        <Link href={`/shop?category=${product.category.slug}`} className="hover:text-[#111111] transition-colors shrink-0">
          {product.category.name}
        </Link>
        <span className="text-[#A0A0A0] shrink-0">/</span>
        <span className="text-[#111111] font-mono shrink-0 truncate max-w-[220px] sm:max-w-xs">{product.name}</span>
      </nav>

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full max-w-full box-border items-start">
        
        {/* Left Column: Image Gallery (7 Cols Desktop) */}
        <div className="lg:col-span-7 space-y-4 w-full max-w-full box-border">
          {/* Main Hero Product Image Surface */}
          <div className="relative aspect-square sm:aspect-[4/3] md:aspect-square w-full max-w-full bg-white border border-[#E5E5E2] rounded-lg overflow-hidden group box-border flex items-center justify-center shadow-2xs">
            {currentImage ? (
              <Image
                src={currentImage}
                alt={product.images[selectedImageIndex]?.altText || product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 720px"
                className="object-contain cursor-zoom-in max-w-full transition-transform duration-300 group-hover:scale-105"
                onClick={() => setIsLightboxOpen(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[#6B6B6B] space-y-2">
                <Sparkles className="w-6 h-6 text-[#A0A0A0]" />
                <span>No image artwork available</span>
              </div>
            )}

            {/* Discount Badge on Main Image */}
            {discountPercent > 0 && (
              <div className="absolute top-3 left-3 bg-[#D4AF37] text-black text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-xs shadow-xs pointer-events-none z-10">
                {discountPercent}% OFF
              </div>
            )}

            {/* Floating Wishlist Heart Button */}
            <button
              onClick={handleWishlistToggle}
              className={`absolute top-3 right-3 p-2.5 rounded-full border transition-all min-w-[40px] min-h-[40px] flex items-center justify-center z-10 shadow-xs ${
                isWishlisted
                  ? "bg-[#111111] text-white border-[#111111]"
                  : "bg-white/90 backdrop-blur-xs text-[#111111] border-[#E5E5E2] hover:bg-white"
              }`}
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-label="Wishlist toggle"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? "fill-white" : ""}`} />
            </button>

            {/* Previous / Next Image Navigation Controls */}
            {product.images && product.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs border border-[#E5E5E2] text-[#111111] hover:bg-white flex items-center justify-center transition-all shadow-xs z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs border border-[#E5E5E2] text-[#111111] hover:bg-white flex items-center justify-center transition-all shadow-xs z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Expand Lightbox Button */}
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-3 right-3 p-2 bg-white/90 backdrop-blur-xs border border-[#E5E5E2] hover:bg-white text-[#111111] rounded-lg transition-all min-w-[36px] min-h-[36px] flex items-center justify-center shadow-xs z-10"
              title="Expand full resolution"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnail Strip Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2 w-full max-w-full scrollbar-none box-border pt-1">
              {product.images.map((img, idx) => {
                const isSelected = selectedImageIndex === idx;
                return (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 bg-white border rounded-lg shrink-0 overflow-hidden transition-all box-border p-1 ${
                      isSelected
                        ? "border-[#111111] ring-2 ring-[#111111] ring-offset-1"
                        : "border-[#E5E5E2] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.altText || `${product.name} thumbnail ${idx + 1}`}
                      fill
                      className="object-contain p-1"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Purchase Controls (5 Cols Desktop) */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-7 w-full max-w-full box-border lg:sticky lg:top-24 lg:self-start">
          
          {/* Header & Brand Info */}
          <div className="space-y-2.5 w-full max-w-full border-b border-[#E5E5E2] pb-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#D4AF37] font-mono">
                {product.brand || product.category.name || "FICTIONFIGURE"}
              </span>

              {/* Verified Rating Pill - Rendered ONLY if real review data exists */}
              {product.reviewCount > 0 && product.rating > 0 && (
                <a
                  href="#reviews-section"
                  className="flex items-center space-x-1 bg-white px-2.5 py-1 rounded-md border border-[#E5E5E2] hover:border-[#111111] transition-colors shrink-0"
                >
                  <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                  <span className="font-mono text-xs font-extrabold text-[#111111]">
                    {product.rating.toFixed(1)}
                  </span>
                  <span className="text-[#6B6B6B] font-mono text-[11px]">({product.reviewCount})</span>
                </a>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight leading-tight break-words max-w-full">
              {product.name}
            </h1>

            {product.shortDescription && (
              <p className="text-xs text-[#6B6B6B] leading-relaxed break-words max-w-full">
                {product.shortDescription}
              </p>
            )}
          </div>

          {/* Pricing & Stock Card */}
          <div className="p-4 sm:p-5 bg-white border border-[#E5E5E2] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full max-w-full box-border shadow-2xs">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#111111]">
                  {formatPrice(currentPrice)}
                </span>

                {currentCompareAt && currentCompareAt > currentPrice && (
                  <span className="text-sm sm:text-base font-mono text-[#8E8E93] line-through">
                    {formatPrice(currentCompareAt)}
                  </span>
                )}
              </div>

              {currentVariant?.sku && (
                <span className="text-[10px] text-[#8E8E93] uppercase font-mono block tracking-wider">
                  SKU: {currentVariant.sku}
                </span>
              )}
            </div>

            {/* Stock Badge */}
            <div className="shrink-0 self-start sm:self-auto">
              {inStock ? (
                isLowStock ? (
                  <span className="bg-[#B86E00] text-white text-[10px] uppercase font-extrabold tracking-wider px-3 py-1.5 rounded-md inline-block shadow-2xs">
                    Only {currentVariant.inventoryCount} Left
                  </span>
                ) : (
                  <span className="bg-[#2E6B44] text-white text-[10px] uppercase font-extrabold tracking-wider px-3 py-1.5 rounded-md inline-block shadow-2xs">
                    In Stock
                  </span>
                )
              ) : (
                <span className="bg-[#A83232] text-white text-[10px] uppercase font-extrabold tracking-wider px-3 py-1.5 rounded-md inline-block shadow-2xs">
                  Sold Out
                </span>
              )}
            </div>
          </div>

          {/* Generic Variant Selector System */}
          {hasVariants && (
            <div className="space-y-3 w-full max-w-full bg-white border border-[#E5E5E2] rounded-lg p-4 shadow-2xs">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-[#111111] font-mono">
                <span>SELECT VARIANT:</span>
                <span className="text-[#D4AF37]">{currentVariant?.title}</span>
              </div>

              <div className="flex flex-wrap gap-2.5 w-full max-w-full pt-1">
                {product.variants.map((v, idx) => {
                  const isSelected = selectedVariantIndex === idx;
                  const isOutOfStock = v.inventoryCount <= 0;

                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => setSelectedVariantIndex(idx)}
                      className={`min-h-[44px] px-4 py-2 border rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center space-x-2 relative ${
                        isSelected
                          ? "border-[#111111] bg-[#111111] text-white shadow-xs"
                          : isOutOfStock
                          ? "border-[#E5E5E2] bg-[#FAF9F6] text-[#A0A0A0] cursor-not-allowed opacity-50 line-through"
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
            </div>
          )}

          {/* Quantity Controls & Actions */}
          <div className="space-y-4 w-full max-w-full box-border">
            
            <div className="flex flex-wrap items-center gap-3 w-full max-w-full">
              {/* Quantity Picker */}
              <div className="flex items-center space-x-3 shrink-0">
                <label className="text-xs font-bold uppercase tracking-widest text-[#111111] font-mono">
                  Quantity:
                </label>
                <div className="flex items-center border border-[#E5E5E2] bg-white rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || !inStock}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B6B6B] hover:text-[#111111] hover:bg-[#FAF9F6] disabled:opacity-40 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-3 min-w-[36px] text-center text-xs font-mono font-bold text-[#111111]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={!inStock || (currentVariant && quantity >= currentVariant.inventoryCount)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B6B6B] hover:text-[#111111] hover:bg-[#FAF9F6] disabled:opacity-40 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Utility Actions (Share Link) */}
              <div className="flex items-center space-x-2 ml-auto">
                <button
                  type="button"
                  onClick={handleShare}
                  className="min-w-[44px] min-h-[44px] px-3 flex items-center justify-center space-x-1.5 border border-[#E5E5E2] bg-white text-[#111111] hover:border-[#111111] rounded-lg text-xs font-semibold transition-colors"
                  title="Share product link"
                  aria-label="Share product"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-[#2E6B44]" />
                      <span className="text-[11px] text-[#2E6B44] font-mono">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span className="text-[11px] font-mono">Share</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Main CTAs: Add to Cart & Buy Now */}
            {inStock ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 w-full max-w-full box-border">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full min-h-[50px] px-6 py-3.5 bg-[#111111] text-white text-xs font-extrabold uppercase tracking-widest hover:bg-black rounded-lg transition-colors flex items-center justify-center max-w-full box-border shadow-xs"
                >
                  <ShoppingBag className="w-4 h-4 mr-2 shrink-0" /> Add to Cart
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full min-h-[50px] px-6 py-3.5 bg-white border-2 border-[#111111] text-[#111111] text-xs font-extrabold uppercase tracking-widest hover:bg-[#111111] hover:text-white rounded-lg transition-colors flex items-center justify-center max-w-full box-border shadow-2xs"
                >
                  Buy Now <ChevronRight className="w-4 h-4 ml-1 shrink-0" />
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1 w-full max-w-full box-border">
                {restockNotice && (
                  <div className="p-3.5 bg-[#E8F5E9] border border-[#2E6B44] text-[#2E6B44] text-xs font-semibold rounded-lg">
                    {restockNotice}
                  </div>
                )}
                {restockErr && (
                  <div className="p-3.5 bg-[#FFEBEE] border border-[#A83232] text-[#A83232] text-xs font-semibold rounded-lg">
                    {restockErr}
                  </div>
                )}

                {hasRequestedRestock ? (
                  <div className="bg-[#FAF9F6] border border-[#E5E5E2] rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-[#2E6B44]">
                      <span className="flex items-center">
                        <Check className="w-4 h-4 mr-1.5" /> RESTOCK REQUESTED
                      </span>
                      <span className="font-mono text-[#111111]">Qty: {requestedQuantity}</span>
                    </div>
                    <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
                      You are on the priority restock list. We will notify you immediately when stock arrives.
                    </p>
                    <div className="flex items-center gap-2 pt-2 border-t border-[#E5E5E2]">
                      <span className="text-[10px] font-extrabold text-[#111111] uppercase tracking-wider font-mono">
                        Update Qty:
                      </span>
                      <div className="flex items-center border border-[#E5E5E2] bg-white rounded-md overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateRestockQuantity(Math.max(1, requestedQuantity - 1))}
                          disabled={isRestockLoading}
                          className="px-2.5 py-1 text-xs font-bold text-[#6B6B6B] hover:text-[#111111] disabled:opacity-40"
                        >
                          -
                        </button>
                        <span className="px-2.5 font-mono text-xs font-bold text-[#111111]">
                          {requestedQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateRestockQuantity(requestedQuantity + 1)}
                          disabled={isRestockLoading}
                          className="px-2.5 py-1 text-xs font-bold text-[#6B6B6B] hover:text-[#111111] disabled:opacity-40"
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
                    className="w-full min-h-[50px] px-6 py-3.5 bg-[#111111] text-white text-xs font-extrabold uppercase tracking-widest hover:bg-black rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed max-w-full box-border shadow-xs"
                  >
                    {isRestockLoading ? "SUBMITTING..." : "NOTIFY ME WHEN RESTOCKED"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Service & Guarantee Highlights Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-white border border-[#E5E5E2] rounded-lg text-center text-[10px] sm:text-[11px] text-[#6B6B6B] font-medium w-full max-w-full box-border shadow-2xs">
            <div className="flex flex-col items-center p-1.5 space-y-1">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-semibold text-[#111111]">100% Authentic</span>
            </div>
            <div className="flex flex-col items-center p-1.5 space-y-1">
              <Truck className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-semibold text-[#111111]">Pan-India Delivery</span>
            </div>
            <div className="flex flex-col items-center p-1.5 space-y-1">
              <CreditCard className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-semibold text-[#111111]">Secure Payments</span>
            </div>
            <div className="flex flex-col items-center p-1.5 space-y-1">
              <Headphones className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-semibold text-[#111111]">Collector Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details & Information Accordion Section */}
      <div className="bg-white border border-[#E5E5E2] rounded-lg divide-y divide-[#E5E5E2] overflow-hidden shadow-2xs w-full max-w-full box-border">
        
        {/* Accordion 1: Description */}
        <div className="w-full">
          <button
            type="button"
            onClick={() => toggleAccordion("description")}
            className="w-full px-5 py-4 flex justify-between items-center text-left hover:bg-[#FAF9F6] transition-colors"
          >
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#111111] font-mono">
              Product Description
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[#111111] transition-transform duration-200 ${
                openAccordions.description ? "rotate-180" : ""
              }`}
            />
          </button>
          {openAccordions.description && (
            <div className="px-5 pb-5 text-xs text-[#6B6B6B] leading-relaxed whitespace-pre-line border-t border-[#E5E5E2]/60 pt-4">
              {product.description || product.shortDescription || "No detailed product description available."}
            </div>
          )}
        </div>

        {/* Accordion 2: Product Specifications */}
        <div className="w-full">
          <button
            type="button"
            onClick={() => toggleAccordion("specs")}
            className="w-full px-5 py-4 flex justify-between items-center text-left hover:bg-[#FAF9F6] transition-colors"
          >
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#111111] font-mono">
              Specifications & Details
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[#111111] transition-transform duration-200 ${
                openAccordions.specs ? "rotate-180" : ""
              }`}
            />
          </button>
          {openAccordions.specs && (
            <div className="px-5 pb-5 border-t border-[#E5E5E2]/60 pt-4">
              <div className="max-w-xl w-full">
                <table className="w-full text-left border-collapse text-xs">
                  <tbody>
                    <tr className="border-b border-[#E5E5E2]/60">
                      <td className="py-2.5 font-bold text-[#6B6B6B] uppercase text-[10px] font-mono w-1/3 pr-2">Brand / Studio</td>
                      <td className="py-2.5 font-semibold text-[#111111]">{product.brand || "FICTIONFIGURE"}</td>
                    </tr>
                    {product.franchise && (
                      <tr className="border-b border-[#E5E5E2]/60">
                        <td className="py-2.5 font-bold text-[#6B6B6B] uppercase text-[10px] font-mono pr-2">Franchise</td>
                        <td className="py-2.5 font-semibold text-[#111111]">{product.franchise}</td>
                      </tr>
                    )}
                    {product.material && (
                      <tr className="border-b border-[#E5E5E2]/60">
                        <td className="py-2.5 font-bold text-[#6B6B6B] uppercase text-[10px] font-mono pr-2">Material</td>
                        <td className="py-2.5 font-semibold text-[#111111]">{product.material}</td>
                      </tr>
                    )}
                    {product.scale && (
                      <tr className="border-b border-[#E5E5E2]/60">
                        <td className="py-2.5 font-bold text-[#6B6B6B] uppercase text-[10px] font-mono pr-2">Scale / Dimensions</td>
                        <td className="py-2.5 font-semibold text-[#111111]">{product.scale}</td>
                      </tr>
                    )}
                    <tr className="border-b border-[#E5E5E2]/60">
                      <td className="py-2.5 font-bold text-[#6B6B6B] uppercase text-[10px] font-mono pr-2">Category</td>
                      <td className="py-2.5 font-semibold text-[#111111]">{product.category?.name}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-[#6B6B6B] uppercase text-[10px] font-mono pr-2">SKU Code</td>
                      <td className="py-2.5 font-mono text-[#111111]">{currentVariant?.sku || product.sku}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 3: What's Included */}
        {product.whatsIncluded && (
          <div className="w-full">
            <button
              type="button"
              onClick={() => toggleAccordion("included")}
              className="w-full px-5 py-4 flex justify-between items-center text-left hover:bg-[#FAF9F6] transition-colors"
            >
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#111111] font-mono">
                Box Contents
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#111111] transition-transform duration-200 ${
                  openAccordions.included ? "rotate-180" : ""
                }`}
              />
            </button>
            {openAccordions.included && (
              <div className="px-5 pb-5 border-t border-[#E5E5E2]/60 pt-4 text-xs text-[#6B6B6B]">
                <ul className="space-y-2 list-disc list-inside">
                  {product.whatsIncluded
                    .split(/\r?\n|,/)
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .map((item, idx) => (
                      <li key={idx} className="font-medium text-[#111111]">
                        {item}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Accordion 4: Shipping & Policy */}
        <div className="w-full">
          <button
            type="button"
            onClick={() => toggleAccordion("shipping")}
            className="w-full px-5 py-4 flex justify-between items-center text-left hover:bg-[#FAF9F6] transition-colors"
          >
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#111111] font-mono">
              Shipping & Protection
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[#111111] transition-transform duration-200 ${
                openAccordions.shipping ? "rotate-180" : ""
              }`}
            />
          </button>
          {openAccordions.shipping && (
            <div className="px-5 pb-5 border-t border-[#E5E5E2]/60 pt-4 text-xs text-[#6B6B6B] space-y-2.5 leading-relaxed">
              <p>
                All orders are packaged in reinforced outer boxes with high-density padding to ensure collector-grade delivery condition.
              </p>
              <p>
                Standard pan-India delivery dispatches within 24-48 business hours with full tracking details sent via SMS & email.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Verified Customer Reviews Section */}
      <div id="reviews-section">
        <ProductReviews
          productId={product.id}
          productSlug={product.slug}
          productName={product.name}
        />
      </div>

      {/* RESTOCK QUANTITY SELECTOR MODAL */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E2] rounded-lg p-6 max-w-md w-full space-y-5 text-[#111111] text-xs shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37] block font-mono">
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
                <span className="font-bold text-xs text-[#111111] uppercase tracking-wider font-mono">Quantity:</span>
                <div className="flex items-center border border-[#E5E5E2] bg-[#FAF9F6] rounded-md overflow-hidden">
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
                className="px-4 py-2.5 border border-[#E5E5E2] font-semibold text-xs uppercase tracking-wider text-[#6B6B6B] hover:text-[#111111] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestockRequest}
                disabled={isRestockLoading}
                className="px-6 py-2.5 bg-[#111111] text-white font-extrabold text-xs uppercase tracking-widest hover:bg-black disabled:opacity-50 rounded-lg"
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
          <div className="bg-white border border-[#E5E5E2] rounded-lg p-6 max-w-sm w-full space-y-4 text-center text-[#111111] text-xs shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-[#FAF9F6] border border-[#E5E5E2] flex items-center justify-center mx-auto text-[#111111]">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#111111]">
                Sign In Required
              </h3>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                Please sign in to request a restock notification for this item.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => router.push(`/login?redirect=/products/${product.slug}`)}
                className="w-full py-3 bg-[#111111] text-white font-extrabold text-xs uppercase tracking-widest hover:bg-black rounded-lg"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="w-full py-2.5 border border-[#E5E5E2] text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] hover:text-[#111111] rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Purchase Bar */}
      {inStock && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E5E2] p-3 sm:hidden shadow-lg flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-[#6B6B6B] block font-mono uppercase tracking-wider truncate">
              {currentVariant?.title !== "Standard Edition" && currentVariant?.title !== "Standard" ? currentVariant.title : product.name}
            </span>
            <span className="text-sm font-extrabold font-mono text-[#111111]">
              {formatPrice(currentPrice)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            className="min-h-[44px] px-5 bg-[#111111] text-white text-xs font-extrabold uppercase tracking-widest rounded-lg hover:bg-black transition-colors flex items-center justify-center shrink-0 shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5 mr-1.5" /> Add to Cart
          </button>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-xs">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 text-white hover:text-[#D4AF37] min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors z-50"
            aria-label="Close image preview"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full max-w-5xl h-[85vh]">
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

