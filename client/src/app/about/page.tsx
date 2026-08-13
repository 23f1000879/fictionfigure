import React from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/context/CartContext";
import { ShieldCheck, Award, Box } from "lucide-react";

export default function AboutPage() {
  return (
    <CartProvider>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="editorial-container py-10 sm:py-16 space-y-10 text-[#111111]">
        <div className="border-b border-[#E5E5E2] pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6B6B] block">
            ABOUT FICTIONFIGURE
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
            India's Premier Sanctuary for High-End Figures
          </h1>
          <p className="text-xs text-[#6B6B6B] max-w-2xl leading-relaxed">
            FictionFigure was founded to curate authentic scale statues, premium PVC figures, and limited edition art pieces for serious collectors across India.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white border border-[#E5E5E2] p-6 space-y-2">
            <Award className="w-6 h-6 text-[#111111]" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[#111111]">Licensed Studios</h3>
            <p className="text-[#6B6B6B] leading-relaxed">Direct partnerships with certified studios and manufacturers.</p>
          </div>

          <div className="bg-white border border-[#E5E5E2] p-6 space-y-2">
            <Box className="w-6 h-6 text-[#111111]" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[#111111]">Mint Box Guarantee</h3>
            <p className="text-[#6B6B6B] leading-relaxed">Insured double-box padding to protect art packaging.</p>
          </div>

          <div className="bg-white border border-[#E5E5E2] p-6 space-y-2">
            <ShieldCheck className="w-6 h-6 text-[#111111]" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[#111111]">Collector Community</h3>
            <p className="text-[#6B6B6B] leading-relaxed">Dedicated support desk for figure inquiries and order assistance.</p>
          </div>
        </div>
      </main>

      <Footer />
    </CartProvider>
  );
}
