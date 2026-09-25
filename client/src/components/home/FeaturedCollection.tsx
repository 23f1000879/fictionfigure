import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArtworkFrame } from "@/components/ui/Artwork";

interface FeaturedCollectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  shopUrl?: string;
  buttonLabel?: string;
}

/** Spotlight collection: large campaign artwork with a condensed series headline. */
export function FeaturedCollection({
  title = "FEATURED COLLECTION",
  subtitle = "SPOTLIGHT COLLECTION",
  description,
  imageUrl,
  shopUrl = "/shop",
  buttonLabel = "EXPLORE COLLECTION",
}: FeaturedCollectionProps) {
  if (!imageUrl) return null;

  return (
    <section
      aria-label={title}
      className="group relative h-full min-h-[300px] lg:min-h-[340px] overflow-hidden rounded-[12px] border border-white/[0.08] bg-[#111318]"
    >
      <ArtworkFrame
        src={imageUrl}
        alt={title}
        align="right"
        containClassName="w-[46%] sm:w-[40%] lg:w-[34%] py-5"
        coverPosition="65% center"
        hoverZoom
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#08090B] via-[#08090B]/80 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#08090B]/80 to-transparent pointer-events-none" />

      <div className="relative h-full flex flex-col justify-center gap-3 p-6 sm:p-10 max-w-[62%] lg:max-w-[55%]">
        <p className="ff-eyebrow">{subtitle}</p>
        <h2 className="ff-display text-[34px] sm:text-[48px] lg:text-[56px] text-white">{title}</h2>
        {description && (
          <p className="text-[13px] sm:text-[14px] leading-relaxed text-[#F7F7F5]/75 max-w-md line-clamp-3">
            {description}
          </p>
        )}
        <div className="pt-2">
          <Link href={shopUrl} className="ff-btn ff-btn-gold">
            <span>{buttonLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
