"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Box, MapPin, Phone, Clock, Truck, ShieldCheck } from "lucide-react";
import { API_BASE } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE}/admin/categories`)
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
    <footer className="bg-white border-t border-[#E5E5E2] mt-24 text-[#111111]">
      <div className="editorial-container py-16 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 text-xs">
          {/* Column 1: Brand & Value Statements */}
          <div className="space-y-6">
            <div>
              <Link
                href="/"
                className="text-lg font-bold tracking-tighter uppercase text-[#111111] font-mono block mb-2"
              >
                FICTIONFIGURE
              </Link>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                Curated figures, statues, and collectibles for people who never stopped loving the characters that shaped them.
              </p>
            </div>

            <div className="space-y-4 pt-2 border-t border-[#E5E5E2]/60">
              <div className="flex items-start space-x-2.5">
                <Award className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold uppercase tracking-wider text-[11px] text-[#111111]">
                    Authentic Collectibles
                  </h5>
                  <p className="text-[11px] text-[#6B6B6B] leading-normal">
                    Carefully selected collectibles from trusted makers and studios.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <Box className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold uppercase tracking-wider text-[11px] text-[#111111]">
                    Secure Packaging
                  </h5>
                  <p className="text-[11px] text-[#6B6B6B] leading-normal">
                    Every order is packed carefully to help your collection arrive safely.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <Truck className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold uppercase tracking-wider text-[11px] text-[#111111]">
                    Delivering Across India
                  </h5>
                  <p className="text-[11px] text-[#6B6B6B] leading-normal">
                    Based in Bikaner, Rajasthan, delivering collectibles across India.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Dynamic Explore Catalog */}
          <div>
            <h4 className="text-xs uppercase font-semibold text-[#111111] tracking-widest mb-4 border-b border-[#E5E5E2] pb-2">
              Explore Catalog
            </h4>
            {loadingCategories ? (
              <div className="space-y-2 text-[#6B6B6B]">
                <div className="h-3 bg-[#F7F7F5] w-24 animate-pulse"></div>
                <div className="h-3 bg-[#F7F7F5] w-32 animate-pulse"></div>
                <div className="h-3 bg-[#F7F7F5] w-28 animate-pulse"></div>
              </div>
            ) : categories.length > 0 ? (
              <ul className="space-y-2.5 text-xs text-[#6B6B6B]">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/shop?category=${cat.slug}`}
                      className="hover:text-[#111111] transition-colors block truncate max-w-[200px]"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2.5 text-xs text-[#6B6B6B]">
                <li>
                  <Link href="/shop" className="hover:text-[#111111] transition-colors">
                    Shop All Collectibles
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Column 3: Collector Care Links */}
          <div>
            <h4 className="text-xs uppercase font-semibold text-[#111111] tracking-widest mb-4 border-b border-[#E5E5E2] pb-2">
              Collector Care
            </h4>
            <ul className="space-y-2.5 text-xs text-[#6B6B6B]">
              <li>
                <Link href="/shipping" className="hover:text-[#111111] transition-colors">
                  Shipping Information
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-[#111111] transition-colors">
                  Returns & Replacements
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#111111] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#111111] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#111111] transition-colors">
                  About FictionFigure
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#111111] transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Support & Contact Details (No Email / No Newsletter) */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase font-semibold text-[#111111] tracking-widest mb-4 border-b border-[#E5E5E2] pb-2">
              Support & Contact
            </h4>

            <div className="space-y-3.5 text-xs text-[#6B6B6B]">
              <div className="flex items-start space-x-2.5">
                <Phone className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#111111] block uppercase text-[10px] tracking-wider">
                    Phone Support
                  </span>
                  <a
                    href="tel:+919797494639"
                    className="font-mono text-xs text-[#111111] hover:underline font-semibold block"
                  >
                    +91 9797494639
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <Clock className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#111111] block uppercase text-[10px] tracking-wider">
                    Support Hours
                  </span>
                  <span className="block">Monday – Saturday</span>
                  <span className="block text-[11px]">10:00 AM – 7:00 PM IST</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#111111] block uppercase text-[10px] tracking-wider">
                    Location
                  </span>
                  <span className="block text-[#111111]">Based in Bikaner, Rajasthan</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5 pt-1">
                <Truck className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#111111] block uppercase text-[10px] tracking-wider">
                    Coverage
                  </span>
                  <span className="block">Delivering across India</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-8 border-t border-[#E5E5E2] flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[#6B6B6B]">
          <div>© {new Date().getFullYear()} FictionFigure. All rights reserved.</div>

          <div className="font-mono text-[10px] uppercase tracking-widest text-[#111111]">
            Based in Bikaner, delivering across India.
          </div>

          <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-wider text-[#6B6B6B]">
            <span className="px-2 py-0.5 bg-[#F7F7F5] border border-[#E5E5E2]">UPI</span>
            <span className="px-2 py-0.5 bg-[#F7F7F5] border border-[#E5E5E2]">Cards</span>
            <span className="px-2 py-0.5 bg-[#F7F7F5] border border-[#E5E5E2]">Razorpay</span>
            <span className="px-2 py-0.5 bg-[#F7F7F5] border border-[#E5E5E2]">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
