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
import { galleryIndexForVariant, primaryImageUrl, wrapIndex } from "@/lib/productImages";
import { Badge } from "@/components/ui/Badge";
import { AmbientImage } from "@/components/ui/Artwork";
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
  const gallery = product.images || [];
  const imageCount = gallery.length;
  // Start on the image of the first variant (for simple products that is the cover).
  const initialVariantImage = product.variants?.[0]?.imageUrl || null;
  const [selectedImageIndex, setSelectedImageIndex] = useState(() => Math.max(0, galleryIndexForVariant(gallery, initialVariantImage)));
  // A variant image that is not part of the gallery; shown until the shopper picks a thumbnail.
  const [variantOnlyImage, setVariantOnlyImage] = useState<string | null>(() =>
    galleryIndexForVariant(gallery, initialVariantImage) === -1 ? initialVariantImage : null
  );
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

  // Shown image: the shopper's gallery selection, or a variant-only image right after choosing that variant.
  // (Previously the variant image always won, so thumbnails could not change the main image.)
  const currentImage = variantOnlyImage || gallery[selectedImageIndex]?.url || gallery[0]?.url || "";
  const currentImageAlt =
    (!variantOnlyImage && gallery[selectedImageIndex]?.altText) ||
    (imageCount > 1 ? `${product.name} — image ${selectedImageIndex + 1} of ${imageCount}` : product.name);

  // Selecting a variant jumps to its image.
  const variantImage = currentVariant?.imageUrl || null;
  useEffect(() => {
    if (!variantImage) return;
    const idx = galleryIndexForVariant(gallery, variantImage);
    if (idx >= 0) {
      setSelectedImageIndex(idx);
      setVariantOnlyImage(null);
    } else {
      setVariantOnlyImage(variantImage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantImage]);

  const showImage = (idx: number) => {
    setVariantOnlyImage(null);
    setSelectedImageIndex(wrapIndex(idx, imageCount));
  };

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
      // Cart, checkout and orders always use the variant/cover image, not the thumbnail being browsed.
      image: primaryImageUrl(gallery, currentVariant?.imageUrl),
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
    if (imageCount === 0) return;
    showImage(variantOnlyImage ? selectedImageIndex : selectedImageIndex - 1);
  };

  const handleNextImage = () => {
    if (imageCount === 0) return;
    showImage(variantOnlyImage ? selectedImageIndex : selectedImageIndex + 1);
  };

  const handleStageKeyDown = (e: React.KeyboardEvent) => {
    if (isLightboxOpen) return; // the lightbox has its own window-level key handler
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrevImage();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNextImage();
    } else if ((e.key === "Enter" || e.key === " ") && currentImage && e.target === e.currentTarget) {
      e.preventDefault();
      setIsLightboxOpen(true);
    }
  };

  const brandName = product.brand || product.category?.name || "AUTHENTIC COLLECTIBLE";

  return (
    <div className="space-y-10 lg:space-y-14 w-full max-w-full overflow-hidden box-border">
      {/* 1. Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-[11px] text-[#9A9DA5] overflow-x-auto whitespace-nowrap no-scrollbar w-full max-w-full"
      >
        <Link href="/" className="hover:text-white transition-colors shrink-0">
          Home
        </Link>
        <span className="text-[#4A4D55]">/</span>
        <Link href={`/collections/${product.category.slug}`} className="hover:text-white transition-colors shrink-0">
          {product.category.name}
        </Link>
        <span className="text-[#4A4D55]">/</span>
        <span className="text-[#F7F7F5] truncate max-w-[220px] sm:max-w-md">{product.name}</span>
      </nav>

      {/* 2. Main 2-Column Product Studio Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 w-full max-w-full box-border items-start">
        {/* Left Column: Gallery (7 cols) */}
        <div className="lg:col-span-7 w-full max-w-full flex flex-col-reverse lg:flex-row gap-3 lg:gap-4">
          {product.images && product.images.length > 1 && (
            <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-visible no-scrollbar lg:w-[76px] shrink-0">
              {gallery.map((img, idx) => {
                const isSelected = !variantOnlyImage && selectedImageIndex === idx;
                return (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => showImage(idx)}
                    aria-label={`Show image ${idx + 1} of ${imageCount}`}
                    aria-pressed={isSelected}
                    className={`relative w-16 h-20 lg:w-[76px] lg:h-[92px] shrink-0 overflow-hidden rounded-[8px] border bg-[#111318] transition-colors ${
                      isSelected ? "border-[#F5C518]" : "border-white/10 opacity-70 hover:opacity-100 hover:border-white/25"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                    />
                  </button>
                );
              })}
            </div>
          )}

          <div
            className="relative flex-1 min-w-0 aspect-[4/5] sm:aspect-[5/6] lg:aspect-auto lg:h-[min(76vh,700px)] overflow-hidden rounded-[12px] border border-white/[0.08] bg-[#0D0E12] group outline-none focus-visible:ring-2 focus-visible:ring-[#F5C518]/70"
            tabIndex={0}
            role="region"
            aria-roledescription="image gallery"
            aria-label={`${product.name} images${imageCount > 1 ? ". Use the left and right arrow keys to browse, Enter to enlarge." : ""}`}
            onKeyDown={handleStageKeyDown}
          >
            {currentImage && <AmbientImage src={currentImage} opacity={0.35} />}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_0%,rgba(8,9,11,0.6)_75%)] pointer-events-none" />

            {currentImage ? (
              <Image
                src={currentImage}
                alt={currentImageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 720px"
                className="object-contain p-4 sm:p-8 cursor-zoom-in transition-transform duration-500 group-hover:scale-[1.02] drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
                onClick={() => setIsLightboxOpen(true)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[12px] text-[#6E717A] gap-2">
                <Sparkles className="w-6 h-6 text-[#F5C518]" />
                <span>No artwork available</span>
              </div>
            )}

            {discountPercent > 0 && (
              <div className="absolute top-3 left-3 z-10 pointer-events-none">
                <Badge variant="gold" size="sm">{discountPercent}% OFF</Badge>
              </div>
            )}

            <button
              type="button"
              onClick={handleWishlistToggle}
              className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-[#08090B]/60 backdrop-blur-md border border-white/15 hover:border-white/40 flex items-center justify-center transition-colors"
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? "fill-[#F5C518] text-[#F5C518]" : "text-white"}`} />
            </button>

            {product.images && product.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#08090B]/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#08090B]/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span
                  className="absolute bottom-3 left-3 z-10 px-2 py-1 rounded-full bg-[#08090B]/60 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-white/85 tabular-nums pointer-events-none"
                  aria-hidden
                >
                  {variantOnlyImage ? "Variant" : `${selectedImageIndex + 1} / ${imageCount}`}
                </span>
              </>
            )}

            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full bg-[#08090B]/60 backdrop-blur-md border border-white/15 text-white/80 hover:text-white flex items-center justify-center"
              aria-label="View full resolution"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Product Identity & Purchase Controls (5 Cols Desktop) */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-7 w-full max-w-full box-border lg:sticky lg:top-24 lg:self-start">
          {/* Identity & price */}
          <div className="space-y-3 w-full max-w-full">
            <div className="flex flex-wrap items-center gap-2">
              <span className="ff-eyebrow">{brandName}</span>
              {inStock ? (
                isLowStock ? (
                  <Badge variant="warning" size="sm" dot>
                    Only {currentVariant.inventoryCount} left
                  </Badge>
                ) : (
                  <Badge variant="success" size="sm" dot>
                    In stock
                  </Badge>
                )
              ) : (
                <Badge variant="danger" size="sm" dot>
                  Sold out
                </Badge>
              )}
            </div>

            <h1 className="text-[26px] sm:text-[32px] lg:text-[36px] font-extrabold leading-[1.12] tracking-[-0.02em] text-white break-words">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[28px] sm:text-[32px] font-extrabold tracking-tight text-white">
                {formatPrice(currentPrice)}
              </span>
              {currentCompareAt && currentCompareAt > currentPrice && (
                <>
                  <span className="text-[15px] text-[#6E717A] line-through">{formatPrice(currentCompareAt)}</span>
                  {discountPercent > 0 && (
                    <span className="text-[12px] font-bold text-[#F5C518]">{discountPercent}% OFF</span>
                  )}
                </>
              )}
            </div>

            {product.reviewCount > 0 && product.rating > 0 && (
              <a href="#reviews-section" className="inline-flex items-center gap-2 text-[12px] text-[#9A9DA5] hover:text-white">
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(product.rating) ? "fill-[#F5C518] text-[#F5C518]" : "text-white/20"
                      }`}
                    />
                  ))}
                </span>
                <span>
                  {product.rating.toFixed(1)} ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})
                </span>
              </a>
            )}

            {product.shortDescription && (
              <p className="text-[13px] sm:text-[14px] text-[#9A9DA5] leading-relaxed break-words">
                {product.shortDescription}
              </p>
            )}

            {currentVariant?.sku && <p className="text-[11px] text-[#6E717A]">SKU: {currentVariant.sku}</p>}
          </div>

          {/* Generic Variant Selector System */}
          {hasVariants && (
            <div className="space-y-3 w-full max-w-full bg-[#111318] border border-white/10 rounded-[10px] p-5 shadow-lg shadow-black/40">
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
                          ? "border-white/5 bg-white/[0.02] text-[#6E717A] cursor-not-allowed opacity-40 line-through"
                          : "border-white/10 bg-[#17191F] text-white/90 hover:border-white/25 hover:text-white"
                      }`}
                    >
                      <span>{v.title}</span>
                      {v.price && v.price !== product.price && (
                        <span
                          className={`text-[10px] font-normal ${
                            isSelected ? "text-[#F5C518]" : "text-[#9A9DA5]"
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

          {/* Purchase */}
          <div className="space-y-3 w-full max-w-full pt-5 border-t border-white/[0.08]">
            {inStock ? (
              <>
                <div className="flex items-stretch gap-3">
                  <div className="flex items-center h-12 rounded-[6px] border border-white/15 bg-[#0D0E12] shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-full flex items-center justify-center text-[#9A9DA5] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-9 text-center text-[14px] font-bold text-white" aria-live="polite">
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
                      className="w-10 h-full flex items-center justify-center text-[#9A9DA5] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className={`ff-btn flex-1 h-12 ${justAdded ? "bg-[#10B981] text-white" : "ff-btn-gold"}`}
                  >
                    {justAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                    <span>{justAdded ? "Added to Bag" : "Add to Bag"}</span>
                  </button>
                </div>

                <button type="button" onClick={handleBuyNow} className="ff-btn ff-btn-outline w-full h-12">
                  <span>Buy Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="space-y-3 rounded-[10px] border border-white/[0.08] bg-[#111318] p-4">
                <div className="space-y-1">
                  <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-rose-300">Currently unavailable</p>
                  <p className="text-[12px] text-[#9A9DA5]">
                    Join the restock alert list to be notified as soon as more units arrive.
                  </p>
                </div>
                {hasRequestedRestock ? (
                  <div className="p-3 rounded-[8px] bg-[#10B981]/10 border border-[#10B981]/30 flex items-center gap-2.5 text-[12px] text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>You are on the restock list ({requestedQuantity} requested).</span>
                  </div>
                ) : (
                  <button type="button" onClick={handleRestockButtonClick} className="ff-btn ff-btn-gold w-full h-12">
                    Notify Me When Restocked
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-6 pt-1 text-[12px] text-[#9A9DA5]">
              <button
                type="button"
                onClick={handleWishlistToggle}
                className="inline-flex items-center gap-2 hover:text-white transition-colors"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? "fill-[#F5C518] text-[#F5C518]" : ""}`} />
                <span>{isWishlisted ? "Saved to Wishlist" : "Add to Wishlist"}</span>
              </button>
              <button type="button" onClick={handleShare} className="inline-flex items-center gap-2 hover:text-white transition-colors">
                <Share2 className="w-4 h-4" />
                <span>{copiedLink ? "Link copied" : "Share"}</span>
              </button>
            </div>
          </div>

          {/* Collector benefits */}
          <ul className="grid grid-cols-2 gap-x-4 gap-y-3 py-5 border-y border-white/[0.08]">
            {[
              { icon: ShieldCheck, label: "Authentic Product" },
              { icon: Box, label: "Collector-Safe Packaging" },
              { icon: Truck, label: "Pan-India Shipping" },
              { icon: CreditCard, label: "Secure Payments" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-[12px] text-[#F7F7F5]/85">
                <Icon className="w-4 h-4 text-[#F5C518] shrink-0" />
                <span>{label}</span>
              </li>
            ))}
          </ul>

          {/* Supporting Information Accordions */}
          <div className="space-y-3 pt-2">
            {/* Description Accordion */}
            <div className="bg-[#111318] border border-white/10 rounded-[10px] overflow-hidden">
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
                  className={`w-4 h-4 text-[#9A9DA5] transition-transform duration-200 ${
                    openAccordions.description ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openAccordions.description && (
                <div className="p-5 pt-0 border-t border-white/[0.06] text-xs sm:text-sm text-[#9A9DA5] leading-relaxed space-y-3">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: product.description || product.shortDescription || "No detailed description available.",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Specifications Accordion */}
            <div className="bg-[#111318] border border-white/10 rounded-[10px] overflow-hidden">
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
                  className={`w-4 h-4 text-[#9A9DA5] transition-transform duration-200 ${
                    openAccordions.specs ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openAccordions.specs && (
                <div className="p-5 pt-0 border-t border-white/[0.06] text-xs text-[#9A9DA5] space-y-2.5 font-mono">
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-[#6E717A]">Series / Universe</span>
                    <span className="text-white font-bold">{product.category.name}</span>
                  </div>
                  {product.brand && (
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-[#6E717A]">Manufacturer / Studio</span>
                      <span className="text-white font-bold">{product.brand}</span>
                    </div>
                  )}
                  {product.scale && (
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-[#6E717A]">Scale</span>
                      <span className="text-white font-bold">{product.scale}</span>
                    </div>
                  )}
                  {product.material && (
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-[#6E717A]">Material</span>
                      <span className="text-white font-bold">{product.material}</span>
                    </div>
                  )}
                  {product.franchise && (
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-[#6E717A]">Franchise</span>
                      <span className="text-white font-bold">{product.franchise}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#6E717A]">Authenticity Guarantee</span>
                    <span className="text-[#10B981] font-bold">100% Japanese Import</span>
                  </div>
                </div>
              )}
            </div>

            {/* What's in the Box Accordion */}
            {product.whatsIncluded && (
              <div className="bg-[#111318] border border-white/10 rounded-[10px] overflow-hidden">
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
                    className={`w-4 h-4 text-[#9A9DA5] transition-transform duration-200 ${
                      openAccordions.included ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openAccordions.included && (
                  <div className="p-5 pt-0 border-t border-white/[0.06] text-xs sm:text-sm text-[#9A9DA5] leading-relaxed">
                    <p>{product.whatsIncluded}</p>
                  </div>
                )}
              </div>
            )}

            {/* Shipping & Delivery Guarantee Accordion */}
            <div className="bg-[#111318] border border-white/10 rounded-[10px] overflow-hidden">
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
                  className={`w-4 h-4 text-[#9A9DA5] transition-transform duration-200 ${
                    openAccordions.shipping ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openAccordions.shipping && (
                <div className="p-5 pt-0 border-t border-white/[0.06] text-xs sm:text-sm text-[#9A9DA5] leading-relaxed space-y-2 font-sans">
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
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} — enlarged image`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLightboxOpen(false);
          }}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 w-12 h-12 rounded-[10px] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-20 cursor-pointer"
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
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-[10px] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-20 cursor-pointer"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-[10px] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-20 cursor-pointer"
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
                alt={currentImageAlt}
                fill
                sizes="100vw"
                className="object-contain p-4"
                priority
              />
            )}
          </div>
          {imageCount > 1 && !variantOnlyImage && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[12px] font-semibold text-white/70 tabular-nums">
              {selectedImageIndex + 1} / {imageCount}
            </p>
          )}
        </div>
      )}

      {/* 4. Restock Request Modal */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#111318] border border-white/10 rounded-[10px] p-6 space-y-5 shadow-2xl shadow-black">
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

            <p className="text-xs text-[#9A9DA5] leading-relaxed">
              Enter your desired quantity. We will notify you via email and phone the moment new units are dispatched to our vault.
            </p>

            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#6E717A]">
                DESIRED UNITS:
              </span>
              <input
                type="number"
                min="1"
                max="10"
                value={desiredRestockQty}
                onChange={(e) => setDesiredRestockQty(Math.max(1, Number(e.target.value)))}
                className="w-full p-3 bg-[#0D0E12] border border-white/10 rounded-xl text-xs font-mono text-white focus:border-[#F5C518] focus:outline-none"
              />
            </div>

            {restockErr && <p className="text-xs text-rose-400">{restockErr}</p>}

            <button
              type="button"
              disabled={isRestockLoading}
              onClick={handleConfirmRestockRequest}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#F5C518] to-[#D4AF37] text-[#08090B] text-xs font-bold uppercase tracking-widest hover:brightness-110 shadow-lg transition-all min-h-[44px]"
            >
              {isRestockLoading ? "SUBMITTING..." : "CONFIRM RESTOCK REQUEST"}
            </button>
          </div>
        </div>
      )}

      {/* 5. Auth Required Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-[#111318] border border-white/10 rounded-[10px] p-6 space-y-4 shadow-2xl text-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              AUTHENTICATION REQUIRED
            </h3>
            <p className="text-xs text-[#9A9DA5]">
              Please sign in or register to join the restock alert queue and track your requests.
            </p>
            <div className="pt-2 flex gap-3">
              <Link
                href="/login"
                className="flex-1 py-3 bg-[#F5C518] text-[#08090B] text-xs font-bold uppercase tracking-wider rounded-xl text-center"
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
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#111318]/95 backdrop-blur-xl border-t border-white/10 p-3.5 flex items-center justify-between gap-3 lg:hidden shadow-2xl shadow-black">
        <div className="min-w-0 space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-[#9A9DA5] block">Price</span>
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
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#F5C518] to-[#D4AF37] text-[#08090B] text-xs font-bold uppercase tracking-wider min-h-[44px] flex items-center justify-center gap-1 shadow-md shadow-amber-500/20"
              >
                <span>Buy Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleRestockButtonClick}
              className="py-2.5 px-4 rounded-xl bg-[#F5C518] text-[#08090B] text-xs font-bold uppercase tracking-wider min-h-[44px]"
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
