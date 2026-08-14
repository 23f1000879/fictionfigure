"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, User, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { API_BASE } from "@/lib/api";

export function Header() {
  const { cartCount, setIsCartOpen, setIsSearchOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState(
    "⚡ COMPLIMENTARY EXPRESS SHIPPING ON ORDERS OVER ₹15,000 | AUTHENTIC IMPORTS DIRECT FROM TOKYO"
  );

  useEffect(() => {
    fetch(`${API_BASE}/settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data.settings?.hero_announcement) {
          setAnnouncement(data.settings.hero_announcement);
        }
      })
      .catch(() => {});
  }, []);

  // Handle ESC key press to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-[#F7F7F5]/90 backdrop-blur-md border-b border-[#E5E5E2] transition-colors w-full max-w-full box-border">
      {/* Top Banner Announcement */}
      <div className="bg-[#111111] text-white text-[10px] sm:text-[11px] font-medium tracking-widest text-center py-1.5 uppercase px-3 sm:px-4 w-full overflow-hidden whitespace-nowrap box-border">
        <p className="truncate w-full max-w-full block font-sans">
          {announcement}
        </p>
      </div>

      {/* Main Header Container: [☰] [LOGO] <space> [SEARCH] [♡] [CART] */}
      <div className="w-full max-w-[1340px] mx-auto flex items-center justify-between h-14 sm:h-20 px-3 sm:px-6 box-border">
        {/* Left Section: Hamburger + Brand Logo */}
        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0 min-w-0">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#111111] hover:text-[#6B6B6B] focus:outline-none shrink-0"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand Logo Link */}
          <Link href="/" className="flex items-center hover:opacity-85 transition-opacity shrink-0">
            <Image
              src="/fictionfigure-logo.svg"
              alt="FictionFigure"
              width={200}
              height={44}
              priority
              className="h-7 sm:h-10 w-auto object-contain max-w-[110px] sm:max-w-[200px]"
            />
          </Link>
        </div>

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

        {/* Right Header Action Icons */}
        <div className="flex items-center space-x-1 sm:space-x-3 text-[#111111] shrink-0">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 hover:text-[#6B6B6B] transition-colors text-xs font-medium flex items-center justify-center min-w-[36px] min-h-[36px]"
            aria-label="Search catalog"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px] uppercase tracking-wider text-[#6B6B6B] ml-1.5">
              Search
            </span>
          </button>

          <Link
            href="/account"
            className="p-2 hidden sm:flex items-center justify-center hover:text-[#6B6B6B] transition-colors min-w-[36px] min-h-[36px]"
            aria-label="Customer Account"
          >
            <User className="w-4 h-4" />
          </Link>

          {/* Wishlist Icon */}
          <Link
            href="/account/wishlist"
            className="p-2 flex items-center justify-center hover:text-[#6B6B6B] transition-colors relative min-w-[36px] min-h-[36px]"
            aria-label="Saved Wishlist"
          >
            <Heart className="w-4 h-4" />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-0.5 bg-[#111111] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Icon with Badge */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="p-2 flex items-center justify-center hover:text-[#6B6B6B] transition-colors relative min-w-[36px] min-h-[36px]"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-0.5 bg-[#111111] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Full-Height Drawer & Backdrop */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop (Closes menu when tapping backdrop/header area) */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Full-Height Mobile Menu Panel */}
          <div className="fixed top-[82px] left-0 right-0 bottom-0 z-50 bg-white border-t border-[#E5E5E2] p-6 lg:hidden shadow-2xl overflow-y-auto animate-in slide-in-from-top duration-200 flex flex-col justify-between">
            <nav className="flex flex-col space-y-1 text-sm font-semibold uppercase tracking-wider text-[#111111]">
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3.5 border-b border-[#E5E5E2] hover:text-[#6B6B6B] transition-colors flex justify-between items-center"
              >
                <span>Shop All Figures</span>
              </Link>
              <Link
                href="/shop?sortBy=featured"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3.5 border-b border-[#E5E5E2] hover:text-[#6B6B6B] transition-colors flex justify-between items-center"
              >
                <span>Featured Collections</span>
              </Link>
              <Link
                href="/shop?sortBy=newest"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3.5 border-b border-[#E5E5E2] hover:text-[#6B6B6B] transition-colors flex justify-between items-center"
              >
                <span>New Arrivals</span>
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3.5 border-b border-[#E5E5E2] hover:text-[#6B6B6B] transition-colors flex justify-between items-center"
              >
                <span>About FictionFigure</span>
              </Link>
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3.5 border-b border-[#E5E5E2] hover:text-[#6B6B6B] transition-colors flex justify-between items-center"
              >
                <span>My Account</span>
              </Link>
              <Link
                href="/account/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3.5 border-b border-[#E5E5E2] hover:text-[#6B6B6B] transition-colors flex justify-between items-center"
              >
                <span>Wishlist</span>
              </Link>
            </nav>

            <div className="pt-6 border-t border-[#E5E5E2] text-xs text-[#6B6B6B] space-y-1 font-mono">
              <p className="font-bold text-[#111111] uppercase tracking-wider">FICTIONFIGURE OFFICIAL STORE</p>
              <p className="text-[11px]">Bikaner, Rajasthan, India • Delivers Pan-India</p>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
