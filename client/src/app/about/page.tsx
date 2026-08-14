import React from "react";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Award, Box, ShieldCheck, MapPin, Truck, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "About FictionFigure | Collectible Figures & Statues",
  description:
    "FictionFigure is a curated online collectibles store based in Bikaner, Rajasthan, delivering authentic figures, statues, and character merchandise across India.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />

      <main className="editorial-container py-12 sm:py-16 space-y-12 text-[#111111]">
        {/* Hero Header */}
        <div className="border-b border-[#E5E5E2] pb-8 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6B6B] block">
            ABOUT FICTIONFIGURE
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#111111] leading-tight">
            Collect what means something.
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] max-w-2xl leading-relaxed">
            FictionFigure brings together curated figures, statues, and collectibles chosen for craftsmanship, character, and the stories behind them.
          </p>
        </div>

        {/* Brand Philosophy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4 text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">
            <h2 className="text-lg font-semibold text-[#111111] uppercase tracking-wider">
              Our Story & Philosophy
            </h2>
            <p>
              We believe figures aren’t just plastic objects — they are tangible physical anchors to moments, stories, and characters that stayed with us.
            </p>
            <p>
              Operating from <strong className="text-[#111111]">Bikaner, Rajasthan</strong>, FictionFigure was built to serve collectors across India who appreciate quality presentation, reliable packaging, and clear customer support.
            </p>
            <p>
              Whether you are adding your first scale piece or building an established gallery display, every item in our catalog is selected with care.
            </p>
          </div>

          <div className="bg-[#F7F7F5] border border-[#E5E5E2] p-6 sm:p-8 space-y-6 text-xs">
            <h3 className="font-semibold uppercase tracking-wider text-xs text-[#111111]">
              FictionFigure At A Glance
            </h3>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#111111] block">Headquarters</span>
                  <span className="text-[#6B6B6B]">Bikaner, Rajasthan, India</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Truck className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#111111] block">Delivery Coverage</span>
                  <span className="text-[#6B6B6B]">Pan-India shipping across all serviceable PIN codes</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#111111] block">Customer Support Phone</span>
                  <a href="tel:+919797494639" className="font-mono text-[#111111] hover:underline font-semibold">
                    +91 9797494639
                  </a>
                  <span className="block text-[11px] text-[#6B6B6B]">Mon – Sat (10:00 AM – 7:00 PM IST)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div className="bg-white border border-[#E5E5E2] p-6 space-y-3">
            <Award className="w-6 h-6 text-[#111111]" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[#111111]">
              Curated Selection
            </h3>
            <p className="text-[#6B6B6B] leading-relaxed">
              Carefully chosen collectibles focus on genuine character detail, sculpt quality, and paint precision.
            </p>
          </div>

          <div className="bg-white border border-[#E5E5E2] p-6 space-y-3">
            <Box className="w-6 h-6 text-[#111111]" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[#111111]">
              Protective Packaging
            </h3>
            <p className="text-[#6B6B6B] leading-relaxed">
              Every shipment receives protective outer box layering to help prevent box crushing during transit.
            </p>
          </div>

          <div className="bg-white border border-[#E5E5E2] p-6 space-y-3">
            <ShieldCheck className="w-6 h-6 text-[#111111]" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[#111111]">
              Collector-Focused Care
            </h3>
            <p className="text-[#6B6B6B] leading-relaxed">
              Direct phone support during business hours ensures your questions about orders are addressed quickly.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
