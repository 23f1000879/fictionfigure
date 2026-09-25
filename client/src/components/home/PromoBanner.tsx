import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArtworkFrame } from "@/components/ui/Artwork";

interface PromoBannerProps {
  eyebrow?: string;
  headline: string;
  description?: string;
  ctaText?: string;
  ctaUrl: string;
  imageUrl?: string;
  /** 0–100 from the CMS; strength of the readability gradient over the artwork. */
  overlayStrength?: number;
  textAlign?: "left" | "center" | "right";
}

/** Artwork banner: campaign art + gradient + eyebrow / headline / copy / CTA (reference: "Fresh Drops for Collectors"). */
export function PromoBanner({
  eyebrow = "NEW ARRIVALS",
  headline,
  description,
  ctaText = "SHOP NOW",
  ctaUrl,
  imageUrl,
  overlayStrength = 60,
  textAlign = "left",
}: PromoBannerProps) {
  const strength = Math.min(Math.max(overlayStrength, 0), 100) / 100;
  const alignment =
    textAlign === "center"
      ? "items-center text-center mx-auto"
      : textAlign === "right"
      ? "items-end text-right ml-auto"
      : "items-start text-left";
  const artAlign = textAlign === "right" ? "left" : "right";

  return (
    <section
      aria-label={headline}
      className="group relative h-full min-h-[240px] sm:min-h-[260px] overflow-hidden rounded-[12px] border border-white/[0.08] bg-[#111318]"
    >
      {imageUrl && (
        <ArtworkFrame
          src={imageUrl}
          alt={headline}
          align={artAlign}
          containClassName="w-[42%] sm:w-[34%] py-4"
          coverPosition="70% center"
          hoverZoom
        />
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            textAlign === "right"
              ? `linear-gradient(270deg, rgba(8,9,11,${0.55 + strength * 0.4}) 0%, rgba(8,9,11,${0.2 + strength * 0.4}) 55%, rgba(8,9,11,0) 100%)`
              : `linear-gradient(90deg, rgba(8,9,11,${0.55 + strength * 0.4}) 0%, rgba(8,9,11,${0.2 + strength * 0.4}) 55%, rgba(8,9,11,0) 100%)`,
        }}
      />

      <div className="relative h-full flex p-6 sm:p-8">
        <div className={`flex flex-col justify-center gap-3 max-w-[62%] sm:max-w-[58%] ${alignment}`}>
          <p className="ff-eyebrow">{eyebrow}</p>
          <h2 className="text-[22px] sm:text-[28px] font-extrabold leading-[1.1] tracking-[-0.01em] text-white">
            {headline}
          </h2>
          {description && (
            <p className="text-[13px] leading-relaxed text-[#F7F7F5]/75 line-clamp-2">{description}</p>
          )}
          <Link href={ctaUrl} className="ff-btn ff-btn-gold ff-btn-sm mt-2">
            <span>{ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
