"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Loader2, CheckCircle2, ArrowRight, MapPin, Heart } from "lucide-react";
import { formatDisplayPhone } from "@/lib/phone";
import { formatPrice, formatDate } from "@/lib/utils";
import { API_BASE } from "@/lib/api";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AccountShell } from "@/components/account/AccountShell";
import { useWishlist } from "@/context/WishlistContext";

export default function AccountPage() {
  const router = useRouter();
  const { wishlistCount } = useWishlist();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fictionfigure_token");

    if (!token) {
      router.push("/login");
      return;
    }

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
  }, [router]);

  if (loading || !user) {
    return (
      <>
        <Header />
        <SearchModal />
        <CartDrawer />
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-16 text-[#F7F7F5] min-h-[60vh] flex items-center justify-center">
          <div className="text-center text-xs text-[#9A9DA5] space-y-2">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#F7F7F5]" />
            <span>Accessing Member Sanctuary...</span>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const orderCount = user._count?.orders || user.orders?.length || 0;
  const addressCount = user._count?.addresses || 0;
  const recentOrders = user.orders?.slice(0, 3) || [];

  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />
      <AccountShell isAdmin={user.role === "ADMIN"}>
        <div className="space-y-8">
          {/* Welcome */}
          <div className="space-y-1.5">
            <p className="ff-eyebrow">Member Dashboard</p>
            <h1 className="text-[28px] sm:text-[34px] font-extrabold tracking-[-0.02em] text-white">
              Welcome back, {user.firstName}.
            </h1>
            <p className="text-[13px] text-[#9A9DA5]">Manage your collection, orders and account preferences.</p>
          </div>

          {/* Verified identity */}
          <Link
            href="/account/profile"
            className="group flex items-center gap-4 max-w-md rounded-[12px] border border-white/[0.08] bg-[#111318]/90 backdrop-blur p-4 hover:border-white/20 transition-colors"
          >
            <span className="w-12 h-12 rounded-full bg-[#F5C518]/15 border border-[#F5C518]/40 text-[#F5C518] flex items-center justify-center text-[18px] font-extrabold shrink-0">
              {(user.firstName || "?").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[12px] text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Account
              </p>
              <p className="text-[15px] font-bold text-white truncate">{formatDisplayPhone(user.phone)}</p>
              {user.email && <p className="text-[12px] text-[#9A9DA5] truncate">{user.email}</p>}
            </div>
            <ArrowRight className="w-4 h-4 text-[#9A9DA5] group-hover:text-white transition-colors shrink-0" />
          </Link>

          {/* Quick access */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { href: "/account/orders", icon: Package, title: "My Orders", meta: `${orderCount} ${orderCount === 1 ? "order" : "orders"}` },
              { href: "/account/addresses", icon: MapPin, title: "Saved Addresses", meta: `${addressCount} ${addressCount === 1 ? "address" : "addresses"}` },
              { href: "/account/wishlist", icon: Heart, title: "Wishlist", meta: `${wishlistCount} ${wishlistCount === 1 ? "item" : "items"}` },
            ].map(({ href, icon: Icon, title, meta }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col justify-between gap-6 rounded-[12px] border border-white/[0.08] bg-[#111318] p-4 hover:border-[#F5C518]/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="w-9 h-9 rounded-[8px] border border-white/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#F5C518]" />
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#9A9DA5] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-white">{title}</p>
                  <p className="text-[12px] text-[#9A9DA5]">{meta}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* 4. RECENT ORDERS SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#F7F7F5]">
                RECENT ORDERS
              </h2>
              <Link
                href="/account/orders"
                className="text-xs font-semibold text-[#F7F7F5] hover:underline flex items-center"
              >
                VIEW ALL →
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-10 text-center bg-[#111318] border border-white/[0.08] rounded-xl space-y-3 p-6">
                <Package className="w-8 h-8 text-[#9A9DA5] mx-auto opacity-40" />
                <p className="text-xs text-[#9A9DA5]">Your collector order history is clear.</p>
                <Link
                  href="/shop"
                  className="inline-block px-5 py-2.5 bg-[#F5C518] text-[#08090B] text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-[#FFD43B] transition-colors"
                >
                  Explore Catalog →
                </Link>
              </div>
            ) : (
              <div className="bg-[#111318] border border-white/[0.08] rounded-xl divide-y divide-white/[0.06] text-xs shadow-2xs">
                {recentOrders.map((o: any) => {
                  const itemCount = o.items?.length || 1;

                  return (
                    <div key={o.id} className="p-4 sm:p-5 flex flex-col space-y-3 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-3">
                          <span className="font-mono font-bold text-sm text-[#F7F7F5]">{o.orderNumber}</span>
                          <span className="text-xs text-[#9A9DA5] border-l border-white/[0.08] pl-3">
                            {formatDate(o.createdAt)}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                            o.status === "DELIVERED"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : o.status === "SHIPPED"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : o.status === "PROCESSING"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : o.status === "CANCELLED"
                              ? "bg-rose-500/15 text-rose-300"
                              : "bg-[#F5C518]/15 text-[#F5C518]"
                          }`}
                        >
                          {o.status}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <p className="font-semibold text-[#F7F7F5] truncate text-xs">
                            {o.items?.[0]?.title || "Collectible Figure"}
                          </p>
                          <p className="text-[11px] text-[#9A9DA5]">
                            {itemCount} {itemCount === 1 ? "item" : "items"}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                          <span className="font-mono font-bold text-sm text-[#F7F7F5]">{formatPrice(o.totalAmount)}</span>
                          <Link
                            href={`/order/${o.orderNumber || o.id}`}
                            className="text-xs font-semibold text-[#F7F7F5] hover:underline flex items-center shrink-0"
                          >
                            VIEW ORDER →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </AccountShell>
      <Footer />
    </>
  );
}
