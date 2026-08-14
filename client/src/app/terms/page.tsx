import React from "react";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";

export const metadata: Metadata = {
  title: "Terms & Conditions | FictionFigure",
  description:
    "Review the Terms & Conditions governing website usage, product orders, pricing, shipping, and account policies on FictionFigure.",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="editorial-container py-12 sm:py-16 space-y-10 text-[#111111]">
        {/* Page Header */}
        <div className="border-b border-[#E5E5E2] pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6B6B] block">
            LEGAL TERMS
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
            Terms & Conditions
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] max-w-2xl leading-relaxed">
            Please read these terms carefully before making purchases on FictionFigure (`https://www.fictionfigures.in`).
          </p>
        </div>

        {/* Content */}
        <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 space-y-6 text-xs text-[#6B6B6B] leading-relaxed max-w-4xl">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              1. Website Usage & Scope
            </h3>
            <p>
              By accessing or purchasing from FictionFigure, you agree to comply with these terms. FictionFigure operates as an online e-commerce platform based in Bikaner, Rajasthan, delivering figures and collectibles across India.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              2. Accounts & Phone Verification
            </h3>
            <p>
              Account registration requires valid contact details. Mobile phone OTP verification is used to confirm account ownership and secure customer order status updates.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              3. Product Listings & Availability
            </h3>
            <p>
              We attempt to display accurate product details, descriptions, and high-resolution images. In rare cases where product specifications or stock inventory change, we reserve the right to correct errors or update order statuses accordingly.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              4. Pricing & Payments
            </h3>
            <p>
              All prices listed on FictionFigure are in Indian Rupees (INR). Orders are processed upon payment confirmation (via UPI, Card, Razorpay, or approved Cash on Delivery).
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              5. Shipping & Delivery
            </h3>
            <p>
              Shipments are dispatched from Bikaner, Rajasthan to serviceable destinations across India. Delivery timelines depend on destination logistics networks and courier routing.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              6. Returns & Order Resolution
            </h3>
            <p>
              Replacement requests for items damaged in transit or incorrect items delivered are governed by our official <a href="/returns" className="text-[#111111] underline">Returns & Replacements Policy</a>.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              7. Contact Information
            </h3>
            <p>
              For inquiries regarding store policies or orders, call our customer support team at{" "}
              <a href="tel:+919797494639" className="font-mono font-semibold text-[#111111] hover:underline">
                +91 9797494639
              </a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
