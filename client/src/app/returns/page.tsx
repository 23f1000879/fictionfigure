"use client";

import React from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useSettings } from "@/context/SettingsContext";

export default function ReturnsPage() {
  const { supportPhone, supportEmail, supportHours, storeLocation } = useSettings();

  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="editorial-container py-12 sm:py-16 space-y-10 text-[#111111]">
        {/* Page Header */}
        <div className="border-b border-[#E5E5E2] pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6B6B] block">
            STORE POLICY
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
            Returns & Replacements Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] max-w-2xl leading-relaxed">
            We aim for every collectible to arrive in sound condition. Please review our clear replacement and order resolution guidelines below.
          </p>
        </div>

        {/* Policy Content */}
        <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 space-y-6 text-xs text-[#6B6B6B] leading-relaxed max-w-4xl">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              1. Replacement Eligibility (Damaged or Incorrect Items)
            </h3>
            <p>
              If your package arrives with physical damage from transit, missing parts, or if an incorrect product was delivered, you may request a replacement within 48 hours of delivery.
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-[#6B6B6B]">
              <li>Notice must be reported promptly within 48 hours of receiving the shipment.</li>
              <li>Item must be kept in its original packaging with all included accessories and art box components intact.</li>
              <li>An unboxing video or photographs showing the outer shipping box and delivered contents may be requested to assist our team in verifying transit damage claims.</li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              2. Cancellation Before Shipment
            </h3>
            <p>
              Orders can be canceled prior to dispatch by contacting support. Once an order has been verified, packed, and handed over to courier partners for transit, standard shipment processing applies.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              3. Non-Returnable Conditions
            </h3>
            <p>
              Due to the delicate nature of scale figures and limited-edition art statues, items that have been opened, assembled, altered, or damaged through post-delivery handling are non-returnable unless a verified manufacturing or transit defect exists.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              4. How to Request Support
            </h3>
            <p>
              To initiate a replacement check or report an order issue, please contact our support phone:
            </p>
            <div className="bg-[#F7F7F5] border border-[#E5E5E2] p-4 text-xs space-y-1 font-mono text-[#111111]">
              <div><strong>Phone Support:</strong> +91 9797494639</div>
              <div><strong>Support Hours:</strong> Monday – Saturday (10:00 AM – 7:00 PM IST)</div>
              <div><strong>Location:</strong> Bikaner, Rajasthan</div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
