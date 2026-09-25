"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Heart,
  LogOut,
  Loader2,
  CheckCircle2,
  ShoppingBag,
  MapPin,
  ArrowRight,
  User,
  Edit3,
} from "lucide-react";
import { formatDisplayPhone } from "@/lib/phone";
import { formatPrice, formatDate } from "@/lib/utils";
import { API_BASE } from "@/lib/api";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AccountTabNav } from "@/components/account/AccountTabNav";
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

  const handleLogout = () => {
    localStorage.removeItem("fictionfigure_token");
    router.push("/login");
  };

  if (loading || !user) {
    return (
      <>
        <Header />
        <SearchModal />
        <CartDrawer />
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-16 text-[#111111] min-h-[60vh] flex items-center justify-center">
          <div className="text-center text-xs text-[#6B6B6B] space-y-2">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#111111]" />
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
      <main className="min-h-[75vh] bg-[#F7F7F5] py-8 sm:py-16 text-[#111111] overflow-x-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-14 box-border">
          
          {/* 1. WELCOME / IDENTITY SECTION */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-6">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6B6B] block">
                    MEMBER SANCTUARY
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[#111111]">
                  Welcome back, {user.firstName}.
                </h1>
                <p className="text-xs sm:text-sm text-[#6B6B6B]">
                  Manage your collection, orders and account preferences.
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-[#6B6B6B] hover:text-[#111111] hover:underline flex items-center space-x-1.5 shrink-0 transition-colors py-1 px-2"
                title="Sign out of customer account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>

            {/* Compact Verified Identity Row & Primary CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs font-semibold text-[#2E6B44]">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E6B44]" />
                  <span>Verified mobile · {formatDisplayPhone(user.phone)}</span>
                </div>
                {user.email && (
                  <p className="text-xs text-[#6B6B6B] pl-6 truncate">
                    Email: {user.email}
                  </p>
                )}
              </div>

              <Link
                href="/shop"
                className="inline-flex items-center justify-center px-6 py-3.5 bg-[#111111] text-white hover:bg-black text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs shrink-0 min-h-[44px]"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                <span>CONTINUE SHOPPING →</span>
              </Link>
            </div>
          </div>

          {/* 2. ACCOUNT NAVIGATION TABS */}
          <AccountTabNav
            activeTab="profile"
            orderCount={orderCount}
            addressCount={addressCount}
            wishlistCount={wishlistCount}
            isAdmin={user.role === "ADMIN"}
          />

          {/* 3. QUICK ACCESS SECTION */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#111111]">
              QUICK ACCESS
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
              <Link
                href="/account/orders"
                className="bg-white border border-[#E5E5E2] hover:border-[#111111] p-5 rounded-xl transition-all shadow-2xs group flex flex-col justify-between min-h-[105px]"
              >
                <div className="flex items-center justify-between text-[#111111]">
                  <span className="font-semibold text-sm">Orders</span>
                  <ArrowRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#111111] group-hover:translate-x-1 transition-all" />
                </div>
                <span className="text-xs text-[#6B6B6B] block">
                  {orderCount} {orderCount === 1 ? "order" : "orders"}
                </span>
              </Link>

              <Link
                href="/account/addresses"
                className="bg-white border border-[#E5E5E2] hover:border-[#111111] p-5 rounded-xl transition-all shadow-2xs group flex flex-col justify-between min-h-[105px]"
              >
                <div className="flex items-center justify-between text-[#111111]">
                  <span className="font-semibold text-sm">Saved addresses</span>
                  <ArrowRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#111111] group-hover:translate-x-1 transition-all" />
                </div>
                <span className="text-xs text-[#6B6B6B] block">
                  {addressCount} saved {addressCount === 1 ? "address" : "addresses"}
                </span>
              </Link>

              <Link
                href="/account/wishlist"
                className="bg-white border border-[#E5E5E2] hover:border-[#111111] p-5 rounded-xl transition-all shadow-2xs group flex flex-col justify-between min-h-[105px]"
              >
                <div className="flex items-center justify-between text-[#111111]">
                  <span className="font-semibold text-sm">Wishlist</span>
                  <ArrowRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#111111] group-hover:translate-x-1 transition-all" />
                </div>
                <span className="text-xs text-[#6B6B6B] block">
                  {wishlistCount} saved {wishlistCount === 1 ? "item" : "items"}
                </span>
              </Link>
            </div>
          </div>

          {/* 4. RECENT ORDERS SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#111111]">
                RECENT ORDERS
              </h2>
              <Link
                href="/account/orders"
                className="text-xs font-semibold text-[#111111] hover:underline flex items-center"
              >
                VIEW ALL →
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-10 text-center bg-white border border-[#E5E5E2] rounded-xl space-y-3 p-6">
                <Package className="w-8 h-8 text-[#6B6B6B] mx-auto opacity-40" />
                <p className="text-xs text-[#6B6B6B]">Your collector order history is clear.</p>
                <Link
                  href="/shop"
                  className="inline-block px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-black transition-colors"
                >
                  Explore Catalog →
                </Link>
              </div>
            ) : (
              <div className="bg-white border border-[#E5E5E2] rounded-xl divide-y divide-[#E5E5E2] text-xs shadow-2xs">
                {recentOrders.map((o: any) => {
                  const isCod = o.paymentMethod === "COD";
                  const isPaid = o.paymentStatus === "PAID" || o.status === "DELIVERED";
                  const itemCount = o.items?.length || 1;

                  return (
                    <div key={o.id} className="p-4 sm:p-5 flex flex-col space-y-3 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-3">
                          <span className="font-mono font-bold text-sm text-[#111111]">{o.orderNumber}</span>
                          <span className="text-xs text-[#6B6B6B] border-l border-[#E5E5E2] pl-3">
                            {formatDate(o.createdAt)}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                            o.status === "DELIVERED"
                              ? "bg-[#2E6B44] text-white"
                              : o.status === "SHIPPED"
                              ? "bg-[#2E6B44] text-white"
                              : o.status === "PROCESSING"
                              ? "bg-[#2E6B44] text-white"
                              : o.status === "CANCELLED"
                              ? "bg-[#A83232] text-white"
                              : "bg-[#B86E00] text-white"
                          }`}
                        >
                          {o.status}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <p className="font-semibold text-[#111111] truncate text-xs">
                            {o.items?.[0]?.title || "Collectible Figure"}
                          </p>
                          <p className="text-[11px] text-[#6B6B6B]">
                            {itemCount} {itemCount === 1 ? "item" : "items"}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5E5E2]/60">
                          <span className="font-mono font-bold text-sm text-[#111111]">{formatPrice(o.totalAmount)}</span>
                          <Link
                            href={`/order/${o.orderNumber || o.id}`}
                            className="text-xs font-semibold text-[#111111] hover:underline flex items-center shrink-0"
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

          {/* 5. PROFILE QUICK ACTION FOOTER */}
          <div className="pt-4 border-t border-[#E5E5E2] flex flex-col sm:flex-row items-center justify-between text-xs text-[#6B6B6B] gap-3">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-[#6B6B6B]" />
              <span>Need to update profile details or email?</span>
            </div>
            <Link
              href="/account/profile"
              className="font-semibold text-[#111111] hover:underline flex items-center space-x-1"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" />
              <span>Edit Profile Details →</span>
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
