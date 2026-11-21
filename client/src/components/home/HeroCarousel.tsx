"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play, Truck, CreditCard, LockKeyhole } from "lucide-react";
import { AmbientImage, useImageAspect } from "@/components/ui/Artwork";
import type { CampaignSlide } from "@/lib/heroSlides";

export type CarouselSlide = CampaignSlide;
interface HeroCarouselProps {
  slides: CampaignSlide[];
  secondaryLabel?: string;
  secondaryUrl?: string;
  intervalMs?: number;
  preview?: boolean;
}

function CampaignAction({ href, children, primary, preview }: { href: string; children: React.ReactNode; primary?: boolean; preview: boolean }) {
  const className = `ff-btn ${primary ? "concept-pink" : "ff-btn-outline"}`;
  if (preview) return <span className={className}>{children}</span>;
  return <Link href={href} className={className} data-sakuga={primary ? "primary" : undefined}>{children}</Link>;
}

export function HeroCarousel({ slides, secondaryLabel, secondaryUrl, intervalMs = 6500, preview = false }: HeroCarouselProps) {
  const campaigns = useMemo(() => slides.filter(slide => slide.enabled !== false).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [slides]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(true);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [timerEpoch, setTimerEpoch] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const rootRef = useRef<HTMLElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const stageId = useId();
  const remainingMs = useRef(intervalMs);
  const count = campaigns.length;
  const index = Math.max(0, campaigns.findIndex(slide => slide.id === selectedId));
  const slide = campaigns[index];
  const artworkAspect = useImageAspect(slide?.backgroundImage || slide?.image);
  const stopped = paused || hovered || focused || reduced || !visible || !documentVisible || preview || intervalMs <= 0;

  const goTo = useCallback((next: number) => {
    if (!count) return;
    setSelectedId(campaigns[((next % count) + count) % count].id);
    setTimerEpoch(epoch => epoch + 1);
  }, [campaigns, count]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduced(preference.matches);
    const updateVisibility = () => setDocumentVisible(!document.hidden);
    updateMotion(); updateVisibility();
    preference.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 }) : null;
    if (rootRef.current) observer?.observe(rootRef.current);
    return () => {
      preference.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    remainingMs.current = intervalMs;
  }, [index, timerEpoch, intervalMs, count]);

  useEffect(() => {
    const rail = selectorRef.current;
    const selected = rail?.querySelector<HTMLElement>("[aria-pressed='true']");
    if (!rail || !selected) return;
    const left = selected.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft;
    const right = left + selected.offsetWidth;
    if (left < rail.scrollLeft || right > rail.scrollLeft + rail.clientWidth) {
      rail.scrollTo({ left: left < rail.scrollLeft ? left : right - rail.clientWidth, behavior: reduced ? "auto" : "smooth" });
    }
  }, [index, selectedId, reduced, count]);

  useEffect(() => {
    if (stopped || count < 2) return;
    const startedAt = performance.now();
    const timer = window.setTimeout(() => goTo(index + 1), remainingMs.current);
    return () => {
      window.clearTimeout(timer);
      remainingMs.current = Math.max(0, remainingMs.current - (performance.now() - startedAt));
    };
  }, [count, goTo, index, intervalMs, stopped, timerEpoch]);

  if (!slide) return null;
  const background = slide.backgroundImage && !failedImages.has(slide.backgroundImage) ? slide.backgroundImage : "";
  // A supplied campaign background is the hero artwork. Do not repeat the same
  // advertisement inside a second image panel over it.
  const foreground = !background && slide.image && !failedImages.has(slide.image) ? slide.image : "";
  const hasArtwork = Boolean(background || foreground);
  const secondaryText = slide.secondaryLabel || secondaryLabel;
  const secondaryHref = slide.secondaryUrl || secondaryUrl;
  const description = slide.description && !/^Enter a brief description/i.test(slide.description) ? slide.description : "";
  const onImageError = (src: string) => setFailedImages(previous => new Set(Array.from(previous).concat(src)));

  return <section ref={rootRef} className={`campaign-hero ${background ? "campaign-hero--cinematic" : "campaign-hero--poster"} ${preview ? "campaign-hero--preview" : ""}`}
    aria-roledescription="carousel" aria-label="Featured campaigns" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false); }}>
    <div className="ff-container campaign-shell">
      <div id={stageId} className="campaign-stage" tabIndex={count > 1 && !preview ? 0 : undefined}
        onKeyDown={event => {
          if ((event.target as HTMLElement).closest("a,button,input,select,textarea")) return;
          if (event.key === "ArrowRight") { event.preventDefault(); goTo(index + 1); }
          if (event.key === "ArrowLeft") { event.preventDefault(); goTo(index - 1); }
        }}
        onPointerDown={event => {
          if (event.pointerType === "mouse" || (event.target as HTMLElement).closest("a,button")) return;
          touch.current = { x: event.clientX, y: event.clientY };
        }} onPointerCancel={() => { touch.current = null; }} onPointerUp={event => {
          const start = touch.current; touch.current = null;
          if (!start || count < 2) return;
          const dx = event.clientX - start.x;
          if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(event.clientY - start.y)) goTo(index + (dx < 0 ? 1 : -1));
        }}>
        <div key={`copy-${slide.id}`} className="campaign-copy" role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${count}: ${slide.title}`}
          aria-live={stopped ? "polite" : "off"}>
          {slide.eyebrow && <span className="campaign-eyebrow">{slide.eyebrow}</span>}
          <h2>{slide.title || "New arrivals"}{slide.titleAccent && <span>{slide.titleAccent}</span>}</h2>
          {description && <p>{description}</p>}
          <div className="campaign-actions">
            <CampaignAction href={slide.primaryUrl || "/shop?sortBy=newest"} primary preview={preview}>{slide.primaryLabel || "Shop the drop"}</CampaignAction>
            {secondaryText && secondaryHref && <CampaignAction href={secondaryHref} preview={preview}>{secondaryText}</CampaignAction>}
          </div>
        </div>
        <div key={`art-${slide.id}`} className={`campaign-visual ${!hasArtwork ? "campaign-visual--empty" : ""}`} style={artworkAspect ? { "--campaign-art-ratio": artworkAspect } as React.CSSProperties : undefined}>
          {background && <div className="campaign-backdrop" aria-hidden>
            <AmbientImage src={background} opacity={0.45} />
            <Image src={background} alt="" fill priority={!preview && index === 0} sizes="100vw" className="campaign-background-image" style={{ objectPosition: slide.backgroundPosition || "center center" }} onError={() => onImageError(background)} />
          </div>}
          {foreground && <div className="campaign-foreground">
            {!background && <AmbientImage src={foreground} opacity={0.12} />}
            <Image src={foreground} alt={slide.cardLabel || slide.title || "Featured collectible"} fill priority={!preview && index === 0} sizes="(max-width: 767px) 100vw, 55vw" className="campaign-foreground-image" onError={() => onImageError(foreground)} />
          </div>}
          {!hasArtwork && <div className="campaign-empty-art" aria-hidden><span>✦</span><strong>Your next<br />favourite.</strong><span>✧</span></div>}
        </div>
      </div>
      {count > 1 && !preview && <div className="campaign-navigation">
        <div ref={selectorRef} className="campaign-selectors" aria-label="Choose a campaign">{campaigns.map((campaign, number) => <button key={campaign.id} type="button" onClick={() => goTo(number)} className={`campaign-selector ${number === index ? "is-current" : ""}`}
          aria-pressed={number === index} aria-controls={stageId} aria-label={`Show ${campaign.cardLabel || campaign.title || `campaign ${number + 1}`}`}>
          {(campaign.image || campaign.backgroundImage) && <span className="campaign-selector-thumb"><Image src={campaign.image || campaign.backgroundImage!} alt="" fill sizes="48px" className="object-cover" /></span>}
          <span className="campaign-selector-copy"><span className="campaign-selector-title">{campaign.cardLabel || campaign.title || "New arrivals"}</span>
          {campaign.cardCaption && <span className="campaign-selector-caption">{campaign.cardCaption}</span>}</span>
          {number === index && intervalMs > 0 && !reduced && <span key={`${campaign.id}-${timerEpoch}`} className="campaign-progress" aria-hidden style={{ animationDuration: `${intervalMs}ms`, animationPlayState: stopped ? "paused" : "running" }} />}
        </button>)}</div>
        <div className="campaign-controls"><span className="campaign-count" aria-hidden>{index + 1} / {count}</span>
          <button type="button" className="sakuga-round" onClick={() => goTo(index - 1)} aria-label="Previous campaign" aria-controls={stageId}><ChevronLeft size={20} /></button>
          {intervalMs > 0 && !reduced && <button type="button" className="sakuga-round" onClick={() => setPaused(!paused)} aria-label={paused ? "Play campaigns" : "Pause campaigns"}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>}
          <button type="button" className="sakuga-round" onClick={() => goTo(index + 1)} aria-label="Next campaign" aria-controls={stageId}><ChevronRight size={20} /></button>
        </div>
      </div>}
      {!preview && <ul className="concept-reassurance campaign-reassurance" aria-label="Shopping with us"><li><Truck aria-hidden />Ships across India</li><li><CreditCard aria-hidden />UPI &amp; COD</li><li><LockKeyhole aria-hidden />Secure checkout</li></ul>}
    </div>
  </section>;
}
