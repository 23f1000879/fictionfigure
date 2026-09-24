"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { Search, User, Heart, ShoppingBag, Menu, X, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useSettings } from "@/context/SettingsContext";

export function Header() {
  const { cartCount, setIsCartOpen, setIsSearchOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const { announcements, freeShippingThreshold } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentAnnouncementIdx, setCurrentAnnouncementIdx] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [isFading, setIsFading] = useState(false);

  // Announcement auto-rotation interval with subtle fade transition
  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentAnnouncementIdx((prev) => (prev + 1) % announcements.length);
        setIsFading(false);
      }, 300);
    }, 6000);
    return () => clearInterval(interval);
  }, [announcements.length]);

  const rawAnnouncement = announcements[currentAnnouncementIdx]?.text || "";
  const activeAnnouncement = rawAnnouncement.replace(/\{\{FREE_SHIPPING_THRESHOLD\}\}/g, String(freeShippingThreshold));
  const showTopBar = announcements.length > 0 && activeAnnouncement.trim().length > 0;

  // Body scroll lock & ESC key listener for mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-[#F7F7F5]/95 backdrop-blur-md border-b border-[#E5E5E2] transition-all w-full max-w-full box-border">
      {/* Top Banner Announcement Strip */}
      {showTopBar && (
        <div className="bg-[#111111] text-white text-[10px] sm:text-[11px] font-medium tracking-[0.15em] text-center py-2 uppercase px-3 sm:px-4 w-full overflow-hidden whitespace-nowrap border-b border-[#262626]">
          <div className="editorial-container flex items-center justify-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
            <p
              className={`truncate font-sans transition-opacity duration-300 ease-in-out motion-reduce:transition-none ${
                isFading ? "opacity-0" : "opacity-100"
              }`}
            >
              {activeAnnouncement}
            </p>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0 hidden sm:inline-block" />
          </div>
        </div>
      )}

      {/* Main Navbar Container */}
      <div className="editorial-container flex items-center justify-between h-16 sm:h-20">
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center space-x-3 sm:space-x-6 shrink-0 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#111111] hover:text-[#D4AF37] focus:outline-none shrink-0 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* FICTIONFIGURE Brand Logo */}
          <Link href="/" className="flex items-center group shrink-0">
            <Image
              src="/fictionfigure-logo.svg"
              alt="FictionFigure"
              width={200}
              height={44}
              priority
              className="h-8 sm:h-10 w-auto object-contain max-w-[120px] sm:max-w-[200px] group-hover:opacity-90 transition-opacity"
            />
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-9 text-xs font-semibold uppercase tracking-[0.18em] text-[#111111]">
          <Link href="/shop" className="hover:text-[#D4AF37] transition-colors py-1 relative group">
            Shop
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#D4AF37] group-hover:w-full transition-all duration-200" />
          </Link>
          <Link href="/shop?sortBy=featured" className="hover:text-[#D4AF37] transition-colors py-1 relative group">
            Collections
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#D4AF37] group-hover:w-full transition-all duration-200" />
          </Link>
          <Link href="/shop?sortBy=newest" className="hover:text-[#D4AF37] transition-colors py-1 relative group">
            New Arrivals
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#D4AF37] group-hover:w-full transition-all duration-200" />
          </Link>
          <Link href="/about" className="hover:text-[#D4AF37] transition-colors py-1 relative group">
            About
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#D4AF37] group-hover:w-full transition-all duration-200" />
          </Link>
        </nav>

        {/* Right: Search, Account, Wishlist, Cart */}
        <div className="flex items-center space-x-1 sm:space-x-3 text-[#111111] shrink-0">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2.5 hover:text-[#D4AF37] transition-colors text-xs font-medium flex items-center justify-center rounded-none group"
            aria-label="Search collectibles catalog"
          >
            <Search className="w-4 h-4 group-hover:scale-105 transition-transform" />
            <span className="hidden sm:inline text-[11px] uppercase tracking-wider text-[#6B6B6B] ml-2 font-sans group-hover:text-[#111111]">
              Search
            </span>
          </button>

          <Link
            href="/account"
            className="p-2.5 hidden sm:flex items-center justify-center hover:text-[#D4AF37] transition-colors"
            aria-label="Customer Account"
          >
            <User className="w-4 h-4" />
          </Link>

          {/* Wishlist */}
          <Link
            href="/account/wishlist"
            className="p-2.5 flex items-center justify-center hover:text-[#D4AF37] transition-colors relative"
            aria-label="Wishlist"
          >
            <Heart className="w-4 h-4" />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 bg-[#111111] text-[#D4AF37] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-sans border border-[#D4AF37]/30">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Drawer Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="p-2.5 flex items-center justify-center hover:text-[#D4AF37] transition-colors relative"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-[#111111] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-sans border border-white/20">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer & Portal */}
      {mounted && mobileMenuOpen && createPortal(
        <>
          {/* Dark Overlay Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 z-[9998] lg:hidden transition-opacity duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Full Mobile Drawer */}
          <div className="fixed top-[64px] sm:top-[80px] left-0 right-0 bottom-0 z-[9999] bg-[#F7F7F5] border-t border-[#E5E5E2] px-6 py-6 lg:hidden shadow-2xl overflow-y-auto flex flex-col justify-between">
            <nav className="flex flex-col space-y-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#111111]">
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="py-4 border-b border-[#E5E5E2] hover:text-[#D4AF37] transition-colors flex justify-between items-center group"
              >
                <span>Shop All Figures</span>
                <ArrowRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all" />
              </Link>
              <Link
                href="/shop?sortBy=featured"
                onClick={() => setMobileMenuOpen(false)}
                className="py-4 border-b border-[#E5E5E2] hover:text-[#D4AF37] transition-colors flex justify-between items-center group"
              >
                <span>Featured Collections</span>
                <ArrowRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all" />
              </Link>
              <Link
                href="/shop?sortBy=newest"
                onClick={() => setMobileMenuOpen(false)}
                className="py-4 border-b border-[#E5E5E2] hover:text-[#D4AF37] transition-colors flex justify-between items-center group"
              >
                <span>New Arrivals</span>
                <ArrowRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all" />
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="py-4 border-b border-[#E5E5E2] hover:text-[#D4AF37] transition-colors flex justify-between items-center group"
              >
                <span>About FictionFigure</span>
                <ArrowRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all" />
              </Link>
              <Link
                href="/account/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="py-4 border-b border-[#E5E5E2] hover:text-[#D4AF37] transition-colors flex justify-between items-center group"
              >
                <span>Wishlist ({wishlistCount})</span>
                <Heart className="w-4 h-4 text-[#6B6B6B]" />
              </Link>
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="py-4 border-b border-[#E5E5E2] hover:text-[#D4AF37] transition-colors flex justify-between items-center group"
              >
                <span>Customer Account</span>
                <User className="w-4 h-4 text-[#6B6B6B]" />
              </Link>
            </nav>

            <div className="pt-8 border-t border-[#E5E5E2] text-[10px] uppercase font-mono tracking-widest text-[#6B6B6B] text-center">
              <span>FICTIONFIGURE — AUTHENTIC COLLECTIBLES</span>
            </div>
          </div>
        </>,
        document.body
      )}
    </header>
  );
}

