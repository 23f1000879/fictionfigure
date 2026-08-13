"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="bg-white border-t border-[#E5E5E2] mt-24">
      <div className="editorial-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <Link
              href="/"
              className="text-lg font-bold tracking-tighter uppercase text-[#111111] font-mono block"
            >
              FICTIONFIGURE
            </Link>
            <p className="text-xs text-[#6B6B6B] leading-relaxed max-w-xs">
              Curated figures, statues, and collectible pieces for people who never stopped loving the characters that shaped them.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="text-xs uppercase font-semibold text-[#111111] tracking-widest mb-4">
              Explore Catalog
            </h4>
            <ul className="space-y-2.5 text-xs text-[#6B6B6B]">
              <li>
                <Link href="/shop?category=anime-figures" className="hover:text-[#111111] transition-colors">
                  Anime Figures
                </Link>
              </li>
              <li>
                <Link href="/shop?category=premium-statues" className="hover:text-[#111111] transition-colors">
                  Premium Statues
                </Link>
              </li>
              <li>
                <Link href="/shop?category=designer-toys" className="hover:text-[#111111] transition-colors">
                  Designer Toys
                </Link>
              </li>
              <li>
                <Link href="/shop?category=game-characters" className="hover:text-[#111111] transition-colors">
                  Game Characters
                </Link>
              </li>
              <li>
                <Link href="/shop?category=limited-editions" className="hover:text-[#111111] transition-colors">
                  Limited Editions
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Collector Care */}
          <div>
            <h4 className="text-xs uppercase font-semibold text-[#111111] tracking-widest mb-4">
              Collector Care
            </h4>
            <ul className="space-y-2.5 text-xs text-[#6B6B6B]">
              <li>
                <Link href="/shipping" className="hover:text-[#111111] transition-colors">
                  Insured Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-[#111111] transition-colors">
                  Returns & Replacements
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#111111] transition-colors">
                  Authenticity Guarantee
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#111111] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#111111] transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h4 className="text-xs uppercase font-semibold text-[#111111] tracking-widest mb-2">
              Stay In The Collection
            </h4>
            <p className="text-xs text-[#6B6B6B] mb-4">
              New releases, limited run drops, and collector updates directly to your inbox.
            </p>

            {subscribed ? (
              <div className="flex items-center text-xs font-semibold text-[#2E6B44] bg-[#F0F0ED] p-3 border border-[#E5E5E2]">
                <Check className="w-4 h-4 mr-2" /> Thank you for subscribing.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-2">
                <div className="flex border border-[#E5E5E2] focus-within:border-[#111111]">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 text-xs bg-transparent text-[#111111] placeholder-[#6B6B6B] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 bg-[#111111] text-white hover:bg-black transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-16 pt-8 border-t border-[#E5E5E2] flex flex-col sm:flex-row justify-between items-center text-[11px] text-[#6B6B6B]">
          <span>© {new Date().getFullYear()} FICTIONFIGURE Inc. All rights reserved.</span>
          <div className="flex space-x-6 mt-4 sm:mt-0 uppercase tracking-widest font-mono text-[10px]">
            <span>Tokyo</span>
            <span>Mumbai</span>
            <span>Los Angeles</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
