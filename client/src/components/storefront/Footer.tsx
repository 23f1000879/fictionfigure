"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Award, Box, MapPin, Phone, Clock, Truck, ShieldCheck, Mail, Sparkles } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const { supportPhone, supportEmail, supportHours, storeLocation, deliveryCoverage } = useSettings();

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE}/products/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      })
      .catch(() => {
        if (isMounted) setCategories([]);
      })
      .finally(() => {
        if (isMounted) setLoadingCategories(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer className="relative bg-[#060708] border-t border-white/[0.08] text-white overflow-hidden">
      <div className="ff-container relative z-10 py-10 lg:py-12 space-y-10">
        {/* Compact value row */}
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pb-8 border-b border-white/[0.08]">
          {[
            { icon: Award, title: "100% Authentic Figures", text: "Sourced from licensed manufacturers and official distributors." },
            { icon: Box, title: "Collector-Safe Packaging", text: "Bubble wrap and reinforced outer boxes for mint delivery." },
            { icon: Truck, title: "Pan-India Delivery", text: "Insured shipping with end-to-end tracking." },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full border border-white/[0.12] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#F5C518]" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#F7F7F5]">{title}</p>
                <p className="text-[11px] text-[#9A9DA5] leading-snug">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Main 4-Column Footer Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 text-xs">
          {/* Column 1: Brand & Tagline */}
          <div className="space-y-5">
            <Link href="/" className="inline-block">
              <Image
                src="/fictionfigure-logo-dark.svg"
                alt="FictionFigure"
                width={180}
                height={40}
                className="h-8 w-auto object-contain"
              />
            </Link>

            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#F5C518] block">
                COLLECT YOUR FICTION.
              </span>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Curated figures, statues, and collectible pieces for people who never stopped loving the characters that shaped them.
              </p>
            </div>

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-[10px] font-mono text-[#94A3B8]">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span>Vault Active & Dispatching</span>
              </span>
            </div>
          </div>

          {/* Column 2: Dynamic Explore Catalog */}
          <div>
            <h4 className="text-xs uppercase font-bold text-white tracking-widest mb-4 border-b border-white/10 pb-2.5 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#F5C518]" />
              <span>Explore Catalog</span>
            </h4>
            {loadingCategories ? (
              <div className="space-y-2.5">
                <div className="h-3.5 bg-white/[0.05] rounded-md w-28 animate-pulse" />
                <div className="h-3.5 bg-white/[0.05] rounded-md w-36 animate-pulse" />
                <div className="h-3.5 bg-white/[0.05] rounded-md w-32 animate-pulse" />
              </div>
            ) : categories.length > 0 ? (
              <ul className="space-y-2.5 text-xs text-[#94A3B8]">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/shop?category=${cat.slug}`}
                      className="hover:text-[#F5C518] transition-colors block truncate max-w-[220px]"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/shop" className="text-white hover:text-[#F5C518] font-semibold transition-colors block pt-1">
                    View All Categories →
                  </Link>
                </li>
              </ul>
            ) : (
              <ul className="space-y-2.5 text-xs text-[#94A3B8]">
                <li>
                  <Link href="/shop" className="hover:text-[#F5C518] transition-colors">
                    Shop All Collectibles
                  </Link>
                </li>
                <li>
                  <Link href="/collections" className="hover:text-[#F5C518] transition-colors">
                    Featured Collections
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Column 3: Collector Care Links */}
          <div>
            <h4 className="text-xs uppercase font-bold text-white tracking-widest mb-4 border-b border-white/10 pb-2.5">
              Collector Sanctuary
            </h4>
            <ul className="space-y-2.5 text-xs text-[#94A3B8]">
              <li>
                <Link href="/shipping" className="hover:text-[#F5C518] transition-colors">
                  Shipping Information
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-[#F5C518] transition-colors">
                  Returns & Replacements
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#F5C518] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#F5C518] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#F5C518] transition-colors">
                  About FictionFigure
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#F5C518] transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Dynamic Support & Contact Details from StoreSettings */}
          {(Boolean(supportPhone?.trim()) ||
            Boolean(supportEmail?.trim()) ||
            Boolean(supportHours?.trim()) ||
            Boolean(storeLocation?.trim()) ||
            Boolean(deliveryCoverage?.trim())) && (
            <div className="space-y-4">
              <h4 className="text-xs uppercase font-bold text-white tracking-widest mb-4 border-b border-white/10 pb-2.5">
                Support & Vault
              </h4>

              <div className="space-y-3.5 text-xs text-[#94A3B8]">
                {Boolean(supportPhone?.trim()) && (
                  <div className="flex items-start space-x-2.5">
                    <Phone className="w-4 h-4 text-[#F5C518] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white/90 block uppercase text-[10px] tracking-wider font-mono">
                        Phone Support
                      </span>
                      <a
                        href={`tel:${supportPhone.replace(/\s+/g, "")}`}
                        className="font-mono text-xs text-white hover:text-[#F5C518] font-semibold block transition-colors"
                      >
                        {supportPhone}
                      </a>
                    </div>
                  </div>
                )}

                {Boolean(supportEmail?.trim()) && (
                  <div className="flex items-start space-x-2.5">
                    <Mail className="w-4 h-4 text-[#F5C518] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white/90 block uppercase text-[10px] tracking-wider font-mono">
                        Email Support
                      </span>
                      <a
                        href={`mailto:${supportEmail.trim()}`}
                        className="font-mono text-xs text-white hover:text-[#F5C518] font-semibold block transition-colors"
                      >
                        {supportEmail}
                      </a>
                    </div>
                  </div>
                )}

                {Boolean(supportHours?.trim()) && (
                  <div className="flex items-start space-x-2.5">
                    <Clock className="w-4 h-4 text-[#F5C518] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white/90 block uppercase text-[10px] tracking-wider font-mono">
                        Support Hours
                      </span>
                      <span className="block text-white/90">{supportHours}</span>
                    </div>
                  </div>
                )}

                {Boolean(storeLocation?.trim()) && (
                  <div className="flex items-start space-x-2.5">
                    <MapPin className="w-4 h-4 text-[#F5C518] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white/90 block uppercase text-[10px] tracking-wider font-mono">
                        Location
                      </span>
                      <span className="block text-white/90">{storeLocation}</span>
                    </div>
                  </div>
                )}

                {Boolean(deliveryCoverage?.trim()) && (
                  <div className="flex items-start space-x-2.5 pt-1">
                    <Truck className="w-4 h-4 text-[#F5C518] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white/90 block uppercase text-[10px] tracking-wider font-mono">
                        Delivery Coverage
                      </span>
                      <span className="block text-white/90">{deliveryCoverage}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
          <div>© {new Date().getFullYear()} FictionFigure. All rights reserved.</div>

          <div className="font-mono text-[11px] uppercase tracking-wider text-[#64748B]">
            {deliveryCoverage || "Delivering across India"}
          </div>

          <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-wider text-[#94A3B8]">
            <span className="px-2.5 py-1 bg-[#121318] border border-white/10 rounded-md">UPI</span>
            <span className="px-2.5 py-1 bg-[#121318] border border-white/10 rounded-md">Cards</span>
            <span className="px-2.5 py-1 bg-[#121318] border border-white/10 rounded-md">Razorpay</span>
            <span className="px-2.5 py-1 bg-[#121318] border border-white/10 rounded-md">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
