"use client";

import React from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Truck, ShieldCheck, Box, Clock, Phone, MapPin } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

export default function ShippingPage() {
  const { supportPhone, supportHours } = useSettings();
  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="editorial-container py-12 sm:py-16 space-y-10 text-[#111111]">
        {/* Page Title Header */}
        <div className="border-b border-[#E5E5E2] pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6B6B] block">
            STORE POLICY
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
            Shipping & Delivery Standards
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] max-w-2xl leading-relaxed">
            Fiction Figures dispatches orders from Bikaner, Rajasthan, delivering figures and collectibles to serviceable PIN codes across India.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white border border-[#E5E5E2] p-6 space-y-2">
            <Truck className="w-6 h-6 text-[#111111]" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[#111111]">Pan-India Coverage</h3>
            <p className="text-[#6B6B6B] leading-relaxed">We ship to major cities and regional PIN codes nationwide via courier partners.</p>
          </div>

          <div className="bg-white border border-[#E5E5E2] p-6 space-y-2">
            <Box className="w-6 h-6 text-[#111111]" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[#111111]">Protective Layering</h3>
            <p className="text-[#6B6B6B] leading-relaxed">Orders are carefully wrapped with outer box protection to cushion items during transit.</p>
          </div>

          <div className="bg-white border border-[#E5E5E2] p-6 space-y-2">
            <Clock className="w-6 h-6 text-[#111111]" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[#111111]">Order Processing</h3>
            <p className="text-[#6B6B6B] leading-relaxed">Standard order verification and dispatch preparation takes 1 to 3 business days.</p>
          </div>
        </div>

        {/* Shipping Detailed Sections */}
        <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 space-y-6 text-xs text-[#6B6B6B] leading-relaxed max-w-4xl">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">1. Delivery Coverage</h3>
            <p>
              We deliver across India from our facility in Bikaner, Rajasthan. Serviceability and exact transit times depend on destination PIN code availability with our national logistics partners.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">2. Processing & Dispatch Timeline</h3>
            <p>
              Orders undergo payment/address verification prior to dispatch. Order processing typically takes 1–3 business days. Once handed over to the courier, tracking information will be updated under your customer account or order status link.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">3. Delivery Timelines & Charges</h3>
            <p>
              Transit durations vary depending on courier network routing and regional distance from Rajasthan. Applicable shipping charges (if any) are calculated and clearly displayed during checkout prior to payment.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">4. Tracking & Delivery Support</h3>
            <p>
              When your package is dispatched, a tracking reference is generated so you can follow shipment status online. In case of unexpected delivery delays, wrong address updates, or courier attempts, contact our support phone for assistance.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4 text-[#111111]">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Need Shipping Assistance?</h3>
            <p className="text-xs text-[#6B6B6B]">
              Reach our support team directly:{" "}
              {Boolean(supportPhone?.trim()) && (
                <a href={`tel:${supportPhone.replace(/\s+/g, "")}`} className="font-mono font-semibold text-[#111111] hover:underline">
                  {supportPhone}
                </a>
              )}
              {Boolean(supportHours?.trim()) && (
                <span className="ml-1">({supportHours})</span>
              )}.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
