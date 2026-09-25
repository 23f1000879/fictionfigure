"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

export interface CarouselSlide {
  id: string;
  image: string;
  eyebrow?: string;
  title: string;
  titleAccent?: string;
  description?: string;
  primaryLabel?: string;
  primaryUrl?: string;
  secondaryLabel?: string;
  secondaryUrl?: string;
  enabled?: boolean;
  sortOrder?: number;
}

interface HeroCarouselProps {
  slides: CarouselSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeRealIndex, setActiveRealIndex] = useState(0);
  const [isCursorGrabbing, setIsCursorGrabbing] = useState(false);

  const activeSlides = slides.filter((s) => s.enabled !== false);
  const N = activeSlides.length;

  // Tripled slides array for seamless infinite looping buffer [Set 0 (left clone), Set 1 (main), Set 2 (right clone)]
  const extendedSlides = N > 0 ? [...activeSlides, ...activeSlides, ...activeSlides] : [];

  // Drag vs Click distinction tracking
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const isGestureDeterminedRef = useRef(false);
  const isHorizontalDragRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isInfiniteAdjustingRef = useRef(false);

  // Helper to measure panel width + 0px gap (single full viewport slides)
  const getPanelFullWidth = useCallback(() => {
    if (!scrollRef.current) return 0;
    return scrollRef.current.offsetWidth;
  }, []);

  // Initialize scroll position to center set (Set 1, slide 0 -> index N)
  const initScrollPosition = useCallback(() => {
    if (!scrollRef.current || N === 0) return;
    const el = scrollRef.current;
    const panelW = getPanelFullWidth();
    if (panelW > 0) {
      el.scrollLeft = N * panelW;
    }
  }, [N, getPanelFullWidth]);

  useEffect(() => {
    const timer = setTimeout(() => {
      initScrollPosition();
    }, 50);
    window.addEventListener("resize", initScrollPosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", initScrollPosition);
    };
  }, [initScrollPosition]);

  // Infinite Seamless Boundary Adjustment & Real Index Calculation
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || N === 0) return;
    if (isInfiniteAdjustingRef.current) return;

    const el = scrollRef.current;
    const panelW = getPanelFullWidth();
    if (panelW === 0) return;

    const scrollPos = el.scrollLeft;
    const singleSetWidth = N * panelW;

    // Check boundary threshold for infinite loop jump
    if (scrollPos >= 2 * singleSetWidth - 10) {
      // Reached end of right clone set -> jump back to start of main set
      isInfiniteAdjustingRef.current = true;
      el.style.scrollBehavior = "auto";
      el.scrollLeft = scrollPos - singleSetWidth;
      isInfiniteAdjustingRef.current = false;
    } else if (scrollPos <= singleSetWidth / 2) {
      // Reached left clone set -> jump forward to main set
      isInfiniteAdjustingRef.current = true;
      el.style.scrollBehavior = "auto";
      el.scrollLeft = scrollPos + singleSetWidth;
      isInfiniteAdjustingRef.current = false;
    }

    // Calculate real index (0..N-1)
    const currentExtendedIdx = Math.round(el.scrollLeft / panelW);
    const realIdx = ((currentExtendedIdx % N) + N) % N;
    setActiveRealIndex(realIdx);
  }, [N, getPanelFullWidth]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Navigate to slide relative to current position
  const stepSlide = useCallback(
    (direction: "left" | "right") => {
      if (!scrollRef.current || N === 0) return;
      const el = scrollRef.current;
      const panelW = getPanelFullWidth();
      if (panelW === 0) return;

      const currentExtIdx = Math.round(el.scrollLeft / panelW);
      const targetExtIdx = direction === "right" ? currentExtIdx + 1 : currentExtIdx - 1;

      el.scrollTo({ left: targetExtIdx * panelW, behavior: "smooth" });
    },
    [N, getPanelFullWidth]
  );

  const goToRealSlide = useCallback(
    (targetRealIdx: number) => {
      if (!scrollRef.current || N === 0) return;
      const el = scrollRef.current;
      const panelW = getPanelFullWidth();
      if (panelW === 0) return;

      const targetExtIdx = N + targetRealIdx;
      el.scrollTo({ left: targetExtIdx * panelW, behavior: "smooth" });
    },
    [N, getPanelFullWidth]
  );

  // Pointer Event Handlers for Drag & Swipe
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (!scrollRef.current) return;

    isPointerDownRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    scrollLeftStartRef.current = scrollRef.current.scrollLeft;
    isGestureDeterminedRef.current = false;
    isHorizontalDragRef.current = false;
    isDraggingRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || !scrollRef.current) return;

    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (!isGestureDeterminedRef.current) {
      if (absDx > 5 || absDy > 5) {
        isGestureDeterminedRef.current = true;
        if (absDx >= absDy) {
          isHorizontalDragRef.current = true;
          setIsCursorGrabbing(true);
          scrollRef.current.style.scrollSnapType = "none";
        } else {
          isHorizontalDragRef.current = false;
        }
      }
    }

    if (isHorizontalDragRef.current) {
      scrollRef.current.scrollLeft = scrollLeftStartRef.current - dx;
      if (absDx > 8) {
        isDraggingRef.current = true;
      }
    }
  };

  const handlePointerUpOrCancel = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsCursorGrabbing(false);

    if (scrollRef.current) {
      scrollRef.current.style.scrollSnapType = "x mandatory";
      if (isHorizontalDragRef.current) {
        const panelW = getPanelFullWidth();
        if (panelW > 0) {
          const nearestIdx = Math.round(scrollRef.current.scrollLeft / panelW);
          scrollRef.current.scrollTo({ left: nearestIdx * panelW, behavior: "smooth" });
        }
      }
    }

    isGestureDeterminedRef.current = false;
    isHorizontalDragRef.current = false;

    setTimeout(() => {
      isDraggingRef.current = false;
    }, 120);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      stepSlide("left");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      stepSlide("right");
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  if (activeSlides.length === 0) {
    return null;
  }

  return (
    <section
      className="relative w-full max-w-full overflow-hidden bg-[#0A0A0C] select-none p-0 m-0 min-h-[560px] sm:min-h-[620px] lg:min-h-[700px] flex items-center justify-center border-b border-white/[0.08]"
      aria-label="Homepage Featured Merchandising Hero"
    >
      {/* Ambient background radial highlight */}
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#F5C518]/[0.08] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-gradient-to-tr from-purple-500/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Left Navigation Chevron */}
      <button
        type="button"
        onClick={() => stepSlide("left")}
        aria-label="Previous slide"
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 min-w-[44px] min-h-[44px] bg-[#121318]/80 backdrop-blur-md hover:bg-[#181920] border border-white/10 hover:border-[#F5C518]/40 text-white flex items-center justify-center rounded-2xl transition-all duration-200 shadow-lg shadow-black/50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C518]"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Right Navigation Chevron */}
      <button
        type="button"
        onClick={() => stepSlide("right")}
        aria-label="Next slide"
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 min-w-[44px] min-h-[44px] bg-[#121318]/80 backdrop-blur-md hover:bg-[#181920] border border-white/10 hover:border-[#F5C518]/40 text-white flex items-center justify-center rounded-2xl transition-all duration-200 shadow-lg shadow-black/50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C518]"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Infinite Seamless Slide Track */}
      <div
        ref={scrollRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        onPointerLeave={handlePointerUpOrCancel}
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className={`w-full h-full flex flex-nowrap items-center m-0 p-0 overflow-x-auto scrollbar-none no-scrollbar [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0 select-none outline-none ${
          isCursorGrabbing ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {extendedSlides.map((slide, extIdx) => {
          const realIdx = extIdx % N;
          const eyebrowText = slide.eyebrow || "PREMIUM ANIME COLLECTIBLES";
          const titleText = slide.title || "BRING YOUR FAVOURITE STORIES TO LIFE";
          const descriptionText =
            slide.description ||
            "Curated figures, scale statues, and collectible pieces for people who never stopped loving the characters that shaped them.";
          const primaryBtnLabel = slide.primaryLabel || "SHOP COLLECTIONS";
          const primaryBtnUrl = slide.primaryUrl || "/shop";

          return (
            <div
              key={`${slide.id || realIdx}-ext-${extIdx}`}
              role="group"
              aria-label={`Featured slide ${realIdx + 1} of ${N}`}
              style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
              className="relative flex-none w-full min-w-full h-full min-h-[560px] sm:min-h-[620px] lg:min-h-[700px] flex items-center overflow-hidden py-12 sm:py-16"
            >
              <div className="editorial-container w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
                {/* Left Text & Editorial Content (7 cols on desktop) */}
                <div className="lg:col-span-6 xl:col-span-7 space-y-5 sm:space-y-6 text-left order-2 lg:order-1">
                  {/* Eyebrow badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#F5C518]/10 border border-[#F5C518]/25 text-[#F5C518] text-[11px] font-mono font-bold tracking-widest uppercase shadow-[0_0_12px_rgba(245,197,24,0.15)]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{eyebrowText}</span>
                  </div>

                  {/* Main Campaign Headline */}
                  <div className="space-y-1">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black uppercase tracking-tight text-white leading-[1.08] drop-shadow-md">
                      {titleText}
                    </h1>
                    {slide.titleAccent && (
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F5C518] via-[#FFD700] to-[#D4AF37] uppercase tracking-tight">
                        {slide.titleAccent}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed max-w-xl font-sans">
                    {descriptionText}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3.5 pt-2">
                    <Link
                      href={primaryBtnUrl}
                      onClick={handleLinkClick}
                      className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#F5C518] to-[#D4AF37] text-[#0A0A0C] text-xs sm:text-sm font-bold uppercase tracking-wider hover:brightness-110 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5 active:scale-95 transition-all min-h-[44px] group/btn"
                    >
                      <span>{primaryBtnLabel}</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>

                    <Link
                      href="/collections"
                      onClick={handleLinkClick}
                      className="inline-flex items-center justify-center px-5 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 hover:border-white/30 text-white text-xs sm:text-sm font-semibold uppercase tracking-wider hover:-translate-y-0.5 active:scale-95 transition-all min-h-[44px]"
                    >
                      <span>Explore Vault</span>
                    </Link>
                  </div>

                  {/* Trust Micro-Badges */}
                  <div className="pt-4 flex flex-wrap items-center gap-4 text-[11px] font-mono text-[#64748B] border-t border-white/[0.06]">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#F5C518]" />
                      <span>100% Authentic Japanese Imports</span>
                    </span>
                    <span className="hidden sm:inline text-white/20">•</span>
                    <span>Mint Condition Guarantee</span>
                  </div>
                </div>

                {/* Right Artwork Showcase (5 cols on desktop) */}
                <div className="lg:col-span-6 xl:col-span-5 relative order-1 lg:order-2 flex items-center justify-center">
                  <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/4] max-w-[480px] lg:max-w-none rounded-3xl overflow-hidden bg-gradient-to-br from-[#121318] to-[#181920] border border-white/10 p-4 sm:p-6 shadow-2xl shadow-black/80 flex items-center justify-center group">
                    {/* Glowing highlight ring */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#F5C518]/10 via-transparent to-purple-500/10 opacity-60 rounded-3xl pointer-events-none" />

                    {slide.image ? (
                      <Image
                        src={slide.image}
                        alt={slide.title || "Featured Collectible Artwork"}
                        fill
                        priority={extIdx >= N && extIdx < N + 2}
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 40vw"
                        className="object-contain object-center p-2 group-hover:scale-105 transition-all duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-mono uppercase tracking-widest text-[#64748B]">
                        FICTIONFIGURE VAULT ARTWORK
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Swiper-Style Pagination Indicator Bar */}
      <div
        className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-2 pointer-events-auto bg-[#121318]/70 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg"
        role="tablist"
        aria-label="Hero slide pagination"
      >
        {activeSlides.map((_, realIdx) => {
          const isActive = realIdx === activeRealIndex;
          return (
            <button
              key={realIdx}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Go to slide ${realIdx + 1} of ${N}`}
              onClick={() => goToRealSlide(realIdx)}
              className={`h-2 rounded-full transition-all duration-250 ease-in-out cursor-pointer border-none outline-none p-0 focus:outline-none focus:ring-1 focus:ring-[#F5C518] ${
                isActive
                  ? "w-7 bg-gradient-to-r from-[#F5C518] to-[#D4AF37] shadow-[0_0_8px_rgba(245,197,24,0.6)]"
                  : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
