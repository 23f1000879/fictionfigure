"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AmbientImage } from "@/components/ui/Artwork";

export interface CarouselSlide {
  id: string;
  /** Foreground artwork: sharp, contained collection/product art (also used on the selector card). */
  image: string;
  /** Full-bleed cinematic background for the whole hero (admin controlled, optional). */
  backgroundImage?: string;
  /** CSS object-position focal point for the background, e.g. "70% 30%". */
  backgroundPosition?: string;
  /** Short selector-card label, e.g. "ONE PIECE" (falls back to title). */
  cardLabel?: string;
  /** Selector-card caption, e.g. "Collection" (falls back to eyebrow). */
  cardCaption?: string;
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
  /** Store-level secondary CTA used when a slide does not define its own. */
  secondaryLabel?: string;
  secondaryUrl?: string;
  /** Autoplay interval; set 0 to disable. */
  intervalMs?: number;
}

const FADE_MS = 500;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function HeroCarousel({
  slides,
  secondaryLabel,
  secondaryUrl,
  intervalMs = 6000,
}: HeroCarouselProps) {
  const activeSlides = slides.filter((s) => s.enabled !== false);
  const N = activeSlides.length;

  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  // Bumped on every manual selection so the autoplay timer restarts from zero.
  const [timerEpoch, setTimerEpoch] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const goTo = useCallback(
    (next: number, manual = false) => {
      if (N === 0) return;
      const target = ((next % N) + N) % N;
      setIndex((current) => {
        if (current !== target) setPrevIndex(current);
        return target;
      });
      if (manual) setTimerEpoch((e) => e + 1);
    },
    [N]
  );

  // Drop the outgoing background once its fade-out has finished.
  useEffect(() => {
    if (prevIndex === null) return;
    const t = setTimeout(() => setPrevIndex(null), FADE_MS + 50);
    return () => clearTimeout(t);
  }, [prevIndex, index]);

  // Autoplay
  useEffect(() => {
    if (N < 2 || paused || reducedMotion || !intervalMs) return;
    const t = setTimeout(() => goTo(index + 1), intervalMs);
    return () => clearTimeout(t);
  }, [N, index, paused, reducedMotion, intervalMs, timerEpoch, goTo]);

  if (N === 0) return null;
  const slide = activeSlides[Math.min(index, N - 1)];
  const nextIndex = (index + 1) % N;
  const hasBackground = Boolean(slide.backgroundImage);

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
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) goTo(index + (dx < 0 ? 1 : -1), true);
  };

  // Only the active, outgoing and next backgrounds are mounted: active loads eagerly,
  // next preloads at opacity 0, everything else stays unloaded.
  const mountedBackgrounds = new Set<number>([index, nextIndex]);
  if (prevIndex !== null) mountedBackgrounds.add(prevIndex);

  const primaryLabel = slide.primaryLabel || "SHOP COLLECTION";
  const primaryUrl = slide.primaryUrl || "/shop";
  const secLabel = slide.secondaryLabel || secondaryLabel;
  const secUrl = slide.secondaryUrl || secondaryUrl;
  const fade = reducedMotion ? "" : "transition-opacity ease-out";

  return (
    <section
      className="relative isolate overflow-hidden bg-[#08090B] border-b border-white/[0.06]"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* ── Layer 1: cinematic backgrounds (crossfaded) ── */}
      <div className="absolute inset-0 -z-10" aria-hidden>
        {activeSlides.map((s, i) => {
          if (!s.backgroundImage || !mountedBackgrounds.has(i)) return null;
          return (
            <div
              key={s.id}
              data-hero-bg={s.id}
              className={`absolute inset-0 ${fade}`}
              style={{ opacity: i === index ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
            >
              <Image
                src={s.backgroundImage}
                alt=""
                fill
                priority={i === index && i === 0}
                sizes="100vw"
                className="object-cover"
                style={{ objectPosition: s.backgroundPosition || "70% center" }}
              />
              {/*
                Atmospheric continuation (desktop): the same artwork, mirrored and diffused, screened
                into the left half so the scene's own light and colour carry on behind the copy.
                Built from the 64px rendition, so it reads as haze — never as a second image.
              */}
              <div
                data-hero-atmos={s.id}
                className="hidden lg:block absolute inset-0 pointer-events-none mix-blend-screen"
                style={{
                  WebkitMaskImage: "linear-gradient(to right, #000 0%, #000 22%, transparent 60%)",
                  maskImage: "linear-gradient(to right, #000 0%, #000 22%, transparent 60%)",
                }}
              >
                <div className="absolute inset-0" style={{ transform: "scaleX(-1)" }}>
                  <AmbientImage src={s.backgroundImage} opacity={0.65} />
                </div>
              </div>
            </div>
          );
        })}

        {/* Placeholder atmosphere for slides without background artwork yet */}
        <div
          className={`absolute inset-0 ${fade}`}
          style={{ opacity: hasBackground ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_45%,rgba(245,197,24,0.10),transparent_55%),radial-gradient(ellipse_at_95%_100%,rgba(139,92,246,0.10),transparent_50%)]" />
        </div>

        {/* ── Layers 2–4: readability without flattening the art ── */}
        {/* Desktop: dark but see-through on the left, easing into the artwork on the right */}
        <div
          className="hidden lg:block absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(8,9,11,0.80) 0%, rgba(8,9,11,0.66) 28%, rgba(8,9,11,0.42) 50%, rgba(8,9,11,0.16) 72%, rgba(8,9,11,0.10) 100%)",
          }}
        />
        {/* Soft shade that follows the copy block — keeps contrast where the letters are */}
        <div
          className="hidden lg:block absolute inset-0"
          style={{ background: "radial-gradient(ellipse 44% 60% at 24% 52%, rgba(8,9,11,0.6) 0%, transparent 78%)" }}
        />
        {/* Below lg the copy spans the full width, so the art is dimmed evenly rather than from the left */}
        <div
          className="lg:hidden absolute inset-0"
          style={{ background: "linear-gradient(90deg, rgba(8,9,11,0.82) 0%, rgba(8,9,11,0.6) 100%)" }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#08090B] via-[#08090B]/60 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#08090B]/60 to-transparent" />
      </div>

      {/* ── Layer 5: foreground ── */}
      <div className="ff-container grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center pt-10 pb-6 sm:pt-14 lg:py-0 lg:min-h-[520px] xl:min-h-[560px]">
        {/* Copy */}
        <div key={slide.id} className="ff-fade-up lg:col-span-6 flex flex-col gap-5 lg:py-12" aria-live="polite">
          {slide.eyebrow && <p className="ff-eyebrow text-[11px]">{slide.eyebrow}</p>}

          <h1 className="font-black uppercase leading-[0.94] tracking-[-0.025em] text-[40px] sm:text-[56px] lg:text-[60px] xl:text-[72px] drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            <span className="block text-white">{slide.title}</span>
            {slide.titleAccent && <span className="block text-[#F5C518]">{slide.titleAccent}</span>}
          </h1>

          {slide.description && (
            <p className="text-[14px] sm:text-[15px] leading-relaxed text-[#F7F7F5]/80 max-w-[440px]">
              {slide.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link href={primaryUrl} className="ff-btn ff-btn-gold">
              <span>{primaryLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {secLabel && secUrl && (
              <Link href={secUrl} className="ff-btn ff-btn-outline backdrop-blur-sm">
                {secLabel}
              </Link>
            )}
          </div>

        </div>

        {/* Foreground artwork + collection selector */}
        <div className="lg:col-span-6 flex items-center justify-center lg:justify-end gap-4 xl:gap-5 lg:py-10">
          {/* Contained foreground art is shown only while a slide has no background plate */}
          {!hasBackground && slide.image && (
            <div
              key={`art-${slide.id}`}
              className="ff-fade-up relative h-[360px] sm:h-[460px] lg:h-[480px] xl:h-[540px] aspect-[2/3] max-w-full"
            >
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
              className={`hidden flex-col gap-3 ${
                hasBackground ? "lg:flex w-full max-w-[320px] xl:max-w-[360px] 3xl:max-w-[400px]" : "xl:flex w-[220px]"
              }`}
              role="tablist"
              aria-label="Choose collection"
            >
              {activeSlides.map((s, i) => (
                <SelectorCard
                  key={s.id}
                  slide={s}
                  selected={i === index}
                  onSelect={() => goTo(i, true)}
                  size={hasBackground ? "lg" : "md"}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile / tablet collection rail */}
      {N > 1 && (
        <div
          className={`${hasBackground ? "lg:hidden" : "xl:hidden"} ff-container pb-5`}
          role="tablist"
          aria-label="Choose collection"
        >
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 scroll-px-4 sm:mx-0 sm:px-0 sm:scroll-px-0 snap-x">
            {activeSlides.map((s, i) => (
              <div key={s.id} className="snap-start shrink-0 w-[46%] sm:w-[31%] lg:w-[24%]">
                <SelectorCard slide={s} selected={i === index} onSelect={() => goTo(i, true)} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  );
}

function SelectorCard({
  slide,
  selected,
  onSelect,
  size,
}: {
  slide: CarouselSlide;
  selected: boolean;
  onSelect: () => void;
  size: "sm" | "md" | "lg";
}) {
  const label = slide.cardLabel || slide.title;
  const caption = slide.cardCaption || slide.eyebrow;
  const height = size === "lg" ? "h-[118px] xl:h-[128px]" : size === "md" ? "h-[120px]" : "h-[92px]";
  const thumb = slide.image || slide.backgroundImage;

  return (
    <div
      className={`group relative ${height} w-full overflow-hidden rounded-[10px] border transition-[border-color,box-shadow] duration-300 ${
        selected
          ? "border-[#F5C518]/80 shadow-[0_0_0_1px_rgba(245,197,24,0.35),0_12px_30px_-10px_rgba(245,197,24,0.35)]"
          : "border-white/[0.14] hover:border-white/35"
      }`}
    >
      {thumb && (
        <Image
          src={thumb}
          alt=""
          fill
          sizes="(max-width: 1024px) 45vw, 320px"
          className={`object-cover object-top transition-transform duration-700 group-hover:scale-[1.05] ${
            selected ? "" : "opacity-80"
          }`}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#08090B]/90 via-[#08090B]/45 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090B]/80 to-transparent" />

      {/* Whole card selects the slide */}
      <button
        type="button"
        role="tab"
        aria-selected={selected}
        aria-label={`Show ${label}`}
        onClick={onSelect}
        className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C518] rounded-[10px]"
      />

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 pointer-events-none">
        <div className="min-w-0">
          <p
            className={`ff-display text-white line-clamp-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] ${
              size === "sm" ? "text-[15px]" : "text-[19px] xl:text-[21px]"
            }`}
          >
            {label}
          </p>
          {caption && (
            <p className="mt-0.5 text-[11px] text-[#F7F7F5]/75 truncate capitalize">{caption.toLowerCase()}</p>
          )}
        </div>
        {/* Arrow navigates straight to the collection */}
        <Link
          href={slide.primaryUrl || "/shop"}
          aria-label={`Open ${label}`}
          className="pointer-events-auto relative z-20 ff-circle-arrow w-8 h-8 shrink-0 hover:bg-[#F5C518] hover:border-[#F5C518] hover:text-[#08090B]"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
