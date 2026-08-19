"use client";

import React from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { useSettings } from "@/context/SettingsContext";

export default function TermsPage() {
  const { supportPhone, supportEmail } = useSettings();

  return (
    <>
      <Header />
      <SearchModal />

      <main className="editorial-container py-12 sm:py-16 space-y-10 text-[#111111]">
        {/* Page Header */}
        <div className="border-b border-[#E5E5E2] pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6B6B] block">
            LEGAL & POLICIES
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
            Terms of Service
          </h1>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-[#444444] leading-relaxed max-w-3xl">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              1. General Terms
            </h2>
            <p>
              By accessing or purchasing from FictionFigure, you agree to be bound by these Terms of Service.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              2. Contact Information
            </h2>
            <p>
              For inquiries regarding store policies, please contact our support team:{" "}
              {Boolean(supportPhone?.trim()) && (
                <a href={`tel:${supportPhone.replace(/\s+/g, "")}`} className="font-mono font-semibold text-[#111111] hover:underline ml-1">
                  {supportPhone}
                </a>
              )}
              {Boolean(supportEmail?.trim()) && (
                <a href={`mailto:${supportEmail.trim()}`} className="font-mono font-semibold text-[#111111] hover:underline ml-2">
                  {supportEmail}
                </a>
              )}.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
