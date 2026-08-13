"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, User, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function Header() {
  const { cartCount, setIsCartOpen, setIsSearchOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("⚡ COMPLIMENTARY EXPRESS SHIPPING ON ORDERS OVER ₹15,000 | AUTHENTIC IMPORTS DIRECT FROM TOKYO");

  useEffect(() => {
    fetch("http://localhost:5000/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings?.hero_announcement) {
          setAnnouncement(data.settings.hero_announcement);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#F7F7F5]/90 backdrop-blur-md border-b border-[#E5E5E2] transition-colors">
      {/* Top Banner Announcement */}
      <div className="bg-[#111111] text-white text-[11px] font-medium tracking-widest text-center py-1.5 uppercase px-4 truncate">
        <span>{announcement}</span>
      </div>

      <div className="editorial-container flex items-center justify-between h-16 sm:h-20">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-[#111111] hover:text-[#6B6B6B]"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Brand Logo Link */}
        <Link href="/" className="flex items-center hover:opacity-85 transition-opacity">
          {/* Desktop Full Horizontal Logo */}
          <Image
            src="/fictionfigure-logo.svg"
            alt="FictionFigure"
            width={200}
            height={44}
            priority
            className="hidden sm:block h-10 w-auto object-contain"
          />
          {/* Mobile Compact Emblem Icon */}
          <Image
            src="/fictionfigure-icon.svg"
            alt="FictionFigure"
            width={34}
            height={34}
            priority
            className="sm:hidden h-8.5 w-auto object-contain"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-8 text-xs font-semibold uppercase tracking-widest text-[#111111]">
          <Link href="/shop" className="hover:text-[#6B6B6B] transition-colors">
            Shop
          </Link>
          <Link href="/shop?sortBy=featured" className="hover:text-[#6B6B6B] transition-colors">
            Collections
          </Link>
          <Link href="/shop?sortBy=newest" className="hover:text-[#6B6B6B] transition-colors">
            New Arrivals
          </Link>
          <Link href="/about" className="hover:text-[#6B6B6B] transition-colors">
            About
          </Link>
        </nav>

        {/* Header Action Icons */}
        <div className="flex items-center space-x-4 sm:space-x-5 text-[#111111]">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-1.5 hover:text-[#6B6B6B] transition-colors flex items-center gap-1.5 text-xs font-medium"
            aria-label="Search catalog"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px] uppercase tracking-wider text-[#6B6B6B]">
              Search
            </span>
          </button>

          <Link
            href="/account"
            className="p-1.5 hover:text-[#6B6B6B] transition-colors hidden sm:block"
            aria-label="Customer Account"
          >
            <User className="w-4 h-4" />
          </Link>

          <Link
            href="/account/wishlist"
            className="p-1.5 hover:text-[#6B6B6B] transition-colors hidden sm:block"
            aria-label="Saved Wishlist"
          >
            <Heart className="w-4 h-4" />
          </Link>

          {/* Cart Icon */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="p-1.5 hover:text-[#6B6B6B] transition-colors relative flex items-center"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#111111] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#E5E5E2] px-6 py-6 space-y-4 animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-3 text-sm font-semibold uppercase tracking-wider text-[#111111]">
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 border-b border-[#F0F0ED]"
            >
              Shop All Figures
            </Link>
            <Link
              href="/shop?sortBy=featured"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 border-b border-[#F0F0ED]"
            >
              Featured Collections
            </Link>
            <Link
              href="/shop?sortBy=newest"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 border-b border-[#F0F0ED]"
            >
              New Arrivals
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 border-b border-[#F0F0ED]"
            >
              About FictionFigure
            </Link>
            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 border-b border-[#F0F0ED]"
            >
              My Account
            </Link>
            <Link
              href="/account/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 border-b border-[#F0F0ED]"
            >
              Wishlist
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
