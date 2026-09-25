"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, User, Heart, ShoppingBag, Menu, X, ArrowRight, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useSettings } from "@/context/SettingsContext";

export function Header() {
  const pathname = usePathname();
  const { cartCount, setIsCartOpen, setIsSearchOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const { announcements, freeShippingThreshold } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentAnnouncementIdx, setCurrentAnnouncementIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if token exists in localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("fictionfigure_token");
      setIsLoggedIn(Boolean(token));
    }
  }, []);

  // Scroll listener for dynamic header elevation
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Announcement auto-rotation interval with subtle fade transition
  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentAnnouncementIdx((prev) => (prev + 1) % announcements.length);
        setIsFading(false);
      }, 250);
    }, 6000);
    return () => clearInterval(interval);
  }, [announcements.length]);

  const rawAnnouncement = announcements[currentAnnouncementIdx]?.text || "";
  const activeAnnouncement = rawAnnouncement.replace(
    /\{\{FREE_SHIPPING_THRESHOLD\}\}/g,
    String(freeShippingThreshold)
  );
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

  // Close mobile drawer upon route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/shop", label: "Shop" },
    { href: "/collections", label: "Collections" },
    { href: "/shop?sortBy=newest", label: "New Arrivals" },
    { href: "/about", label: "About" },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full max-w-full box-border transition-all duration-300 ${
        scrolled
          ? "bg-[#0A0A0C]/90 backdrop-blur-xl border-b border-white/[0.12] shadow-lg shadow-black/50"
          : "bg-[#0A0A0C]/75 backdrop-blur-md border-b border-white/[0.06]"
      }`}
    >
      {/* Top Banner Announcement Strip */}
      {showTopBar && (
        <div className="bg-[#060708] text-white text-[10px] sm:text-[11px] font-semibold tracking-[0.18em] text-center py-2 uppercase px-3 sm:px-4 w-full overflow-hidden whitespace-nowrap border-b border-white/[0.06]">
          <div className="editorial-container flex items-center justify-center space-x-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5C518] shrink-0 shadow-[0_0_8px_rgba(245,197,24,0.6)]" />
            <p
              className={`truncate font-mono transition-opacity duration-300 ease-in-out motion-reduce:transition-none text-white/90 ${
                isFading ? "opacity-0" : "opacity-100"
              }`}
            >
              {activeAnnouncement}
            </p>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5C518] shrink-0 hidden sm:inline-block shadow-[0_0_8px_rgba(245,197,24,0.6)]" />
          </div>
        </div>
      )}

      {/* Main Navbar Container (64–76px Height) */}
      <div className="editorial-container flex items-center justify-between h-16 sm:h-20">
        {/* Left: Mobile Menu Toggle & FICTIONFIGURE Brand Logo */}
        <div className="flex items-center space-x-3 sm:space-x-6 shrink-0 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white/[0.04] border border-white/10 text-white/90 hover:text-white hover:border-white/25 active:scale-95 flex items-center justify-center shrink-0 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C518]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* FICTIONFIGURE Brand Logo */}
          <Link href="/" className="flex items-center group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C518] rounded-lg">
            <Image
              src="/fictionfigure-logo.svg"
              alt="FictionFigure"
              width={200}
              height={44}
              priority
              className="h-8 sm:h-9 w-auto object-contain max-w-[125px] sm:max-w-[190px] group-hover:brightness-110 transition-all"
            />
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-8 text-xs font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/shop"
                ? pathname === "/shop" && !link.href.includes("?")
                : pathname === link.href || (link.href.includes("?") && pathname === "/shop");
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`py-1 relative group transition-colors duration-200 focus-visible:outline-none focus-visible:text-[#F5C518] ${
                  isActive ? "text-white font-bold" : "hover:text-white"
                }`}
              >
                <span>{link.label}</span>
                {/* Active/Hover Gold Accent Underline */}
                <span
                  className={`absolute -bottom-1 left-0 h-[2px] bg-gradient-to-r from-[#F5C518] to-[#D4AF37] rounded-full transition-all duration-200 ${
                    isActive ? "w-full shadow-[0_0_8px_rgba(245,197,24,0.5)]" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Right: Search, Account, Wishlist, Cart */}
        <div className="flex items-center space-x-2 sm:space-x-3 text-white shrink-0">
          {/* Compact Search Trigger */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="h-11 min-h-[44px] px-3 sm:px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-[#94A3B8] hover:text-white transition-all flex items-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C518]"
            aria-label="Search collectibles catalog"
          >
            <Search className="w-4 h-4 text-[#94A3B8] group-hover:text-[#F5C518] group-hover:scale-105 transition-all" />
            <span className="hidden sm:inline text-xs font-mono uppercase tracking-wider text-[#64748B] group-hover:text-[#94A3B8]">
              Search
            </span>
            <kbd className="hidden md:inline-flex items-center text-[10px] font-mono font-medium text-[#64748B] bg-white/[0.06] border border-white/10 rounded px-1.5 py-0.5 ml-1">
              /
            </kbd>
          </button>

          {/* Account Icon Button */}
          <Link
            href={isLoggedIn ? "/account" : "/login"}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white/90 hover:text-[#F5C518] active:scale-95 hidden sm:flex items-center justify-center transition-all cursor-pointer relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C518]"
            aria-label={isLoggedIn ? "Customer Account" : "Sign In"}
          >
            <User className="w-4 h-4" />
            {isLoggedIn && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-[#0A0A0C]" />
            )}
          </Link>

          {/* Wishlist Icon Button with count badge */}
          <Link
            href="/account/wishlist"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white/90 hover:text-[#F5C518] active:scale-95 flex items-center justify-center transition-all cursor-pointer relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C518]"
            aria-label="Saved to Wishlist"
          >
            <Heart className="w-4 h-4" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-[#F5C518] to-[#D4AF37] text-[#0A0A0C] text-[10px] font-bold rounded-full flex items-center justify-center font-mono border border-[#0A0A0C] shadow-sm">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Icon Button with count badge */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white/90 hover:text-[#F5C518] active:scale-95 flex items-center justify-center transition-all cursor-pointer relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C518]"
            aria-label="Shopping Cart Drawer"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#F5C518] text-[#0A0A0C] text-[10px] font-bold rounded-full flex items-center justify-center font-mono border border-[#0A0A0C] shadow-sm">
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998] lg:hidden transition-opacity duration-300 animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-in Mobile Drawer */}
          <div className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm z-[9999] bg-[#0E0F14] border-r border-white/10 px-6 py-6 lg:hidden shadow-2xl shadow-black overflow-y-auto flex flex-col justify-between animate-in slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center"
                >
                  <Image
                    src="/fictionfigure-logo.svg"
                    alt="FictionFigure"
                    width={160}
                    height={36}
                    className="h-7 w-auto object-contain"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-white/[0.05] border border-white/10 text-white/80 hover:text-white flex items-center justify-center cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Primary Navigation Section with Numbered Tags */}
              <div className="py-6 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748B] block mb-3 font-bold">
                  NAVIGATE
                </span>
                <Link
                  href="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3.5 px-3 rounded-xl hover:bg-white/[0.04] text-white hover:text-[#F5C518] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[#64748B] group-hover:text-[#F5C518]">01</span>
                    <span className="text-sm font-bold uppercase tracking-wider">Shop All Figures</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#F5C518] group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/collections"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3.5 px-3 rounded-xl hover:bg-white/[0.04] text-white hover:text-[#F5C518] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[#64748B] group-hover:text-[#F5C518]">02</span>
                    <span className="text-sm font-bold uppercase tracking-wider">Collections</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#F5C518] group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/shop?sortBy=newest"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3.5 px-3 rounded-xl hover:bg-white/[0.04] text-white hover:text-[#F5C518] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[#64748B] group-hover:text-[#F5C518]">03</span>
                    <span className="text-sm font-bold uppercase tracking-wider">New Arrivals</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#F5C518] group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3.5 px-3 rounded-xl hover:bg-white/[0.04] text-white hover:text-[#F5C518] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[#64748B] group-hover:text-[#F5C518]">04</span>
                    <span className="text-sm font-bold uppercase tracking-wider">About FictionFigure</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#F5C518] group-hover:translate-x-1 transition-all" />
                </Link>
              </div>

              {/* Secondary Navigation Section */}
              <div className="pt-4 border-t border-white/10 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748B] block mb-3 font-bold">
                  COLLECTOR SANCTUARY
                </span>
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3 px-3 rounded-xl hover:bg-white/[0.04] text-white/90 hover:text-white transition-all flex items-center justify-between text-xs uppercase font-semibold tracking-wider"
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-[#94A3B8]" />
                    <span>Customer Account</span>
                  </div>
                  {isLoggedIn && <span className="w-2 h-2 rounded-full bg-[#10B981]" />}
                </Link>

                <Link
                  href="/account/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3 px-3 rounded-xl hover:bg-white/[0.04] text-white/90 hover:text-white transition-all flex items-center justify-between text-xs uppercase font-semibold tracking-wider"
                >
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-[#94A3B8]" />
                    <span>Saved Wishlist</span>
                  </div>
                  {wishlistCount > 0 && (
                    <span className="text-[10px] font-mono bg-[#F5C518]/15 text-[#F5C518] px-2 py-0.5 rounded-md font-bold">
                      {wishlistCount} items
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="w-full py-3 px-3 rounded-xl hover:bg-white/[0.04] text-white/90 hover:text-white transition-all flex items-center justify-between text-xs uppercase font-semibold tracking-wider text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4 text-[#94A3B8]" />
                    <span>Shopping Cart</span>
                  </div>
                  {cartCount > 0 && (
                    <span className="text-[10px] font-mono bg-white/[0.08] text-white px-2 py-0.5 rounded-md font-bold">
                      {cartCount} items
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-6 border-t border-white/10 text-[10px] uppercase font-mono tracking-widest text-[#64748B] text-center flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#F5C518]" />
              <span>FICTIONFIGURE — AUTHENTIC COLLECTIBLES</span>
            </div>
          </div>
        </>,
        document.body
      )}
    </header>
  );
}
