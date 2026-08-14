import React from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/context/CartContext";

export default function TermsPage() {
  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="editorial-container py-10 sm:py-16 space-y-10 text-[#111111]">
        <div className="border-b border-[#E5E5E2] pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6B6B] block">
            LEGAL TERMS
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
            Terms of Service & Collector Agreement
          </h1>
          <p className="text-xs text-[#6B6B6B] max-w-2xl leading-relaxed">
            By purchasing collectibles on FictionFigure, you agree to the following operational terms and conditions.
          </p>
        </div>

        <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 space-y-6 text-xs text-[#6B6B6B] leading-relaxed max-w-4xl">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">1. Authenticity Guarantee</h3>
            <p>
              FictionFigure sells 100% authentic, licensed figures directly from certified studio distributors.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">2. Pricing & Orders</h3>
            <p>
              All prices listed on FictionFigure are in Indian Rupees (INR). Orders are processed upon manual UPI payment verification or COD acceptance.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
