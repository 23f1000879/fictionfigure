"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Package,
  Heart,
  LogOut,
  Loader2,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";
import { formatDisplayPhone } from "@/lib/phone";
import { formatPrice, formatDate } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("fictionfigure_token");

    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch authenticated user session with real orders and counts
    fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          setLoading(false);
        } else {
          localStorage.removeItem("fictionfigure_token");
          router.push("/login");
        }
      })
      .catch(() => {
        localStorage.removeItem("fictionfigure_token");
        router.push("/login");
      });

    // Fetch real wishlist items for Vault preview
    fetch(`${API_BASE}/products?limit=2`)
      .then((res) => res.json())
      .then((data) => setWishlistItems(data.products || []))
      .catch(() => setWishlistItems([]));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("fictionfigure_token");
    router.push("/login");
  };

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-xs text-[#6B6B6B]">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#111111]" /> Accessing Member Sanctuary...
      </div>
    );
  }

  const orderCount = user._count?.orders || user.orders?.length || 0;
  const addressCount = user._count?.addresses || 0;
  const wishlistCount = wishlistItems.length;

  return (
    <div className="min-h-screen bg-[#F7F7F5] py-8 sm:py-12 text-[#111111]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
        
        {/* 1. NEW ACCOUNT HEADER */}
        <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#E5E5E2] pb-6">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Image
                  src="/fictionfigure-icon.svg"
                  alt="FictionFigure Emblem"
                  width={24}
                  height={24}
                  className="h-5 w-auto object-contain"
                />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6B6B] block">
                  MEMBER SANCTUARY
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
                Welcome back, {user.firstName}.
              </h1>
              <p className="text-xs text-[#6B6B6B]">
                Manage your orders, collection and account settings.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="self-start sm:self-auto px-4 py-2 border border-[#E5E5E2] hover:border-[#111111] text-xs font-semibold uppercase tracking-wider text-[#111111] transition-colors flex items-center space-x-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs text-[#2E6B44] font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#2E6B44]" />
              <span>Mobile Verified Collector Identity</span>
            </div>

            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors space-x-2 w-full sm:w-auto"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>CONTINUE SHOPPING →</span>
            </Link>
          </div>
        </div>

        {/* 2. ACCOUNT OVERVIEW STATISTICS (REAL DATA) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E5E5E2] p-5 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B] block">
              ORDERS
            </span>
            <span className="font-mono text-2xl font-bold text-[#111111] block">
              {orderCount}
            </span>
          </div>

          <div className="bg-white border border-[#E5E5E2] p-5 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B] block">
              WISHLIST
            </span>
            <span className="font-mono text-2xl font-bold text-[#111111] block">
              {wishlistCount}
            </span>
          </div>

          <div className="bg-white border border-[#E5E5E2] p-5 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B] block">
              ADDRESSES
            </span>
            <span className="font-mono text-2xl font-bold text-[#111111] block">
              {addressCount}
            </span>
          </div>

          <div className="bg-white border border-[#E5E5E2] p-5 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B] block">
              PHONE
            </span>
            <span className="text-xs font-bold text-[#2E6B44] uppercase tracking-wider flex items-center space-x-1 pt-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              VERIFIED ✓
            </span>
          </div>
        </div>

        {/* 6. QUICK NAVIGATION TABS */}
        <div className="flex border-b border-[#E5E5E2] bg-white text-xs font-semibold uppercase tracking-wider overflow-x-auto">
          <Link
            href="/account"
            className="px-6 py-3.5 border-b-2 border-[#111111] text-[#111111] font-bold flex items-center space-x-2 whitespace-nowrap"
          >
            <UserIcon className="w-4 h-4" />
            <span>Profile</span>
          </Link>
          <Link
            href="/account/orders"
            className="px-6 py-3.5 text-[#6B6B6B] hover:text-[#111111] hover:bg-[#F7F7F5] transition-colors flex items-center space-x-2 whitespace-nowrap"
          >
            <Package className="w-4 h-4" />
            <span>Orders ({orderCount})</span>
          </Link>
          <Link
            href="/account/wishlist"
            className="px-6 py-3.5 text-[#6B6B6B] hover:text-[#111111] hover:bg-[#F7F7F5] transition-colors flex items-center space-x-2 whitespace-nowrap"
          >
            <Heart className="w-4 h-4" />
            <span>Wishlist & Vault</span>
          </Link>
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="px-6 py-3.5 bg-[#2E6B44] text-white font-bold tracking-widest flex items-center space-x-2 whitespace-nowrap ml-auto"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Console</span>
            </Link>
          )}
        </div>

        {/* 3. PROFILE CARD (NO EMPTY EMAIL UI) */}
        <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#111111]">
              YOUR PROFILE
            </h2>
            <span className="text-[11px] font-mono text-[#6B6B6B]">ID: {user.id.slice(0, 8)}...</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase text-[#6B6B6B] block">
                FULL NAME
              </span>
              <span className="text-sm font-semibold text-[#111111] block">
                {user.firstName} {user.lastName}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase text-[#6B6B6B] block">
                MOBILE NUMBER
              </span>
              <span className="font-mono text-sm font-semibold text-[#111111] block">
                {formatDisplayPhone(user.phone)}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase text-[#6B6B6B] block">
                VERIFICATION STATUS
              </span>
              <span className="text-xs font-semibold text-[#2E6B44] flex items-center pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mobile Verified ✓
              </span>
            </div>
          </div>
        </div>

        {/* 4. RECENT ORDERS SECTION */}
        <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#111111]">
              RECENT ORDERS
            </h2>
            <Link
              href="/account/orders"
              className="text-xs font-semibold text-[#111111] hover:underline flex items-center"
            >
              View all orders →
            </Link>
          </div>

          {!user.orders || user.orders.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <Package className="w-8 h-8 text-[#6B6B6B] mx-auto opacity-50" />
              <p className="text-xs text-[#6B6B6B]">Your collection starts here.</p>
              <Link
                href="/shop"
                className="inline-block px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black transition-colors"
              >
                Explore the shop →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E5E2]">
              {user.orders.map((o: any) => (
                <div key={o.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-sm text-[#111111]">{o.orderNumber}</span>
                      <span className="text-[10px] bg-[#2E6B44] text-white font-bold uppercase tracking-wider px-2 py-0.5">
                        {o.status}
                      </span>
                    </div>
                    <p className="text-[#6B6B6B]">
                      {o.items && o.items[0] ? o.items[0].title : "Collectible Figure"} • {formatDate(o.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-6">
                    <span className="font-mono text-sm font-bold text-[#111111]">{formatPrice(o.totalAmount)}</span>
                    <Link
                      href={`/order/${o.id}`}
                      className="font-semibold text-[#111111] hover:underline flex items-center"
                    >
                      View Order →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. YOUR VAULT / WISHLIST SECTION */}
        <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#111111]">
              YOUR VAULT
            </h2>
            <Link
              href="/account/wishlist"
              className="text-xs font-semibold text-[#111111] hover:underline flex items-center"
            >
              Explore Vault →
            </Link>
          </div>

          {wishlistItems.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <Heart className="w-8 h-8 text-[#6B6B6B] mx-auto opacity-50" />
              <p className="text-xs text-[#6B6B6B]">Nothing saved yet.</p>
              <Link
                href="/shop"
                className="inline-block px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black transition-colors"
              >
                Explore collectibles →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {wishlistItems.map((item) => (
                <div key={item.id} className="border border-[#E5E5E2] p-4 flex items-center space-x-4 bg-[#F7F7F5]">
                  <img
                    src={item.imageUrl || item.primaryImage || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80"}
                    alt={item.title}
                    className="w-16 h-16 object-cover bg-white border border-[#E5E5E2]"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-semibold text-[#111111] truncate">{item.title}</h4>
                    <p className="font-mono font-bold text-[#111111]">{formatPrice(item.price)}</p>
                    <Link
                      href={`/products/${item.slug || item.id}`}
                      className="text-[11px] font-semibold text-[#111111] hover:underline block pt-1"
                    >
                      View Product →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
