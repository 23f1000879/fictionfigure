import React from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/context/CartContext";
import { RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";

export default function ReturnsPage() {
  return (
    <CartProvider>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="editorial-container py-10 sm:py-16 space-y-10 text-[#111111]">
        {/* Page Title */}
        <div className="border-b border-[#E5E5E2] pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6B6B] block">
            COLLECTOR GUARANTEE
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
            14-Day Returns & Exchange Policy
          </h1>
          <p className="text-xs text-[#6B6B6B] max-w-2xl leading-relaxed">
            We want you to be completely delighted with your figure acquisition. Unopened items in original factory seal can be returned within 14 days of delivery.
          </p>
        </div>

        {/* Policy Details */}
        <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 space-y-6 text-xs text-[#6B6B6B] leading-relaxed max-w-4xl">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">1. Return Eligibility</h3>
            <p>
              To qualify for a return or replacement:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Item must be unopened with all original manufacturer security seals intact.</li>
              <li>Collector art boxes, accessories, and serialized authenticity cards must be returned in original condition.</li>
              <li>Return request must be initiated within 14 calendar days from delivery date.</li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">2. Transit Damage & Factory Defects</h3>
            <p>
              If your collectible statue arrives with transit damage or factory paint defect, our Collector Support Team will arrange immediate pickup and dispatch a free replacement piece.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">3. How to Initiate a Return</h3>
            <p>
              Contact our support desk at <strong className="text-[#111111]">support@fictionfigure.com</strong> with your order number (#FF-XXXX) and clear photographs of the package seal.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </CartProvider>
  );
}
