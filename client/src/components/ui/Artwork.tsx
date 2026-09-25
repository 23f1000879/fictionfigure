"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

/**
 * Returns a tiny Cloudinary rendition of an asset so we can read its aspect ratio cheaply.
 * Non-Cloudinary URLs are returned unchanged.
 */
function probeUrl(src: string): string {
  if (src.includes("res.cloudinary.com") && src.includes("/upload/")) {
    return src.replace("/upload/", "/upload/w_24/");
  }
  return src;
}

/**
 * Natural width / height of an image, or null until known.
 * Used to decide whether campaign artwork is landscape (full-bleed background)
 * or a portrait poster (shown whole over an ambient backdrop).
 */
export function useImageAspect(src?: string | null): number | null {
  const [ratio, setRatio] = useState<number | null>(null);

  useEffect(() => {
    if (!src) {
      setRatio(null);
      return;
    }
    let alive = true;
    const img = new window.Image();
    img.onload = () => {
      if (alive && img.naturalHeight > 0) setRatio(img.naturalWidth / img.naturalHeight);
    };
    img.src = probeUrl(src);
    return () => {
      alive = false;
    };
  }, [src]);

  return ratio;
}

/**
 * Low-resolution rendition for ambient backdrops. Upscaling a 64px copy gives a soft wash
 * at a fraction of the paint cost of a large CSS blur over a full-size image.
 */
export function ambientUrl(src: string): string {
  if (src.includes("res.cloudinary.com") && src.includes("/upload/")) {
    return src.replace("/upload/", "/upload/w_64,q_auto/");
  }
  return src;
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
      className={`absolute inset-0 w-full h-full object-cover scale-110 blur-xl saturate-150 pointer-events-none ${className}`}
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
