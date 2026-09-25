"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, User, Heart, ShoppingBag, Menu, X, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useSettings } from "@/context/SettingsContext";

// Naked 36px icon control used across the header (reference: small, borderless, refined).
const iconBtn =
  "relative w-9 h-9 min-w-[36px] rounded-full flex items-center justify-center text-[#F7F7F5]/85 hover:text-white hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C518]";

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#F5C518] text-[#08090B] text-[9px] font-extrabold flex items-center justify-center ring-2 ring-[#08090B]">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function HeaderNavLinks({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  const { headerNavigation } = useSettings();
  const currentQuery = searchParams?.toString() || "";

  return (
    <nav className="hidden lg:flex items-center gap-8 xl:gap-10 text-[12px] font-semibold uppercase tracking-[0.1em]">
      {headerNavigation.map((link) => {
        const [linkPath, linkQuery = ""] = link.href.split("?");
        const isActive = linkQuery
          ? pathname === linkPath && currentQuery.includes(linkQuery)
          : pathname === linkPath && !(linkPath === "/shop" && currentQuery.includes("sortBy=newest"));
        return (
          <Link
            key={link.id}
            href={link.href}
            className={`relative py-1 transition-colors focus-visible:outline-none focus-visible:text-[#F5C518] ${
              isActive ? "text-white" : "text-[#F7F7F5]/75 hover:text-white"
            }`}
          >
            {link.label}
            <span
              className={`absolute -bottom-[3px] left-0 h-[2px] rounded-full bg-[#F5C518] transition-all duration-200 ${
                isActive ? "w-full" : "w-0"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}

export function Header() {
  const pathname = usePathname();
  const { cartCount, setIsCartOpen, setIsSearchOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const { announcements, freeShippingThreshold, headerNavigation } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentAnnouncementIdx, setCurrentAnnouncementIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("fictionfigure_token");
      setIsLoggedIn(Boolean(token));
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Announcement auto-rotation with a subtle fade
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

  // "/" opens search from anywhere outside a text field
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setIsSearchOpen]);

  const rawAnnouncement = announcements[currentAnnouncementIdx]?.text || "";
  const activeAnnouncement = rawAnnouncement.replace(
    /\{\{FREE_SHIPPING_THRESHOLD\}\}/g,
    String(freeShippingThreshold)
  );
  const showTopBar = announcements.length > 0 && activeAnnouncement.trim().length > 0;

  // Body scroll lock & ESC listener for the mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-40 w-full max-w-full transition-colors duration-300 border-b ${
        scrolled
          ? "bg-[#08090B]/92 backdrop-blur-xl border-white/[0.08]"
          : "bg-[#08090B]/70 backdrop-blur-md border-white/[0.05]"
      }`}
    >
      {/* Thin CMS announcement strip */}
      {showTopBar && (
        <div className="h-7 bg-[#060708] border-b border-white/[0.05] flex items-center">
          <div className="ff-container flex items-center justify-center gap-2 overflow-hidden">
            <span className="w-1 h-1 rounded-full bg-[#F5C518] shrink-0" />
            <p
              className={`truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F7F7F5]/80 transition-opacity duration-300 motion-reduce:transition-none ${
                isFading ? "opacity-0" : "opacity-100"
              }`}
            >
              {activeAnnouncement}
            </p>
            <span className="w-1 h-1 rounded-full bg-[#F5C518] shrink-0" />
          </div>
        </div>
      )}

      {/* Main bar — 64px */}
      <div className="ff-container h-header flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C518]"
          aria-label="FictionFigure home"
        >
          <Image
            src="/fictionfigure-logo-dark.svg"
            alt="FictionFigure"
            width={200}
            height={44}
            priority
            className="h-9 sm:h-10 w-auto max-w-[140px] sm:max-w-[160px] object-contain"
          />
        </Link>

        {/* Centre navigation */}
        <React.Suspense fallback={<nav className="hidden lg:flex" />}>
          <HeaderNavLinks pathname={pathname || "/"} />
        </React.Suspense>

        {/* Right cluster */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {/* Search pill (desktop) */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex items-center gap-2.5 h-9 w-[210px] xl:w-[250px] mr-2 px-3.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-left text-[#9A9DA5] hover:border-white/20 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C518]"
            aria-label="Search figures, anime and series"
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1 truncate text-[12px]">Search figures, anime, series…</span>
            <kbd className="hidden xl:inline text-[10px] font-mono text-[#6E717A] border border-white/10 rounded px-1">/</kbd>
          </button>

          {/* Search icon (mobile) */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className={`${iconBtn} md:hidden`}
            aria-label="Search"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          <Link
            href={isLoggedIn ? "/account" : "/login"}
            className={`${iconBtn} hidden sm:flex`}
            aria-label={isLoggedIn ? "Account" : "Sign in"}
          >
            <User className="w-[18px] h-[18px]" />
            {isLoggedIn && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            )}
          </Link>

          <Link href="/account/wishlist" className={iconBtn} aria-label="Wishlist">
            <Heart className="w-[18px] h-[18px]" />
            <CountBadge count={wishlistCount} />
          </Link>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className={iconBtn}
            aria-label="Open cart"
          >
            <ShoppingBag className="w-[18px] h-[18px]" />
            <CountBadge count={cartCount} />
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`${iconBtn} lg:hidden ml-0.5`}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mounted &&
        mobileMenuOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9998] lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed top-0 right-0 bottom-0 w-[86%] max-w-[340px] z-[9999] bg-[#0C0D10] border-l border-white/[0.08] lg:hidden overflow-y-auto flex flex-col">
              <div className="h-header px-5 flex items-center justify-between border-b border-white/[0.08]">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
                  <Image
                    src="/fictionfigure-logo-dark.svg"
                    alt="FictionFigure"
                    width={160}
                    height={36}
                    className="h-7 w-auto object-contain"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className={iconBtn}
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="px-3 py-4 border-b border-white/[0.08]">
                {headerNavigation.map((link) => (
                  <Link
                    key={link.id}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between h-12 px-3 rounded-md text-[13px] font-bold uppercase tracking-[0.1em] text-[#F7F7F5] hover:bg-white/[0.04] hover:text-[#F5C518] transition-colors"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="w-4 h-4 text-[#6E717A]" />
                  </Link>
                ))}
              </nav>

              <div className="px-3 py-4 space-y-0.5">
                <Link
                  href={isLoggedIn ? "/account" : "/login"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 h-11 px-3 rounded-md text-[13px] text-[#F7F7F5]/90 hover:bg-white/[0.04]"
                >
                  <User className="w-4 h-4 text-[#9A9DA5]" />
                  <span>{isLoggedIn ? "My Account" : "Sign In"}</span>
                </Link>
                <Link
                  href="/account/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 h-11 px-3 rounded-md text-[13px] text-[#F7F7F5]/90 hover:bg-white/[0.04]"
                >
                  <Heart className="w-4 h-4 text-[#9A9DA5]" />
                  <span className="flex-1">Wishlist</span>
                  {wishlistCount > 0 && <span className="text-[11px] text-[#F5C518] font-bold">{wishlistCount}</span>}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="w-full flex items-center gap-3 h-11 px-3 rounded-md text-[13px] text-[#F7F7F5]/90 hover:bg-white/[0.04] text-left"
                >
                  <ShoppingBag className="w-4 h-4 text-[#9A9DA5]" />
                  <span className="flex-1">Cart</span>
                  {cartCount > 0 && <span className="text-[11px] text-[#F5C518] font-bold">{cartCount}</span>}
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </header>
  );
}
