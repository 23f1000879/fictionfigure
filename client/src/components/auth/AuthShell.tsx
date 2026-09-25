"use client";

import React from "react";
import Image from "next/image";
import { ShieldCheck, Box, Truck } from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useSettings } from "@/context/SettingsContext";

interface AuthShellProps {
  children: React.ReactNode;
  /** Brand statement shown beside the panel on desktop. */
  asideEyebrow?: string;
  asideTitle?: string;
  asideAccent?: string;
  asideText?: string;
}

const VALUES = [
  { icon: ShieldCheck, label: "Authentic collectibles" },
  { icon: Box, label: "Collector-safe packaging" },
  { icon: Truck, label: "Pan-India delivery" },
];

/**
 * Shared cinematic frame for sign-in and registration: global header, existing campaign
 * artwork dimmed into atmosphere, and a dark glass form panel.
 */
export function AuthShell({
  children,
  asideEyebrow = "The FictionFigure experience",
  asideTitle = "Collect what",
  asideAccent = "you love.",
  asideText = "Save your wishlist, track your orders and get restock alerts for the pieces you're hunting.",
}: AuthShellProps) {
  const { cinematicBackgroundUrl } = useSettings();

  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="relative isolate flex-1 overflow-hidden bg-[#08090B] text-[#F7F7F5]">
        <div className="absolute inset-0 -z-10" aria-hidden>
          {cinematicBackgroundUrl && (
            <Image
              src={cinematicBackgroundUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[70%_center] opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#08090B]/90 via-[#08090B]/70 to-[#08090B]/85" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08090B] via-transparent to-[#08090B]/50" />
          <div className="absolute right-[8%] top-1/2 -translate-y-1/2 w-[520px] h-[520px] max-w-full rounded-full bg-[#F5C518]/[0.07] blur-3xl" />
        </div>

        <div className="ff-container grid grid-cols-1 lg:grid-cols-12 gap-10 items-center py-10 sm:py-14 lg:py-16 lg:min-h-[calc(100svh-120px)]">
          {/* Brand statement (desktop) */}
          <div className="hidden lg:block lg:col-span-6 xl:col-span-7 space-y-5">
            <p className="ff-eyebrow">{asideEyebrow}</p>
            <h2 className="font-black uppercase leading-[0.95] tracking-[-0.025em] text-[52px] xl:text-[64px]">
              <span className="block text-white">{asideTitle}</span>
              <span className="block text-[#F5C518]">{asideAccent}</span>
            </h2>
            <p className="text-[15px] leading-relaxed text-[#F7F7F5]/75 max-w-md">{asideText}</p>
            <ul className="flex flex-wrap gap-x-6 gap-y-3 pt-3">
              {VALUES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-[12px] text-[#F7F7F5]/80">
                  <span className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-[#F5C518]" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Form panel */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[460px] rounded-[16px] border border-white/[0.1] bg-[#0D0E12]/85 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] p-6 sm:p-8">
              <div className="absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-[#F5C518]/60 to-transparent" aria-hidden />
              <div className="space-y-6">{children}</div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

/** Panel heading shared by the auth pages. */
export function AuthHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="space-y-2">
      <p className="ff-eyebrow">{eyebrow}</p>
      <h1 className="text-[28px] sm:text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">{title}</h1>
      {text && <p className="text-[13px] text-[#9A9DA5] leading-relaxed">{text}</p>}
    </div>
  );
}
