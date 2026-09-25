"use client";

import React from "react";
import { ShieldCheck, Truck, CreditCard, Box } from "lucide-react";

export function TrustStrip() {
  const trustItems = [
    {
      icon: ShieldCheck,
      title: "100% AUTHENTIC FIGURES",
      description: "Directly sourced from licensed Japanese manufacturers & studios.",
    },
    {
      icon: Box,
      title: "COLLECTOR SAFE PACKAGING",
      description: "Reinforced outer boxes & bubble cushioning for mint box delivery.",
    },
    {
      icon: CreditCard,
      title: "SECURE PAYMENTS",
      description: "Encrypted Razorpay, UPI, Cards & Cash on Delivery options.",
    },
    {
      icon: Truck,
      title: "PAN-INDIA EXPRESS SHIPPING",
      description: "Insured express delivery with end-to-end real-time tracking.",
    },
  ];

  return (
    <section className="editorial-container" aria-label="Collector Reassurance & Benefits">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {trustItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="p-5 rounded-2xl bg-[#121318] border border-white/[0.08] hover:border-white/15 transition-all flex items-start space-x-3.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F5C518]/10 border border-[#F5C518]/25 flex items-center justify-center text-[#F5C518] shrink-0 group-hover:scale-105 transition-transform">
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  {item.title}
                </h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
