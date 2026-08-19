"use client";

import React from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { Phone, Clock, MapPin, ShieldCheck, Mail } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

export default function ContactPage() {
  const { supportPhone, supportEmail, supportHours, storeLocation, deliveryCoverage } = useSettings();

  return (
    <>
      <Header />
      <SearchModal />

      <main className="editorial-container py-12 sm:py-16 space-y-10 text-[#111111]">
        {/* Page Header */}
        <div className="border-b border-[#E5E5E2] pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6B6B] block">
            CUSTOMER ASSISTANCE
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
            Contact FictionFigure
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] max-w-2xl leading-relaxed">
            Have questions about a figure, order dispatch status, or shipment delivery? Our collector support team is here to assist you.
          </p>
        </div>

        {/* Contact Information Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Card 1: Phone & Email Support */}
          <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#F7F7F5] border border-[#E5E5E2] flex items-center justify-center text-[#111111]">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B] block mb-1">
                Customer Support
              </span>
              {Boolean(supportPhone?.trim()) && (
                <a
                  href={`tel:${supportPhone.replace(/\s+/g, "")}`}
                  className="text-base font-semibold font-mono text-[#111111] hover:underline block mb-1"
                >
                  {supportPhone}
                </a>
              )}
              {Boolean(supportEmail?.trim()) && (
                <a
                  href={`mailto:${supportEmail.trim()}`}
                  className="text-xs font-mono text-[#6B6B6B] hover:underline block"
                >
                  {supportEmail}
                </a>
              )}
            </div>
          </div>

          {/* Card 2: Support Hours */}
          <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#F7F7F5] border border-[#E5E5E2] flex items-center justify-center text-[#111111]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B] block mb-1">
                Working Hours
              </span>
              <div className="text-sm font-semibold text-[#111111]">{supportHours || "Monday – Saturday"}</div>
            </div>
          </div>

          {/* Card 3: Location & Delivery */}
          <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#F7F7F5] border border-[#E5E5E2] flex items-center justify-center text-[#111111]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B] block mb-1">
                Location & Coverage
              </span>
              <div className="text-sm font-semibold text-[#111111]">{storeLocation}</div>
              <div className="text-xs text-[#6B6B6B] mt-0.5">{deliveryCoverage}</div>
            </div>
          </div>
        </div>

        {/* Informational Banner */}
        <div className="bg-[#F7F7F5] border border-[#E5E5E2] p-6 sm:p-8 space-y-3 text-xs text-[#6B6B6B]">
          <h3 className="font-semibold uppercase tracking-wider text-[#111111] text-xs flex items-center">
            <ShieldCheck className="w-4 h-4 mr-2 text-[#111111]" /> Direct Order Assistance
          </h3>
          <p className="leading-relaxed">
            When calling regarding an active purchase, please have your order number ready so our support representative can assist you immediately.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
