import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArtworkFrame } from "@/components/ui/Artwork";

interface CollectorClubProps {
  imageUrl?: string;
}

/**
 * Collector's Club module (reference: bottom-right panel).
 * There is no newsletter endpoint in the backend, so the call to action routes into the
 * existing customer account flow instead of collecting emails that would go nowhere.
 */
export function CollectorClub({ imageUrl }: CollectorClubProps) {
  return (
    <section
      aria-label="Collector's Club"
      className="ff-media relative h-full min-h-[240px] overflow-hidden rounded-[12px] border border-white/[0.08] bg-[#0D0E12]"
    >
      {imageUrl && <ArtworkFrame src={imageUrl} alt="" mode="ambient" ambientOpacity={0.35} />}
      <div className="absolute inset-0 bg-gradient-to-r from-[#08090B]/95 via-[#08090B]/70 to-[#08090B]/30 pointer-events-none" />
      <div className="absolute -right-16 -bottom-16 w-72 h-72 rounded-full bg-[#8B5CF6]/[0.12] blur-3xl pointer-events-none" />

      <div className="relative h-full flex flex-col justify-center gap-3 p-6 sm:p-8 max-w-xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#F7F7F5]/85">Join the</p>
        <h2 className="text-[28px] sm:text-[34px] font-black uppercase leading-[1] tracking-[-0.01em] text-white">
          Collector&apos;s Club
        </h2>
        <p className="text-[13px] sm:text-[14px] leading-relaxed text-[#F7F7F5]/75 max-w-sm">
          Get early access to new drops, restock alerts and member-only offers.
        </p>
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <Link href="/register" className="ff-btn ff-btn-gold ff-btn-sm">
            <span>Create Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link href="/login" className="ff-btn ff-btn-outline ff-btn-sm">
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}
