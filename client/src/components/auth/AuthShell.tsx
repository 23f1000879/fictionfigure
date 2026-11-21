"use client";

import React from "react";
import { ShieldCheck, Box, Truck, Sparkles } from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";

interface AuthShellProps {
  children: React.ReactNode;
  asideEyebrow?: string;
  asideTitle?: string;
  asideAccent?: string;
  asideText?: string;
}

const VALUES = [
  { icon: ShieldCheck, label: "Authentic collectibles" },
  { icon: Box, label: "Collector-safe packaging" },
  { icon: Truck, label: "Pan-India delivery" },
];

export function AuthShell({ children, asideEyebrow = "The Fiction Figures experience", asideTitle = "Collect what", asideAccent = "you love.", asideText = "Save your wishlist, track your orders and get restock alerts for the pieces you're hunting." }: AuthShellProps) {
  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />
      <main className="sakuga-auth relative flex-1 bg-background text-foreground">
        <div className="ff-container grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center py-10 sm:py-14 lg:py-20 lg:min-h-[calc(100svh-112px)]">
          <div className="hidden lg:block lg:col-span-6 space-y-6">
            <span className="sakuga-sticker"><Sparkles size={16} aria-hidden /> {asideEyebrow}</span>
            <h2 className="font-black leading-[1.02] tracking-[-0.065em] text-[56px] xl:text-[72px]">
              <span className="block">{asideTitle}</span><span className="block text-[#8070d8] italic">{asideAccent}</span>
            </h2>
            <p className="text-base leading-relaxed text-foreground-secondary max-w-md">{asideText}</p>
            <ul className="space-y-4 pt-4">
              {VALUES.map(({ icon: Icon, label }) => <li key={label} className="flex items-center gap-3 text-sm text-foreground-secondary">
                <span className="w-10 h-10 rounded-xl border border-border-light bg-surface flex items-center justify-center"><Icon className="w-4 h-4 text-[#8070d8]" /></span>{label}
              </li>)}
            </ul>
          </div>
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="sakuga-auth-panel w-full max-w-[480px] p-6 sm:p-9"><div className="space-y-6">{children}</div></div>
          </div>
        </div>
      </main>
    </>
  );
}

export function AuthHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return <div className="space-y-3"><p className="ff-eyebrow">{eyebrow}</p><h1 className="text-[32px] sm:text-[36px] font-extrabold leading-[1.1] tracking-[-0.045em] text-foreground">{title}</h1>{text && <p className="text-base text-foreground-secondary leading-relaxed">{text}</p>}</div>;
}
