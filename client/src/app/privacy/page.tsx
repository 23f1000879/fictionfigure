import React from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/context/CartContext";
import { Lock, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <CartProvider>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="editorial-container py-10 sm:py-16 space-y-10 text-[#111111]">
        <div className="border-b border-[#E5E5E2] pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6B6B] block">
            DATA PROTECTION
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
            Privacy & Data Security Policy
          </h1>
          <p className="text-xs text-[#6B6B6B] max-w-2xl leading-relaxed">
            At FictionFigure, your personal data, shipping addresses, and transaction references are protected with strict 256-bit encryption.
          </p>
        </div>

        <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 space-y-6 text-xs text-[#6B6B6B] leading-relaxed max-w-4xl">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">1. Information We Collect</h3>
            <p>
              We collect your mobile number, full name, shipping address, and email address solely for order processing, mobile OTP verification, and shipment delivery updates.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">2. Data Sharing Restrictions</h3>
            <p>
              We never sell or rent collector personal information to third parties. Your address is shared only with authenticated air freight couriers for package delivery.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">3. Security Encryption</h3>
            <p>
              All customer sessions and API communications are encrypted via SSL/TLS encryption.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </CartProvider>
  );
}
