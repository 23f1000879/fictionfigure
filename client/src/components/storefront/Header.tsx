"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, User, Heart, ShoppingBag, Menu, X, ArrowRight, ChevronDown, FolderTree, Sun, Moon } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useSettings } from "@/context/SettingsContext";
import { useTheme } from "@/context/ThemeContext";
import { useStoreCategories } from "@/lib/useStoreCategories";

// Naked 36px icon control used across the header (reference: small, borderless, refined).
const iconBtn =
  "relative w-11 h-11 lg:w-9 lg:h-9 min-w-[44px] lg:min-w-[36px] rounded-full flex items-center justify-center text-[#F7F7F5]/85 hover:text-white hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C518]";

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#F5C518] text-[#08090B] text-[9px] font-extrabold flex items-center justify-center ring-2 ring-[#08090B]">
      {count > 99 ? "99+" : count}
    </span>
  );
}

// Primary navigation: SHOP · CATEGORIES (real categories, dropdown) · UNIVERSES · ABOUT.
// New Arrivals stays reachable from the homepage, shop sort and its own route.
type NavKey = "shop" | "categories" | "universes" | "about" | null;

function useActiveNav(pathname: string): NavKey {
  const searchParams = useSearchParams();
  if (pathname.startsWith("/collections")) return "universes";
  if (pathname === "/about") return "about";
  if (pathname === "/shop") return searchParams?.get("category") ? "categories" : "shop";
  return null;
}

const navText = (active: boolean) =>
  `relative inline-flex items-center gap-1 h-11 transition-colors focus-visible:outline-none focus-visible:text-[#F5C518] ${
    active ? "text-white" : "text-[#F7F7F5]/75 hover:text-white"
  }`;

function ActiveBar({ active }: { active: boolean }) {
  return (
    <span
      className={`absolute bottom-[9px] left-0 h-[2px] rounded-full bg-[#F5C518] transition-all duration-200 ${
        active ? "w-full" : "w-0"
      }`}
    />
  );
}

function CategoriesMenu({ active }: { active: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { categories, loading } = useStoreCategories(open);
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={`${navText(active || open)} uppercase`}
      >
        Categories
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
        <ActiveBar active={active} />
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[min(640px,90vw)] rounded-[12px] border border-white/[0.1] bg-[#0D0E12]/95 backdrop-blur-xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] p-4 normal-case tracking-normal"
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
            <p className="ff-eyebrow">Shop by category</p>
            <Link href="/shop" className="ff-link-arrow text-[12px]">
              View all products <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-2" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 rounded-[8px] bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-[#9A9DA5]">No categories are published yet.</p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const count = cat._count?.products;
                return (
                  <li key={cat.id}>
                    <Link
                      href={`/shop?category=${cat.slug}`}
                      className="group flex items-center gap-3 min-h-[64px] p-2 rounded-[8px] border border-transparent hover:border-[#F5C518]/40 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:border-[#F5C518] transition-colors"
                    >
                      <span className="relative w-12 h-12 shrink-0 overflow-hidden rounded-[6px] bg-[#17191F] border border-white/[0.06] flex items-center justify-center">
                        {cat.imageUrl ? (
                          <Image src={cat.imageUrl} alt="" fill sizes="48px" className="object-cover object-top" />
                        ) : (
                          <FolderTree className="w-4 h-4 text-white/30" aria-hidden />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold text-[#F7F7F5] group-hover:text-white truncate">
                          {cat.name}
                        </span>
                        {count !== undefined && (
                          <span className="block text-[11px] text-[#9A9DA5]">
                            {count} {count === 1 ? "product" : "products"}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function HeaderNavLinks({ pathname }: { pathname: string }) {
  const active = useActiveNav(pathname);
  return (
    <nav
      aria-label="Primary"
      className="hidden lg:flex items-center gap-8 xl:gap-10 text-[12px] font-semibold uppercase tracking-[0.1em]"
    >
      <Link href="/shop" className={navText(active === "shop")} aria-current={active === "shop" ? "page" : undefined}>
        Shop
        <ActiveBar active={active === "shop"} />
      </Link>
      <CategoriesMenu active={active === "categories"} />
      <Link
        href="/collections"
        className={navText(active === "universes")}
        aria-current={active === "universes" ? "page" : undefined}
      >
        Universes
        <ActiveBar active={active === "universes"} />
      </Link>
      <Link href="/about" className={navText(active === "about")} aria-current={active === "about" ? "page" : undefined}>
        About
        <ActiveBar active={active === "about"} />
      </Link>
    </nav>
  );
}

function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const [catsOpen, setCatsOpen] = useState(false);
  const { categories, loading } = useStoreCategories(catsOpen);
  const row =
    "flex items-center justify-between w-full h-12 px-3 rounded-md text-[13px] font-bold uppercase tracking-[0.1em] text-[#F7F7F5] hover:bg-white/[0.04] hover:text-[#F5C518] transition-colors text-left";

  return (
    <nav aria-label="Primary" className="px-3 py-4 border-b border-white/[0.08]">
      <Link href="/shop" onClick={onNavigate} className={row}>
        <span>Shop</span>
        <ArrowRight className="w-4 h-4 text-[#6E717A]" />
      </Link>
      <button type="button" className={row} aria-expanded={catsOpen} onClick={() => setCatsOpen((v) => !v)}>
        <span>Categories</span>
        <ChevronDown className={`w-4 h-4 text-[#6E717A] transition-transform ${catsOpen ? "rotate-180" : ""}`} />
      </button>
      {catsOpen && (
        <ul className="pl-3 pb-2">
          {loading ? (
            <li className="h-11 px-3 flex items-center text-[12px] text-[#6E717A]">Loading…</li>
          ) : categories.length === 0 ? (
            <li className="h-11 px-3 flex items-center text-[12px] text-[#6E717A]">No categories yet</li>
          ) : (
            categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/shop?category=${cat.slug}`}
                  onClick={onNavigate}
                  className="flex items-center justify-between h-11 px-3 rounded-md text-[13px] text-[#F7F7F5]/90 hover:bg-white/[0.04]"
                >
                  <span className="truncate">{cat.name}</span>
                  {cat._count?.products !== undefined && (
                    <span className="text-[11px] text-[#6E717A]">{cat._count.products}</span>
                  )}
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
      <Link href="/collections" onClick={onNavigate} className={row}>
        <span>Universes</span>
        <ArrowRight className="w-4 h-4 text-[#6E717A]" />
      </Link>
      <Link href="/about" onClick={onNavigate} className={row}>
        <span>About</span>
        <ArrowRight className="w-4 h-4 text-[#6E717A]" />
      </Link>
    </nav>
  );
}

export function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
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
          aria-label="Fiction Figures home"
        >
          <Image
            src="/fictionfigure-logo-light.png"
            alt="Fiction Figures"
            width={326}
            height={100}
            priority
            className="hidden dark:block h-9 sm:h-10 w-auto max-w-[140px] sm:max-w-[160px] object-contain"
          />
          <Image
            src="/fictionfigure-logo.svg"
            alt="Fiction Figures"
            width={460}
            height={120}
            priority
            className="block dark:hidden h-9 sm:h-10 w-auto max-w-[140px] sm:max-w-[160px] object-contain"
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

          {/* Day / Night Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={iconBtn}
            aria-label={theme === "night" ? "Switch to Day theme" : "Switch to Night theme"}
            title={theme === "night" ? "Switch to Day theme" : "Switch to Night theme"}
          >
            {theme === "night" ? (
              <Sun className="w-[18px] h-[18px] text-[#F5C518] transition-transform duration-200 motion-reduce:transition-none hover:rotate-45" />
            ) : (
              <Moon className="w-[18px] h-[18px] text-[#171717] transition-transform duration-200 motion-reduce:transition-none hover:-rotate-12" />
            )}
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
                    src="/fictionfigure-logo-light.png"
                    alt="Fiction Figures"
                    width={326}
                    height={100}
                    className="hidden dark:block h-7 w-auto object-contain"
                  />
                  <Image
                    src="/fictionfigure-logo.svg"
                    alt="Fiction Figures"
                    width={460}
                    height={120}
                    className="block dark:hidden h-7 w-auto object-contain"
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

              <MobileNav onNavigate={() => setMobileMenuOpen(false)} />

              <div className="px-3 py-4 space-y-0.5">
                {/* Mobile Drawer Theme Toggle */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between h-11 px-3 rounded-md text-[13px] text-[#F7F7F5]/90 hover:bg-white/[0.04] text-left"
                >
                  <span className="flex items-center gap-3">
                    {theme === "night" ? (
                      <Sun className="w-4 h-4 text-[#F5C518]" />
                    ) : (
                      <Moon className="w-4 h-4 text-[#171717]" />
                    )}
                    <span>{theme === "night" ? "Night Mode" : "Day Mode"}</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5C518]">
                    Switch to {theme === "night" ? "Day" : "Night"}
                  </span>
                </button>

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
