import React from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/context/CartContext";
import { Truck, ShieldCheck, Box, Clock } from "lucide-react";

export default function ShippingPage() {
  return (
    <CartProvider>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="editorial-container py-10 sm:py-16 space-y-10 text-[#111111]">
        {/* Page Title */}
        <div className="border-b border-[#E5E5E2] pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6B6B] block">
            COLLECTOR PROTECTION POLICY
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
            Insured Shipping & Packaging Standards
          </h1>
          <p className="text-xs text-[#6B6B6B] max-w-2xl leading-relaxed">
            Every statue, figure, and collectible piece shipped by FictionFigure is packed using specialized double-walled armor boxes and custom transit foam padding.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white border border-[#E5E5E2] p-6 space-y-2">
            <Box className="w-6 h-6 text-[#111111]" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[#111111]">Double-Walled Armor</h3>
            <p className="text-[#6B6B6B] leading-relaxed">High-density outer boxes with corner protectors to prevent box denting during transit.</p>
          </div>

          <div className="bg-white border border-[#E5E5E2] p-6 space-y-2">
            <ShieldCheck className="w-6 h-6 text-[#111111]" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[#111111]">100% Transit Insurance</h3>
            <p className="text-[#6B6B6B] leading-relaxed">All shipments are fully insured against loss, theft, or physical damage prior to delivery.</p>
          </div>

          <div className="bg-white border border-[#E5E5E2] p-6 space-y-2">
            <Clock className="w-6 h-6 text-[#111111]" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[#111111]">24–48h Dispatch</h3>
            <p className="text-[#6B6B6B] leading-relaxed">In-stock items are dispatched within 24–48 hours with real-time tracking links.</p>
          </div>
        </div>

        {/* Shipping Policy Details */}
        <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 space-y-6 text-xs text-[#6B6B6B] leading-relaxed max-w-4xl">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">1. Delivery Options & Costs</h3>
            <p>
              We offer two insured delivery tiers across India:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Insured Standard Courier (3–5 Business Days)</strong>: ₹350 flat rate (Free on orders over ₹15,000).</li>
              <li><strong>Priority Express Air Freight (24–48 Hours)</strong>: ₹500 flat rate for expedited delivery.</li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">2. Order Tracking</h3>
            <p>
              Once your order is processed and handed to our air carrier partners, a unique tracking reference code (TRK-XXXX) will be assigned and updated on your order receipt page.
            </p>
          </section>

          <section className="space-y-2 border-t border-[#E5E5E2] pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">3. Damaged Shipments</h3>
            <p>
              In the unlikely event of transit damage, please record an unboxing video and notify our collector support desk within 48 hours for immediate replacement.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </CartProvider>
  );
}
