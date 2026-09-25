"use client";

import React, { useState, useEffect } from "react";
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
  Box,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { API_BASE, safeApiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
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
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

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

  // Helper to retrieve auth token
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

  // Lightbox scroll lock & Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
    };

    if (isLightboxOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen]);

  // Check if customer already has a pending restock request for this product
  useEffect(() => {
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

  const handleAddToCart = () => {
    if (!currentVariant || !inStock) return;
    setIsAddingToCart(true);

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

    setJustAdded(true);
    setTimeout(() => {
      setIsAddingToCart(false);
      setTimeout(() => setJustAdded(false), 2500);
    }, 300);
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

  const brandName = product.brand || product.category?.name || "AUTHENTIC COLLECTIBLE";

  return (
    <div className="space-y-12 sm:space-y-16 w-full max-w-full overflow-hidden box-border">
      {/* 1. Subtle Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-[11px] font-mono font-bold uppercase tracking-widest text-[#64748B] overflow-x-auto whitespace-nowrap scrollbar-none w-full max-w-full pb-2 border-b border-white/10">
        <Link href="/" className="hover:text-[#F5C518] transition-colors shrink-0">
          HOME
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[#F5C518] transition-colors shrink-0">
          VAULT
        </Link>
        <span>/</span>
        <Link
          href={`/shop?category=${product.category.slug}`}
          className="hover:text-[#F5C518] transition-colors shrink-0"
        >
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-white shrink-0 truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
      </nav>

      {/* 2. Main 2-Column Product Studio Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 w-full max-w-full box-border items-start">
        {/* Left Column: Image Gallery (7 Cols Desktop) */}
        <div className="lg:col-span-7 space-y-4 w-full max-w-full box-border">
          {/* Main Hero Product Image Surface */}
          <div className="relative aspect-square sm:aspect-[4/3] md:aspect-square w-full max-w-full bg-[#121318] border border-white/10 rounded-3xl overflow-hidden group box-border flex items-center justify-center shadow-2xl shadow-black/80 p-6 sm:p-10">
            {/* Ambient subtle gold radial glow behind artwork */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#F5C518]/[0.06] via-transparent to-purple-500/[0.04] pointer-events-none" />

            {currentImage ? (
              <Image
                src={currentImage}
                alt={product.images[selectedImageIndex]?.altText || product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 720px"
                className="object-contain cursor-zoom-in max-w-full transition-transform duration-500 group-hover:scale-[1.03] p-4"
                onClick={() => setIsLightboxOpen(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs font-mono text-[#64748B] space-y-2">
                <Sparkles className="w-6 h-6 text-[#F5C518]" />
                <span>NO IMAGE ARTWORK AVAILABLE</span>
              </div>
            )}

            {/* Discount Badge on Main Image */}
            {discountPercent > 0 && (
              <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <Badge variant="gold" size="md" glow>
                  {discountPercent}% OFF
                </Badge>
              </div>
            )}

            {/* Floating Wishlist Heart Button */}
            <button
              type="button"
              onClick={handleWishlistToggle}
              className={`absolute top-4 right-4 w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl border transition-all flex items-center justify-center z-10 shadow-lg cursor-pointer ${
                isWishlisted
                  ? "bg-[#181920] border-rose-500/50 text-rose-400 shadow-rose-500/20"
                  : "bg-[#121318]/80 backdrop-blur-md text-white/90 border-white/10 hover:border-white/25 hover:text-white"
              }`}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
            </button>

            {/* Previous / Next Image Navigation Controls */}
            {product.images && product.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-[#121318]/80 backdrop-blur-md border border-white/10 hover:border-white/25 text-white flex items-center justify-center transition-all shadow-lg z-10 cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-[#121318]/80 backdrop-blur-md border border-white/10 hover:border-white/25 text-white flex items-center justify-center transition-all shadow-lg z-10 cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Expand Fullscreen Lightbox Button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-4 right-4 w-10 h-10 min-w-[40px] min-h-[40px] bg-[#121318]/80 backdrop-blur-md border border-white/10 hover:border-white/25 text-[#94A3B8] hover:text-white rounded-xl transition-all flex items-center justify-center shadow-md z-10 cursor-pointer"
              aria-label="Expand artwork full resolution"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnail Strip Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 w-full max-w-full scrollbar-none box-border pt-1 select-none">
              {product.images.map((img, idx) => {
                const isSelected = selectedImageIndex === idx;
                return (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 bg-[#121318] border rounded-2xl shrink-0 overflow-hidden transition-all box-border p-2 cursor-pointer ${
                      isSelected
                        ? "border-[#F5C518] ring-2 ring-[#F5C518]/30 shadow-[0_0_12px_rgba(245,197,24,0.2)]"
                        : "border-white/10 opacity-70 hover:opacity-100 hover:border-white/25"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.altText || `${product.name} thumbnail ${idx + 1}`}
                      fill
                      className="object-contain p-1.5"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Product Identity & Purchase Controls (5 Cols Desktop) */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-7 w-full max-w-full box-border lg:sticky lg:top-24 lg:self-start">
          {/* Header & Brand Info */}
          <div className="space-y-3 w-full max-w-full border-b border-white/10 pb-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#F5C518]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{brandName}</span>
              </div>

              {/* Verified Rating Pill (Rendered ONLY if real review data exists) */}
              {product.reviewCount > 0 && product.rating > 0 && (
                <a
                  href="#reviews-section"
                  className="flex items-center space-x-1.5 bg-[#181920] px-3 py-1 rounded-lg border border-white/10 hover:border-[#F5C518]/40 transition-colors shrink-0"
                >
                  <Star className="w-3.5 h-3.5 fill-[#F5C518] text-[#F5C518]" />
                  <span className="font-mono text-xs font-bold text-white">
                    {product.rating.toFixed(1)}
                  </span>
                  <span className="text-[#64748B] font-mono text-[11px]">({product.reviewCount})</span>
                </a>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white leading-tight break-words max-w-full">
              {product.name}
            </h1>

            {product.shortDescription && (
              <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed break-words max-w-full font-sans">
                {product.shortDescription}
              </p>
            )}
          </div>

          {/* Pricing & Stock Card */}
          <div className="p-5 bg-[#121318] border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full max-w-full box-border shadow-xl shadow-black/50">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
                  {formatPrice(currentPrice)}
                </span>

                {currentCompareAt && currentCompareAt > currentPrice && (
                  <span className="text-sm sm:text-base font-mono text-[#64748B] line-through">
                    {formatPrice(currentCompareAt)}
                  </span>
                )}
              </div>

              {currentVariant?.sku && (
                <span className="text-[10px] text-[#64748B] uppercase font-mono block tracking-wider">
                  SKU: {currentVariant.sku}
                </span>
              )}
            </div>

            {/* Stock Status Badge */}
            <div className="shrink-0 self-start sm:self-auto">
              {inStock ? (
                isLowStock ? (
                  <Badge variant="warning" size="md" dot>
                    Only {currentVariant.inventoryCount} Left
                  </Badge>
                ) : (
                  <Badge variant="success" size="md" dot>
                    In Stock
                  </Badge>
                )
              ) : (
                <Badge variant="danger" size="md" dot>
                  Sold Out
                </Badge>
              )}
            </div>
          </div>

          {/* Generic Variant Selector System */}
          {hasVariants && (
            <div className="space-y-3 w-full max-w-full bg-[#121318] border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/40">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-white font-mono">
                <span>SELECT EDITION / VARIANT:</span>
                <span className="text-[#F5C518]">{currentVariant?.title}</span>
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
                      className={`min-h-[44px] px-4 py-2.5 border rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                        isSelected
                          ? "border-[#F5C518] bg-[#F5C518]/15 text-[#F5C518] shadow-[0_0_12px_rgba(245,197,24,0.15)]"
                          : isOutOfStock
                          ? "border-white/5 bg-white/[0.02] text-[#64748B] cursor-not-allowed opacity-40 line-through"
                          : "border-white/10 bg-[#181920] text-white/90 hover:border-white/25 hover:text-white"
                      }`}
                    >
                      <span>{v.title}</span>
                      {v.price && v.price !== product.price && (
                        <span
                          className={`text-[10px] font-normal ${
                            isSelected ? "text-[#F5C518]" : "text-[#94A3B8]"
                          }`}
                        >
                          ({formatPrice(v.price)})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Controls & Purchase Buttons */}
          <div className="space-y-4 w-full max-w-full box-border">
            {inStock ? (
              <div className="space-y-4">
                {/* Quantity Stepper */}
                <div className="flex items-center space-x-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-white font-mono">
                    QUANTITY:
                  </span>
                  <div className="flex items-center border border-white/15 bg-[#0E0F13] rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      disabled={quantity <= 1}
                      className="w-11 h-11 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center text-sm font-mono font-bold text-white">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((prev) =>
                          currentVariant ? Math.min(currentVariant.inventoryCount, prev + 1) : prev + 1
                        )
                      }
                      disabled={Boolean(currentVariant && quantity >= currentVariant.inventoryCount)}
                      className="w-11 h-11 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className={`py-4 px-6 rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all min-h-[52px] shadow-lg cursor-pointer ${
                      justAdded
                        ? "bg-[#10B981] text-white border border-[#10B981]"
                        : "bg-[#181920] hover:bg-[#22242D] text-white border border-white/15 hover:border-white/30"
                    }`}
                  >
                    {justAdded ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>ADDED TO BAG!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>ADD TO BAG</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="py-4 px-6 rounded-2xl bg-gradient-to-r from-[#F5C518] to-[#D4AF37] text-[#0A0A0C] text-xs sm:text-sm font-extrabold uppercase tracking-wider hover:brightness-110 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 flex items-center justify-center gap-2 transition-all min-h-[52px] cursor-pointer"
                  >
                    <span>BUY NOW</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Out of Stock & Restock Notification Block */
              <div className="space-y-4 bg-[#121318] border border-white/10 rounded-2xl p-5">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 block">
                    CURRENTLY UNAVAILABLE IN VAULT
                  </span>
                  <p className="text-xs text-[#94A3B8]">
                    Join the restock alert queue to get notified immediately when more units are dispatched.
                  </p>
                </div>

                {hasRequestedRestock ? (
                  <div className="p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center gap-3 text-xs text-emerald-400">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>You are on the restock notification list ({requestedQuantity} requested).</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRestockButtonClick}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#F5C518] to-[#D4AF37] text-[#0A0A0C] text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-lg transition-all min-h-[48px] cursor-pointer"
                  >
                    NOTIFY ME WHEN RESTOCKED
                  </button>
                )}
              </div>
            )}

            {/* Secondary Share Button */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? "Link Copied to Clipboard!" : "Share Collectible"}</span>
              </button>
            </div>
          </div>

          {/* Collector Benefits / Trust Strip */}
          <div className="p-4 bg-[#121318] border border-white/[0.08] rounded-2xl grid grid-cols-3 gap-3 text-center">
            <div className="space-y-1">
              <ShieldCheck className="w-5 h-5 text-[#F5C518] mx-auto" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white block">
                100% Authentic
              </span>
            </div>
            <div className="space-y-1 border-x border-white/10 px-2">
              <Box className="w-5 h-5 text-[#F5C518] mx-auto" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white block">
                Mint Box Safe
              </span>
            </div>
            <div className="space-y-1">
              <Truck className="w-5 h-5 text-[#F5C518] mx-auto" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white block">
                Express Transit
              </span>
            </div>
          </div>

          {/* Supporting Information Accordions */}
          <div className="space-y-3 pt-2">
            {/* Description Accordion */}
            <div className="bg-[#121318] border border-white/10 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion("description")}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F5C518]" />
                  <span>FIGURE DESCRIPTION & STORY</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#94A3B8] transition-transform duration-200 ${
                    openAccordions.description ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openAccordions.description && (
                <div className="p-5 pt-0 border-t border-white/[0.06] text-xs sm:text-sm text-[#94A3B8] leading-relaxed space-y-3">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: product.description || product.shortDescription || "No detailed description available.",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Specifications Accordion */}
            <div className="bg-[#121318] border border-white/10 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion("specs")}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#F5C518]" />
                  <span>COLLECTOR SPECIFICATIONS</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#94A3B8] transition-transform duration-200 ${
                    openAccordions.specs ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openAccordions.specs && (
                <div className="p-5 pt-0 border-t border-white/[0.06] text-xs text-[#94A3B8] space-y-2.5 font-mono">
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-[#64748B]">Series / Universe</span>
                    <span className="text-white font-bold">{product.category.name}</span>
                  </div>
                  {product.brand && (
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-[#64748B]">Manufacturer / Studio</span>
                      <span className="text-white font-bold">{product.brand}</span>
                    </div>
                  )}
                  {product.scale && (
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-[#64748B]">Scale</span>
                      <span className="text-white font-bold">{product.scale}</span>
                    </div>
                  )}
                  {product.material && (
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-[#64748B]">Material</span>
                      <span className="text-white font-bold">{product.material}</span>
                    </div>
                  )}
                  {product.franchise && (
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-[#64748B]">Franchise</span>
                      <span className="text-white font-bold">{product.franchise}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#64748B]">Authenticity Guarantee</span>
                    <span className="text-[#10B981] font-bold">100% Japanese Import</span>
                  </div>
                </div>
              )}
            </div>

            {/* What's in the Box Accordion */}
            {product.whatsIncluded && (
              <div className="bg-[#121318] border border-white/10 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleAccordion("included")}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                    <Box className="w-4 h-4 text-[#F5C518]" />
                    <span>WHAT'S IN THE BOX</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#94A3B8] transition-transform duration-200 ${
                      openAccordions.included ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openAccordions.included && (
                  <div className="p-5 pt-0 border-t border-white/[0.06] text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                    <p>{product.whatsIncluded}</p>
                  </div>
                )}
              </div>
            )}

            {/* Shipping & Delivery Guarantee Accordion */}
            <div className="bg-[#121318] border border-white/10 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion("shipping")}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#F5C518]" />
                  <span>SHIPPING & COLLECTOR PACKAGING</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#94A3B8] transition-transform duration-200 ${
                    openAccordions.shipping ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openAccordions.shipping && (
                <div className="p-5 pt-0 border-t border-white/[0.06] text-xs sm:text-sm text-[#94A3B8] leading-relaxed space-y-2 font-sans">
                  <p>
                    All items are dispatched in heavy-duty multi-layer corrugated boxes with bubble corner protectors to ensure the box and figure arrive in pristine collector condition.
                  </p>
                  <p>
                    Standard transit takes 3–5 business days across India with real-time tracking provided upon dispatch.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Full-Resolution Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-20 cursor-pointer"
            aria-label="Close fullscreen view"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Lightbox Navigation Chevrons */}
          {product.images && product.images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-20 cursor-pointer"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-20 cursor-pointer"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="relative w-full max-w-4xl h-[80vh] flex items-center justify-center">
            {currentImage && (
              <Image
                src={currentImage}
                alt={product.name}
                fill
                className="object-contain p-4"
                priority
              />
            )}
          </div>
        </div>
      )}

      {/* 4. Restock Request Modal */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#121318] border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl shadow-black">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                REQUEST RESTOCK NOTIFICATION
              </h3>
              <button
                type="button"
                onClick={() => setShowRestockModal(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Enter your desired quantity. We will notify you via email and phone the moment new units are dispatched to our vault.
            </p>

            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                DESIRED UNITS:
              </span>
              <input
                type="number"
                min="1"
                max="10"
                value={desiredRestockQty}
                onChange={(e) => setDesiredRestockQty(Math.max(1, Number(e.target.value)))}
                className="w-full p-3 bg-[#0E0F13] border border-white/10 rounded-xl text-xs font-mono text-white focus:border-[#F5C518] focus:outline-none"
              />
            </div>

            {restockErr && <p className="text-xs text-rose-400">{restockErr}</p>}

            <button
              type="button"
              disabled={isRestockLoading}
              onClick={handleConfirmRestockRequest}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#F5C518] to-[#D4AF37] text-[#0A0A0C] text-xs font-bold uppercase tracking-widest hover:brightness-110 shadow-lg transition-all min-h-[44px]"
            >
              {isRestockLoading ? "SUBMITTING..." : "CONFIRM RESTOCK REQUEST"}
            </button>
          </div>
        </div>
      )}

      {/* 5. Auth Required Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-[#121318] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl text-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              AUTHENTICATION REQUIRED
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Please sign in or register to join the restock alert queue and track your requests.
            </p>
            <div className="pt-2 flex gap-3">
              <Link
                href="/login"
                className="flex-1 py-3 bg-[#F5C518] text-[#0A0A0C] text-xs font-bold uppercase tracking-wider rounded-xl text-center"
              >
                Sign In
              </Link>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="flex-1 py-3 bg-white/[0.05] border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Mobile Sticky Bottom Purchase Bar (< lg) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#121318]/95 backdrop-blur-xl border-t border-white/10 p-3.5 flex items-center justify-between gap-3 lg:hidden shadow-2xl shadow-black">
        <div className="min-w-0 space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Price</span>
          <span className="text-base font-extrabold font-mono text-white truncate block">
            {formatPrice(currentPrice)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {inStock ? (
            <>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="py-2.5 px-3.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs font-bold uppercase tracking-wider min-h-[44px] flex items-center justify-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add</span>
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#F5C518] to-[#D4AF37] text-[#0A0A0C] text-xs font-bold uppercase tracking-wider min-h-[44px] flex items-center justify-center gap-1 shadow-md shadow-amber-500/20"
              >
                <span>Buy Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleRestockButtonClick}
              className="py-2.5 px-4 rounded-xl bg-[#F5C518] text-[#0A0A0C] text-xs font-bold uppercase tracking-wider min-h-[44px]"
            >
              Restock Alert
            </button>
          )}
        </div>
      </div>

      {/* 7. Verified Collector Reviews Section */}
      <div id="reviews-section" className="pt-8">
        <ProductReviews
          productId={product.id}
          productSlug={product.slug}
          productName={product.name}
        />
      </div>
    </div>
  );
}
