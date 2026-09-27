"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { MapPin, Phone, Award, ShieldCheck, Truck, Box, ArrowRight } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

const PILLARS = [
  {
    icon: Award,
    title: "Curated Selection",
    text: "Carefully chosen collectibles focus on genuine character detail, sculpt quality, and paint precision.",
  },
  {
    icon: Box,
    title: "Protective Packaging",
    text: "Every shipment receives protective outer box layering to help prevent box crushing during transit.",
  },
  {
    icon: ShieldCheck,
    title: "Collector-Focused Care",
    text: "Direct phone support during business hours ensures your questions about orders are addressed quickly.",
  },
];

export default function AboutPage() {
  const { supportPhone, supportHours, storeLocation, deliveryCoverage, cinematicBackgroundUrl } = useSettings();

  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="flex-1 bg-[#08090B] text-[#F7F7F5]">
        {/* Hero */}
        <section className="relative isolate overflow-hidden border-b border-white/[0.06]">
          <div className="absolute inset-0 -z-10" aria-hidden>
            {cinematicBackgroundUrl && (
              <Image src={cinematicBackgroundUrl} alt="" fill priority sizes="100vw" className="object-cover object-[70%_30%]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[#08090B]/[0.92] via-[#08090B]/65 to-[#08090B]/25" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#08090B] to-transparent" />
          </div>
          <div className="ff-container py-14 sm:py-20 lg:py-24 lg:min-h-[420px] flex flex-col justify-center">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-[#9A9DA5] mb-4">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span className="text-[#4A4D55]" aria-hidden>
                /
              </span>
              <span className="text-[#F7F7F5]" aria-current="page">
                About
              </span>
            </nav>
            <p className="ff-eyebrow text-[11px]">About our gallery</p>
            <h1 className="mt-3 max-w-3xl font-black uppercase leading-[0.95] tracking-[-0.025em] text-[38px] sm:text-[52px] lg:text-[64px] drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
              Curated Collectibles for <span className="text-[#F5C518]">Devoted Enthusiasts</span>
            </h1>
          </div>
        </section>

        {/* Story + operations */}
        <section className="ff-container py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7 space-y-4">
            <p className="ff-eyebrow">Our story</p>
            <div className="space-y-5 text-[16px] sm:text-[18px] leading-relaxed text-[#F7F7F5]/85 max-w-3xl">
              <p>
                Fiction Figures was established with a singular mission: to bring authentic, high-grade figures, scale statues, and limited-edition collectibles directly to fans across India.
              </p>
              <p className="text-[#9A9DA5]">
                We partner directly with leading international brands and authorized distributors to guarantee 100% authenticity for every box that leaves our warehouse.
              </p>
            </div>
            <div className="pt-4 flex flex-wrap gap-3">
              <Link href="/shop" className="ff-btn ff-btn-gold">
                Shop the collection <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/collections" className="ff-btn ff-btn-outline">
                Browse universes
              </Link>
            </div>
          </div>

          <aside className="lg:col-span-5 rounded-[14px] border border-white/[0.08] bg-[#111318] p-6 sm:p-8 space-y-5">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-white pb-3 border-b border-white/[0.08]">
              Store &amp; Operations
            </h2>
            <ul className="space-y-5 text-[14px]">
              {Boolean(storeLocation?.trim()) && (
                <li className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-full border border-white/[0.12] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[#F5C518]" />
                  </span>
                  <div>
                    <span className="font-semibold text-white block">Headquarters</span>
                    <span className="text-[#9A9DA5]">{storeLocation}</span>
                  </div>
                </li>
              )}
              {Boolean(deliveryCoverage?.trim()) && (
                <li className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-full border border-white/[0.12] flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4 text-[#F5C518]" />
                  </span>
                  <div>
                    <span className="font-semibold text-white block">Delivery Coverage</span>
                    <span className="text-[#9A9DA5]">{deliveryCoverage}</span>
                  </div>
                </li>
              )}
              {Boolean(supportPhone?.trim()) && (
                <li className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-full border border-white/[0.12] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-[#F5C518]" />
                  </span>
                  <div>
                    <span className="font-semibold text-white block">Customer Support Phone</span>
                    <a
                      href={`tel:${supportPhone.replace(/\s+/g, "")}`}
                      className="font-mono text-white hover:text-[#F5C518] transition-colors font-semibold"
                    >
                      {supportPhone}
                    </a>
                    {Boolean(supportHours?.trim()) && (
                      <span className="block text-[12px] text-[#9A9DA5]">{supportHours}</span>
                    )}
                  </div>
                </li>
              )}
            </ul>
          </aside>
        </section>

        {/* Pillars */}
        <section className="ff-container pb-16 lg:pb-20">
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
            {PILLARS.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="group rounded-[14px] border border-white/[0.08] bg-[#111318] p-6 lg:p-7 space-y-3 hover:border-[#F5C518]/40 transition-colors duration-200"
              >
                <span className="w-10 h-10 rounded-[10px] bg-[#F5C518]/10 border border-[#F5C518]/25 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#F5C518]" />
                </span>
                <h3 className="text-[16px] font-bold text-white">{title}</h3>
                <p className="text-[14px] text-[#9A9DA5] leading-relaxed">{text}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Footer showValueStrip={false} />
    </>
  );
}
