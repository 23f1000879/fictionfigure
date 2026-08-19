"use client";

import React from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { MapPin, Phone, Award, ShieldCheck, Truck, Box } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

export default function AboutPage() {
  const { supportPhone, supportHours, storeLocation, deliveryCoverage } = useSettings();

  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="editorial-container py-12 sm:py-16 space-y-12 text-[#111111]">
        {/* Page Header */}
        <div className="border-b border-[#E5E5E2] pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6B6B] block">
            ABOUT OUR GALLERY
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
            Curated Collectibles for Devoted Enthusiasts
          </h1>
        </div>

        {/* Narrative & Location Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-start text-xs sm:text-sm text-[#444444] leading-relaxed">
          <div className="space-y-4">
            <p>
              FictionFigure was established with a singular mission: to bring authentic, high-grade figures, scale statues, and limited-edition collectibles directly to fans across India.
            </p>
            <p>
              We partner directly with leading international brands and authorized distributors to guarantee 100% authenticity for every box that leaves our warehouse.
            </p>
          </div>

          <div className="bg-[#FAF9F6] border border-[#E5E5E2] p-6 sm:p-8 space-y-6">
            <h3 className="text-xs uppercase font-bold text-[#111111] tracking-widest border-b border-[#E5E5E2] pb-2">
              Store & Operations
            </h3>

            <div className="space-y-4 text-xs">
              {Boolean(storeLocation?.trim()) && (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#111111] block">Headquarters</span>
                    <span className="text-[#6B6B6B]">{storeLocation}</span>
                  </div>
                </div>
              )}

              {Boolean(deliveryCoverage?.trim()) && (
                <div className="flex items-start space-x-3">
                  <Truck className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#111111] block">Delivery Coverage</span>
                    <span className="text-[#6B6B6B]">{deliveryCoverage}</span>
                  </div>
                </div>
              )}

              {Boolean(supportPhone?.trim()) && (
                <div className="flex items-start space-x-3">
                  <Phone className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#111111] block">Customer Support Phone</span>
                    <a href={`tel:${supportPhone.replace(/\s+/g, "")}`} className="font-mono text-[#111111] hover:underline font-semibold">
                      {supportPhone}
                    </a>
                    {Boolean(supportHours?.trim()) && (
                      <span className="block text-[11px] text-[#6B6B6B]">{supportHours}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div className="bg-white border border-[#E5E5E2] p-6 space-y-3">
            <Award className="w-6 h-6 text-[#111111]" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[#111111]">
              Curated Selection
            </h3>
            <p className="text-[#6B6B6B] leading-relaxed">
              Carefully chosen collectibles focus on genuine character detail, sculpt quality, and paint precision.
            </p>
          </div>

          <div className="bg-white border border-[#E5E5E2] p-6 space-y-3">
            <Box className="w-6 h-6 text-[#111111]" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[#111111]">
              Protective Packaging
            </h3>
            <p className="text-[#6B6B6B] leading-relaxed">
              Every shipment receives protective outer box layering to help prevent box crushing during transit.
            </p>
          </div>

          <div className="bg-white border border-[#E5E5E2] p-6 space-y-3">
            <ShieldCheck className="w-6 h-6 text-[#111111]" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[#111111]">
              Collector-Focused Care
            </h3>
            <p className="text-[#6B6B6B] leading-relaxed">
              Direct phone support during business hours ensures your questions about orders are addressed quickly.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
