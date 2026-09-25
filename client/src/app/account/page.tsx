"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Package,
  Heart,
  LogOut,
  Loader2,
  CheckCircle2,
  ShoppingBag,
  MapPin,
  Edit3,
  Phone,
  ArrowRight,
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
  const { wishlistProducts, wishlistCount } = useWishlist();
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
        <main className="editorial-container py-16 text-[#111111] min-h-[60vh] flex items-center justify-center">
          <div className="text-center text-xs text-[#6B6B6B]">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Accessing Member Sanctuary...
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const orderCount = user._count?.orders || user.orders?.length || 0;
  const addressCount = user._count?.addresses || 0;

  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />
      <main className="min-h-screen bg-[#F7F7F5] py-6 sm:py-12 text-[#111111] overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8 box-border">
          
          {/* 1. MEMBER SANCTUARY HEADER CARD */}
          <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 rounded-2xl shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E2]/80 pb-6">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6B6B] block">
                    MEMBER SANCTUARY
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
                  Welcome back, {user.firstName}.
                </h1>
                <p className="text-xs text-[#6B6B6B]">
                  Manage your orders, saved addresses and collector account.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 sm:pt-0">
                <Link
                  href="/shop"
                  className="px-5 py-3 bg-[#111111] text-white hover:bg-black text-xs font-bold uppercase tracking-wider rounded-lg transition-all min-h-[44px] flex items-center space-x-2"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>CONTINUE SHOPPING →</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-3 border border-[#E5E5E2] hover:border-[#111111] bg-white text-xs font-semibold uppercase tracking-wider text-[#111111] rounded-lg transition-all flex items-center space-x-2 min-h-[44px]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-[#2E6B44] font-semibold bg-[#2E6B44]/5 border border-[#2E6B44]/20 p-3 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-[#2E6B44] shrink-0" />
              <span>Mobile Verified Collector Identity ({formatDisplayPhone(user.phone)})</span>
            </div>
          </div>

          {/* 2. QUICK STATS CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Link
              href="/account/orders"
              className="bg-white border border-[#E5E5E2] hover:border-[#111111] p-4 sm:p-5 rounded-xl shadow-2xs space-y-2 transition-all group"
            >
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span className="text-[10px] font-bold uppercase tracking-widest block">ORDERS</span>
                <Package className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#111111] transition-colors" />
              </div>
              <span className="font-mono text-2xl sm:text-3xl font-bold text-[#111111] block">
                {orderCount}
              </span>
              <span className="text-[11px] font-semibold text-[#111111] group-hover:underline flex items-center pt-1">
                View orders <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            <Link
              href="/account/wishlist"
              className="bg-white border border-[#E5E5E2] hover:border-[#111111] p-4 sm:p-5 rounded-xl shadow-2xs space-y-2 transition-all group"
            >
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span className="text-[10px] font-bold uppercase tracking-widest block">WISHLIST</span>
                <Heart className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#111111] transition-colors" />
              </div>
              <span className="font-mono text-2xl sm:text-3xl font-bold text-[#111111] block">
                {wishlistCount}
              </span>
              <span className="text-[11px] font-semibold text-[#111111] group-hover:underline flex items-center pt-1">
                Explore vault <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            <Link
              href="/account/addresses"
              className="bg-white border border-[#E5E5E2] hover:border-[#111111] p-4 sm:p-5 rounded-xl shadow-2xs space-y-2 transition-all group"
            >
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span className="text-[10px] font-bold uppercase tracking-widest block">ADDRESSES</span>
                <MapPin className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#111111] transition-colors" />
              </div>
              <span className="font-mono text-2xl sm:text-3xl font-bold text-[#111111] block">
                {addressCount}
              </span>
              <span className="text-[11px] font-semibold text-[#111111] group-hover:underline flex items-center pt-1">
                Manage addresses <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            <div className="bg-white border border-[#E5E5E2] p-4 sm:p-5 rounded-xl shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span className="text-[10px] font-bold uppercase tracking-widest block">PHONE</span>
                <Phone className="w-4 h-4 text-[#2E6B44]" />
              </div>
              <span className="text-xs font-bold text-[#2E6B44] uppercase tracking-wider flex items-center pt-2">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 shrink-0" /> VERIFIED ✓
              </span>
            </div>
          </div>

          {/* 3. ACCOUNT NAVIGATION TABS */}
          <AccountTabNav
            activeTab="profile"
            orderCount={orderCount}
            addressCount={addressCount}
            wishlistCount={wishlistCount}
            isAdmin={user.role === "ADMIN"}
          />

          {/* 4. PROFILE CARD */}
          <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 rounded-2xl shadow-2xs space-y-6">
            <div className="flex justify-between items-center border-b border-[#E5E5E2]/80 pb-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#111111]">
                  PROFILE
                </h2>
                <p className="text-[11px] text-[#6B6B6B]">Personal collector details and authentication ID</p>
              </div>
              <Link
                href="/account/profile"
                className="px-4 py-2 border border-[#E5E5E2] hover:border-[#111111] text-[11px] font-bold uppercase tracking-wider text-[#111111] rounded-lg transition-colors flex items-center space-x-1 shrink-0 min-h-[40px]"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" /> EDIT PROFILE
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-xs">
              <div className="space-y-1 bg-[#F7F7F5] p-3.5 rounded-xl border border-[#E5E5E2]/60">
                <span className="text-[10px] font-bold uppercase text-[#6B6B6B] block">
                  NAME
                </span>
                <span className="text-sm font-semibold text-[#111111] block">
                  {user.firstName} {user.lastName}
                </span>
              </div>

              <div className="space-y-1 bg-[#F7F7F5] p-3.5 rounded-xl border border-[#E5E5E2]/60">
                <span className="text-[10px] font-bold uppercase text-[#6B6B6B] block">
                  MOBILE NUMBER
                </span>
                <span className="font-mono text-sm font-semibold text-[#111111] block">
                  {formatDisplayPhone(user.phone)}
                </span>
              </div>

              <div className="space-y-1 bg-[#F7F7F5] p-3.5 rounded-xl border border-[#E5E5E2]/60">
                <span className="text-[10px] font-bold uppercase text-[#6B6B6B] block">
                  EMAIL ADDRESS
                </span>
                <span className="text-xs font-semibold text-[#111111] block truncate">
                  {user.email || "Not specified (Optional)"}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#6B6B6B] italic border-t border-[#E5E5E2]/60 pt-3">
              Your verified mobile number is used as your primary login identity across FictionFigure.
            </p>
          </div>

          {/* 5. SAVED ADDRESSES SUMMARY */}
          <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 rounded-2xl shadow-2xs space-y-6">
            <div className="flex justify-between items-center border-b border-[#E5E5E2]/80 pb-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#111111]">
                  SAVED ADDRESSES ({addressCount})
                </h2>
                <p className="text-[11px] text-[#6B6B6B]">Default delivery destination for instant checkout</p>
              </div>
              <Link
                href="/account/addresses"
                className="px-4 py-2 border border-[#E5E5E2] hover:border-[#111111] text-[11px] font-bold uppercase tracking-wider text-[#111111] rounded-lg transition-colors flex items-center space-x-1 shrink-0 min-h-[40px]"
              >
                <MapPin className="w-3.5 h-3.5 mr-1" /> MANAGE ADDRESSES
              </Link>
            </div>

            {addressCount === 0 ? (
              <div className="py-8 text-center bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl space-y-3">
                <MapPin className="w-8 h-8 text-[#6B6B6B] mx-auto opacity-40" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">NO SAVED ADDRESSES</h3>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">Add an address for a faster checkout experience.</p>
                </div>
                <Link
                  href="/account/addresses"
                  className="inline-block px-5 py-2.5 bg-[#111111] text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-black transition-colors min-h-[40px]"
                >
                  + ADD ADDRESS
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl text-xs gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#111111] uppercase tracking-wider text-xs">Saved Destinations</span>
                    <span className="text-[9px] bg-[#2E6B44] text-white font-bold px-2 py-0.5 uppercase tracking-wider rounded-md">
                      Stored ({addressCount})
                    </span>
                  </div>
                  <p className="text-[#6B6B6B]">
                    Your saved delivery addresses are ready for quick single-click checkout.
                  </p>
                </div>
                <Link
                  href="/account/addresses"
                  className="text-xs font-bold uppercase text-[#111111] hover:underline flex items-center shrink-0"
                >
                  Manage Destinations →
                </Link>
              </div>
            )}
          </div>

          {/* 6. RECENT ORDERS CARD */}
          <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 rounded-2xl shadow-2xs space-y-6">
            <div className="flex justify-between items-center border-b border-[#E5E5E2]/80 pb-4">
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
              <div className="py-10 text-center bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl space-y-3">
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
              <div className="space-y-3">
                {user.orders.slice(0, 3).map((o: any) => (
                  <div
                    key={o.id}
                    className="p-4 bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs min-w-0"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-bold text-sm text-[#111111]">{o.orderNumber}</span>
                        <span className="text-[10px] bg-[#2E6B44] text-white font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md">
                          {o.status}
                        </span>
                      </div>
                      <p className="text-[#6B6B6B] truncate">
                        {o.items && o.items[0] ? o.items[0].title : "Collectible Figure"} • Placed on {formatDate(o.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5E5E2]">
                      <span className="font-mono text-sm font-bold text-[#111111]">{formatPrice(o.totalAmount)}</span>
                      <Link
                        href={`/order/${o.orderNumber || o.id}`}
                        className="px-3.5 py-2 bg-white border border-[#E5E5E2] hover:border-[#111111] text-[11px] font-bold uppercase tracking-wider text-[#111111] rounded-lg transition-colors flex items-center shrink-0 min-h-[36px]"
                      >
                        View Receipt →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 7. YOUR VAULT / WISHLIST PREVIEW */}
          <div className="bg-white border border-[#E5E5E2] p-6 sm:p-8 rounded-2xl shadow-2xs space-y-6">
            <div className="flex justify-between items-center border-b border-[#E5E5E2]/80 pb-4">
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

            {wishlistProducts.length === 0 ? (
              <div className="py-10 text-center bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl space-y-3">
                <Heart className="w-8 h-8 text-[#6B6B6B] mx-auto opacity-40" />
                <p className="text-xs text-[#6B6B6B]">Nothing saved in your collector vault yet.</p>
                <Link
                  href="/shop"
                  className="inline-block px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-black transition-colors"
                >
                  Explore Collectibles →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {wishlistProducts.slice(0, 4).map((item) => (
                  <div key={item.id} className="border border-[#E5E5E2] p-3 rounded-xl flex items-center space-x-3.5 bg-[#F7F7F5] min-w-0">
                    <img
                      src={item.images?.[0]?.url || item.imageUrl || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80"}
                      alt={item.name || item.title}
                      className="w-14 h-14 sm:w-16 sm:h-16 object-contain p-1 bg-white border border-[#E5E5E2] rounded-lg shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <h4 className="font-semibold text-[#111111] truncate">{item.name || item.title}</h4>
                      <p className="font-mono font-bold text-[#111111]">{formatPrice(item.price)}</p>
                      <Link
                        href={`/products/${item.slug || item.id}`}
                        className="text-[11px] font-semibold text-[#111111] hover:underline block pt-0.5"
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
      </main>
      <Footer />
    </>
  );
}
