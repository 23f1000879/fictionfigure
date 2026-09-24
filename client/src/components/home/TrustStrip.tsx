"use client";

import React from "react";
import { ShieldCheck, Truck, CreditCard, PhoneCall } from "lucide-react";

export function TrustStrip() {
  const trustItems = [
    {
      icon: ShieldCheck,
      title: "AUTHENTIC PRODUCTS",
      description: "Directly sourced from trusted global studios & makers.",
    },
    {
      icon: CreditCard,
      title: "SECURE PAYMENTS",
      description: "Encrypted Razorpay, UPI & Cash on Delivery options.",
    },
    {
      icon: Truck,
      title: "PAN-INDIA SHIPPING",
      description: "Dispatched with protective outer box packaging.",
    },
    {
      icon: PhoneCall,
      title: "CUSTOMER SUPPORT",
      description: "Dedicated WhatsApp & phone assistance: +91 97974 94639.",
    },
  ];

  return (
    <section className="bg-white border-y border-[#E5E5E2] py-8 sm:py-10" aria-label="Store Benefits & Guarantees">
      <div className="editorial-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-start space-x-3 text-left">
                <div className="p-2 bg-[#F7F7F5] border border-[#E5E5E2] shrink-0 text-[#111111]">
                  <Icon className="w-5 h-5 text-[#111111]" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-[#6B6B6B] leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
