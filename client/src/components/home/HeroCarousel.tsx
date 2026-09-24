"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

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

  // Helper to measure panel width + 2px gap
  const getPanelFullWidth = useCallback(() => {
    if (!scrollRef.current || !scrollRef.current.firstElementChild) return 0;
    const firstChild = scrollRef.current.firstElementChild as HTMLElement;
    return firstChild.offsetWidth + 2; // width + gap
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
      className="relative w-full max-w-full overflow-hidden bg-[#111111] select-none p-0 m-0 flex flex-col justify-center h-[calc(100dvh-97px)] sm:h-[calc(100dvh-113px)] min-h-[480px] max-h-[970px]"
      aria-label="Homepage Featured Merchandising Poster Wall"
    >
      {/* Edge Chevron Controls */}
      <button
        type="button"
        onClick={() => stepSlide("left")}
        aria-label="Previous poster panel"
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 bg-black/60 backdrop-blur-xs hover:bg-black/90 text-white flex items-center justify-center rounded-none transition-all duration-150 focus:outline-none"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={() => stepSlide("right")}
        aria-label="Next poster panel"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 bg-black/60 backdrop-blur-xs hover:bg-black/90 text-white flex items-center justify-center rounded-none transition-all duration-150 focus:outline-none"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Infinite Seamless Merchandise Track with 2px gaps */}
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
        className={`w-full h-full flex flex-nowrap gap-[2px] items-center m-0 p-0 overflow-x-auto scrollbar-none no-scrollbar [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0 select-none outline-none ${
          isCursorGrabbing ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {extendedSlides.map((slide, extIdx) => {
          const realIdx = extIdx % N;
          return (
            <div
              key={`${slide.id || realIdx}-ext-${extIdx}`}
              role="group"
              aria-label={`Poster panel ${realIdx + 1} of ${N}`}
              style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
              className="relative flex-none h-full aspect-[596.562/969.641] m-0 p-0 rounded-none border-none shadow-none overflow-hidden bg-[#111111]"
            >
              {/* Entire Artwork Visible — Zero Crop */}
              {slide.image ? (
                <Image
                  src={slide.image}
                  alt={slide.title || "Poster Panel"}
                  fill
                  priority={extIdx >= N && extIdx < N + 4}
                  sizes="(max-width: 689px) 100vw, (max-width: 999px) 50vw, 33vw"
                  className="object-contain object-center rounded-none border-none pointer-events-none"
                />
              ) : (
                <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center text-white/40 text-xs font-mono uppercase tracking-widest">
                  FICTIONFIGURE POSTER
                </div>
              )}

              {/* Minimal Bottom CTA Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent flex flex-col justify-end p-4 sm:p-5 lg:p-6 pointer-events-none">
                {slide.eyebrow && (
                  <span className="text-[10px] sm:text-xs font-sans font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-1 block drop-shadow-sm">
                    {slide.eyebrow}
                  </span>
                )}

                {slide.title && (
                  <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-white tracking-tight drop-shadow-sm line-clamp-1 max-w-[90%] mb-2">
                    {slide.title}
                  </h3>
                )}

                <div className="pointer-events-auto">
                  <Link
                    href={slide.primaryUrl || "/shop"}
                    onClick={handleLinkClick}
                    className="inline-flex items-center px-3 py-1.5 bg-white text-[#111111] hover:bg-[#D4AF37] hover:text-[#111111] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-colors duration-150 shadow-sm rounded-none group/btn"
                  >
                    <span>{slide.primaryLabel || "SHOP NOW"}</span>
                    <ArrowRight className="w-3 h-3 ml-1 group-hover/btn:translate-x-1 transition-transform duration-150" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Swiper-Style Pagination Indicator Overlay */}
      <div
        className="absolute bottom-4 sm:bottom-6 lg:bottom-7 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-[6px] pointer-events-auto"
        role="tablist"
        aria-label="Hero carousel pagination"
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
              className={`h-1.5 rounded-full transition-all duration-180 ease-in-out cursor-pointer border-none outline-none p-0 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] ${
                isActive
                  ? "w-6 bg-[#D4AF37] opacity-100"
                  : "w-1.5 bg-white/70 opacity-60 hover:opacity-100 hover:bg-white"
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}





