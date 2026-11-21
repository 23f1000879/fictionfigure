"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles, Star } from "lucide-react";

export interface CarouselSlide {
  id: string;
  image: string;
  backgroundImage?: string;
  backgroundPosition?: string;
  cardLabel?: string;
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
  secondaryLabel?: string;
  secondaryUrl?: string;
  intervalMs?: number;
}

export function HeroCarousel({ slides, secondaryLabel, secondaryUrl, intervalMs = 6000 }: HeroCarouselProps) {
  const activeSlides = slides.filter((slide) => slide.enabled !== false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reduced, setReduced] = useState(true);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const count = activeSlides.length;
  const goTo = useCallback((next: number) => setIndex(count ? ((next % count) + count) % count : 0), [count]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (count < 2 || paused || hovered || reduced || !intervalMs) return;
    const timer = setTimeout(() => goTo(index + 1), intervalMs);
    return () => clearTimeout(timer);
  }, [count, paused, hovered, reduced, intervalMs, index, goTo]);

  if (!count) return null;
  const slide = activeSlides[Math.min(index, count - 1)];
  const artwork = slide.backgroundImage || slide.image;
  const secondLabel = slide.secondaryLabel || secondaryLabel || "Explore universes";
  const secondUrl = slide.secondaryUrl || secondaryUrl || "/collections";
  const description = slide.description && !/^Enter a brief description/i.test(slide.description)
    ? slide.description
    : "Bring your favorite worlds off the screen. Find the next figure for your collection.";

  return (
    <section className="sakuga-hero" aria-roledescription="carousel" aria-label="Featured collections"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHovered(false); }}
      onPointerDown={(event) => { if (event.pointerType !== "mouse") pointer.current = { x: event.clientX, y: event.clientY }; }}
      onPointerCancel={() => { pointer.current = null; }}
      onPointerUp={(event) => {
        const start = pointer.current;
        pointer.current = null;
        if (start && Math.abs(event.clientX - start.x) > 55 && Math.abs(event.clientX - start.x) > Math.abs(event.clientY - start.y)) goTo(index + (event.clientX < start.x ? 1 : -1));
      }}>
      <div className="ff-container">
        <div className="sakuga-hero-grid">
          <div className="sakuga-hero-copy" key={`copy-${slide.id}`}>
            <span className="sakuga-sticker"><Sparkles size={16} aria-hidden /> {slide.eyebrow || "For the love of anime"}</span>
            <h2>{slide.title}<span>{slide.titleAccent || "Made to collect."}</span></h2>
            <p>{description}</p>
            <div className="flex flex-wrap gap-4">
              <Link href={slide.primaryUrl || "/shop"} className="ff-btn ff-btn-gold">{slide.primaryLabel || "Shop the collection"}</Link>
              <Link href={secondUrl} className="ff-btn ff-btn-outline">{secondLabel}</Link>
            </div>
            <div className="sakuga-hero-note"><Star size={16} aria-hidden /> Big stories. Small shelves. Your universe.</div>
          </div>
          <div className="sakuga-hero-art">
            <span className="sakuga-art-spark sakuga-art-spark-one" aria-hidden>✦</span>
            <span className="sakuga-art-spark sakuga-art-spark-two" aria-hidden>✦</span>
            <div className="sakuga-art-frame" key={`art-${slide.id}`}>
              <div className="sakuga-art-dots" aria-hidden />
              {artwork ? <Image src={artwork} alt={slide.cardLabel || slide.title} fill priority sizes="(max-width: 767px) 90vw, 48vw"
                className={slide.backgroundImage ? "object-cover" : "object-contain p-5"}
                style={{ objectPosition: slide.backgroundPosition || "center" }} /> :
                <div className="sakuga-no-art" aria-hidden><Star /><span>YOUR NEXT<br />OBSESSION.</span><Sparkles /></div>}
              <span className="sakuga-art-label">{slide.cardLabel || "The collector edit"}</span>
            </div>
            <span className="sakuga-art-caption">A little fiction. A lot of feeling.</span>
          </div>
        </div>
        {count > 1 && <div className="sakuga-carousel-nav">
          <div className="sakuga-slide-tabs" aria-label="Choose a featured collection">
            {activeSlides.map((item, i) => <button type="button" key={item.id} onClick={() => goTo(i)} aria-pressed={index === i}
              aria-label={`Show ${item.cardLabel || item.title}`} className={index === i ? "is-active" : ""}>
              {item.cardLabel || item.title}
            </button>)}
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" className="sakuga-round" onClick={() => goTo(index - 1)} aria-label="Previous collection"><ChevronLeft size={18} /></button>
            <button type="button" className="sakuga-round" onClick={() => setPaused(!paused)} aria-label={paused ? "Play slideshow" : "Pause slideshow"}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
            <button type="button" className="sakuga-round" onClick={() => goTo(index + 1)} aria-label="Next collection"><ChevronRight size={18} /></button>
          </div>
        </div>}
      </div>
    </section>
  );
}
