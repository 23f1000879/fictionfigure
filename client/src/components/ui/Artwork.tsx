"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

import { tinyImageUrl } from "@/lib/tinyImageUrl";

const aspectCache = new Map<string, Promise<number | null>>();

function readAspect(src: string): Promise<number | null> {
  const cached = aspectCache.get(src);
  if (cached) return cached;
  const result = new Promise<number | null>((resolve) => {
    const image = new window.Image();
    image.onload = () => resolve(image.naturalHeight > 0 ? image.naturalWidth / image.naturalHeight : null);
    image.onerror = () => { aspectCache.delete(src); resolve(null); };
    image.src = tinyImageUrl(src, 32);
  });
  if (aspectCache.size >= 128) aspectCache.delete(aspectCache.keys().next().value!);
  aspectCache.set(src, result);
  return result;
}

/** Share small aspect probes across repeated artwork, without reusing stale ratios. */
export function useImageAspect(src?: string | null): number | null {
  const [result, setResult] = useState<{ src: string; ratio: number | null } | null>(null);
  useEffect(() => {
    if (!src) return;
    let alive = true;
    void readAspect(src).then(ratio => { if (alive) setResult({ src, ratio }); });
    return () => { alive = false; };
  }, [src]);
  return result?.src === src ? result.ratio : null;
}

/** Decorative backdrops only need a tiny rendition, including local artwork. */
export function ambientUrl(src: string): string {
  return tinyImageUrl(src, 64, 35);
}

/** Soft, decorative colour wash derived from an artwork asset. */
export function AmbientImage({
  src,
  opacity = 0.45,
  className = "",
}: {
  src: string;
  opacity?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ambientUrl(src)}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className={`ff-ambient absolute inset-0 w-full h-full object-cover scale-110 blur-xl saturate-150 pointer-events-none ${className}`}
      style={{ opacity }}
    />
  );
}

/** Landscape artwork threshold — anything wider than this is treated as a background plate. */
export const LANDSCAPE_RATIO = 1.25;

interface ArtworkFrameProps {
  src: string;
  alt: string;
  /**
   * auto    → landscape art fills the frame (cover); portrait posters are shown whole (contain)
   * cover   → always fill (decorative campaign art only)
   * contain → always show the whole asset
   * ambient → only the blurred backdrop, no crisp artwork
   */
  mode?: "auto" | "cover" | "contain" | "ambient";
  /** Horizontal placement of contained artwork. */
  align?: "left" | "center" | "right";
  /** Extra classes on the contained artwork box (e.g. padding / width). */
  containClassName?: string;
  /** object-position used when covering. */
  coverPosition?: string;
  ambientOpacity?: number;
  priority?: boolean;
  sizes?: string;
  hoverZoom?: boolean;
}

/**
 * Absolutely-positioned artwork layer. Place inside a `relative overflow-hidden` parent.
 */
export function ArtworkFrame({
  src,
  alt,
  mode = "auto",
  align = "right",
  containClassName = "",
  coverPosition = "center",
  ambientOpacity = 0.45,
  priority = false,
  sizes = "(max-width: 1024px) 100vw, 60vw",
  hoverZoom = false,
}: ArtworkFrameProps) {
  const ratio = useImageAspect(mode === "auto" ? src : null);
  const resolved: "cover" | "contain" | "ambient" =
    mode === "auto" ? (ratio !== null && ratio >= LANDSCAPE_RATIO ? "cover" : "contain") : mode;

  const justify = align === "left" ? "justify-start" : align === "center" ? "justify-center" : "justify-end";
  const zoom = hoverZoom ? "transition-transform duration-700 ease-out group-hover:scale-[1.04]" : "";

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden={resolved === "ambient" ? true : undefined}>
      {/* Ambient backdrop — the same asset, blurred into atmosphere */}
      {resolved !== "cover" && <AmbientImage src={src} opacity={ambientOpacity} />}

      {resolved === "cover" && (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={`object-cover ${zoom}`}
          style={{ objectPosition: coverPosition }}
        />
      )}

      {resolved === "contain" && (
        <div className={`absolute inset-0 flex ${justify}`}>
          <div className={`relative h-full ${containClassName || "w-1/2"} ${zoom}`}>
            <Image
              src={src}
              alt={alt}
              fill
              priority={priority}
              sizes={sizes}
              className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
