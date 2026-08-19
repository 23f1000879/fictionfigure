"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, ArrowLeft, Loader2, AlertCircle, ShoppingBag, ArrowRight, RefreshCw } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { API_BASE } from "@/lib/api";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AccountTabNav } from "@/components/account/AccountTabNav";

export default function AccountOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = () => {
    const token = localStorage.getItem("fictionfigure_token");
    if (!token) {
      router.push("/login?redirect=/account/orders");
      return;
    }

    setLoading(true);
    setError("");

    fetch(`${API_BASE}/orders/my-orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem("fictionfigure_token");
          router.push("/login?redirect=/account/orders");
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load order history.");

        setOrders(data.orders || []);
      })
      .catch((err: any) => {
        setError(err.message || "Unable to load order history.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <SearchModal />
        <CartDrawer />
        <main className="editorial-container py-16 text-[#111111] min-h-[60vh] flex items-center justify-center">
          <div className="text-center text-xs text-[#6B6B6B] space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#111111]" />
            <span>Loading your order history...</span>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12 text-[#111111] space-y-6 min-h-[70vh] box-border">
        {/* Header */}
        <div className="flex items-center space-x-3 border-b border-[#E5E5E2] pb-6">
          <Link
            href="/account"
            className="p-2 border border-[#E5E5E2] hover:border-[#111111] min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#111111]" />
          </Link>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#6B6B6B] block">
              Collector Vault
            </span>
            <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-[#111111] truncate">
              Order History ({orders.length})
            </h1>
          </div>
        </div>

        {/* Account Tab Navigation */}
        <AccountTabNav activeTab="orders" orderCount={orders.length} />

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">{error}</span>
            </div>
            <button
              onClick={fetchOrders}
              className="px-3 py-1 bg-[#A83232] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#852626] transition-colors flex items-center space-x-1 shrink-0 ml-2"
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Retry
            </button>
          </div>
        )}

        {/* Orders List / Empty State */}
        {!error && orders.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-white border border-[#E5E5E2] space-y-4 text-xs">
            <Package className="w-10 h-10 text-[#6B6B6B] mx-auto opacity-50" />
            <div>
              <h3 className="text-sm font-semibold text-[#111111]">No past orders found in your account.</h3>
              <p className="text-[#6B6B6B] mt-1">Your collector history is clear. Start exploring our catalog.</p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-2" /> Explore Catalog
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E5E2] divide-y divide-[#E5E5E2] text-xs">
            {orders.map((o) => {
              const isCod = o.paymentMethod === "COD";
              const isPaid = o.paymentStatus === "PAID" || o.status === "DELIVERED";

              return (
                <div
                  key={o.id}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F7F7F5] transition-colors min-w-0"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#111111]">{o.orderNumber}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${
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
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                          isCod
                            ? "bg-[#111111] text-white"
                            : isPaid
                            ? "bg-[#2E6B44] text-white"
                            : "bg-[#B86E00] text-white"
                        }`}
                      >
                        {isCod ? "COD" : o.paymentStatus || "UPI"}
                      </span>
                    </div>

                    <p className="text-[#6B6B6B] leading-snug break-words">
                      {o.firstItemTitle || o.items?.[0]?.title || "Collectible Figure"} • Placed on {formatDate(o.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#E5E5E2]">
                    <span className="font-mono font-bold text-sm text-[#111111]">{formatPrice(o.totalAmount)}</span>
                    <Link
                      href={`/order/${o.id}`}
                      className="min-h-[40px] px-3.5 py-2 border border-[#E5E5E2] hover:border-[#111111] text-[11px] font-semibold uppercase tracking-wider text-[#111111] transition-colors flex items-center shrink-0"
                    >
                      View Receipt <ArrowRight className="w-3.5 h-3.5 ml-1 inline" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
