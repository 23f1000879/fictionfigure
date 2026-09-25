"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useImageAspect, LANDSCAPE_RATIO, AmbientImage } from "@/components/ui/Artwork";
import { TrustStrip } from "@/components/home/TrustStrip";
import type { TrustBenefitItem } from "@/types/cms";

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
  trustItems?: TrustBenefitItem[];
  /** Store-level secondary CTA used when a slide does not define its own. */
  secondaryLabel?: string;
  secondaryUrl?: string;
}

/**
 * Background plate for one slide. Landscape campaign art is shown full-bleed;
 * portrait posters are diffused into an ambient wash (the crisp poster sits in the right column).
 */
function HeroBackdrop({ src, visible, priority }: { src: string; visible: boolean; priority: boolean }) {
  const ratio = useImageAspect(src);
  const landscape = ratio !== null && ratio >= LANDSCAPE_RATIO;
  return (
    <div
      className={`absolute inset-0 transition-opacity duration-700 ease-out ${visible ? "opacity-100" : "opacity-0"}`}
      aria-hidden
    >
      {landscape ? (
        <Image src={src} alt="" fill priority={priority} sizes="100vw" className="object-cover object-[70%_center]" />
      ) : (
        <AmbientImage src={src} opacity={0.45} />
      )}
    </div>
  );
}

export function HeroCarousel({ slides, trustItems, secondaryLabel, secondaryUrl }: HeroCarouselProps) {
  const activeSlides = slides.filter((s) => s.enabled !== false);
  const [index, setIndex] = useState(0);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const N = activeSlides.length;
  const slide = activeSlides[Math.min(index, Math.max(N - 1, 0))];
  const ratio = useImageAspect(slide?.image);
  const isLandscape = ratio !== null && ratio >= LANDSCAPE_RATIO;

  if (!slide) return null;

  const go = (next: number) => setIndex(((next % N) + N) % N);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    pointerStart.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || N < 2) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
  };

  const primaryLabel = slide.primaryLabel || "SHOP COLLECTION";
  const primaryUrl = slide.primaryUrl || "/shop";
  const secLabel = slide.secondaryLabel || secondaryLabel;
  const secUrl = slide.secondaryUrl || secondaryUrl;

  return (
    <section
      className="relative isolate overflow-hidden bg-[#08090B] border-b border-white/[0.06]"
      aria-roledescription="carousel"
      aria-label="Featured campaigns"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {/* Background artwork */}
      <div className="absolute inset-0 -z-10">
        {activeSlides.map((s, i) =>
          s.image ? <HeroBackdrop key={s.id} src={s.image} visible={i === index} priority={i === 0} /> : null
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090B] via-[#08090B]/85 lg:via-[#08090B]/70 to-[#08090B]/10" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#08090B] to-transparent" />
        <div className="absolute right-[12%] top-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-[#F5C518]/[0.07] blur-3xl" />
      </div>

      <div className="ff-container grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center py-10 sm:py-14 lg:py-0 lg:min-h-[clamp(560px,calc(100svh-120px),700px)]">
        {/* Copy */}
        <div key={slide.id} className="ff-fade-up lg:col-span-7 xl:col-span-6 flex flex-col gap-5 lg:py-14">
          {slide.eyebrow && <p className="ff-eyebrow text-[11px]">{slide.eyebrow}</p>}

          <h1 className="font-black uppercase leading-[0.94] tracking-[-0.025em] text-[40px] sm:text-[56px] lg:text-[60px] xl:text-[72px] 2xl:text-[80px]">
            <span className="block text-white">{slide.title}</span>
            {slide.titleAccent && <span className="block text-[#F5C518]">{slide.titleAccent}</span>}
          </h1>

          {slide.description && (
            <p className="text-[14px] sm:text-[15px] leading-relaxed text-[#F7F7F5]/75 max-w-[440px]">
              {slide.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link href={primaryUrl} className="ff-btn ff-btn-gold">
              <span>{primaryLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {secLabel && secUrl && (
              <Link href={secUrl} className="ff-btn ff-btn-outline">
                {secLabel}
              </Link>
            )}
          </div>

          <div className="hidden lg:block mt-3 pt-5 border-t border-white/[0.08] max-w-[620px]">
            <TrustStrip items={trustItems} layout="hero" />
          </div>
        </div>

        {/* Artwork + slide tiles */}
        <div className="lg:col-span-5 xl:col-span-6 flex items-center justify-center lg:justify-end gap-4 xl:gap-5 lg:h-full lg:py-10">
          {!isLandscape && slide.image && (
            <div key={`art-${slide.id}`} className="ff-fade-up relative h-[380px] sm:h-[480px] lg:h-[500px] xl:h-[560px] aspect-[2/3] max-w-full">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority
                sizes="(max-width: 1024px) 70vw, 380px"
                className="object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.7)]"
              />
            </div>
          )}

          {N > 1 && (
            <div
              className={`hidden xl:flex flex-col gap-3 ${isLandscape ? "w-full max-w-[320px]" : "w-[190px] xl:w-[220px]"}`}
              role="tablist"
              aria-label="Choose campaign"
            >
              {activeSlides.map((s, i) => {
                const selected = i === index;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => go(i)}
                    className={`group relative ${isLandscape ? "h-[132px]" : "h-[118px] xl:h-[128px]"} w-full overflow-hidden rounded-[10px] border text-left transition-colors ${
                      selected ? "border-[#F5C518]/70" : "border-white/[0.12] hover:border-white/30"
                    }`}
                  >
                    {s.image && (
                      <Image
                        src={s.image}
                        alt=""
                        fill
                        sizes="220px"
                        className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.06]"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08090B] via-[#08090B]/55 to-[#08090B]/10" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
                      <div className="min-w-0">
                        <p className="ff-display text-[17px] xl:text-[19px] text-white line-clamp-2">{s.title}</p>
                        {s.eyebrow && (
                          <p className="mt-0.5 text-[10px] text-[#F7F7F5]/70 truncate capitalize">
                            {s.eyebrow.toLowerCase()}
                          </p>
                        )}
                      </div>
                      <span className="ff-circle-arrow w-7 h-7 shrink-0">
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile / tablet pager */}
      {N > 1 && (
        <div className="xl:hidden flex items-center justify-center gap-2 pb-5 lg:-mt-6" role="tablist" aria-label="Choose campaign">
          {activeSlides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show campaign ${i + 1} of ${N}`}
              onClick={() => go(i)}
              className="h-6 flex items-center"
            >
              <span
                className={`block h-1 rounded-full transition-all ${i === index ? "w-7 bg-[#F5C518]" : "w-3 bg-white/30"}`}
              />
            </button>
          ))}
        </div>
      )}
      {/* Mobile / tablet: trust row sits under the artwork so the poster stays near the fold */}
      <div className="lg:hidden ff-container pb-6">
        <div className="pt-5 border-t border-white/[0.08]">
          <TrustStrip items={trustItems} layout="hero" />
        </div>
      </div>

    </section>
  );
}
