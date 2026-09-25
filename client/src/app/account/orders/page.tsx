"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Package, ArrowLeft, Loader2, AlertCircle, ShoppingBag, ArrowRight, RefreshCw, Filter } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { API_BASE, safeApiFetch } from "@/lib/api";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AccountShell } from "@/components/account/AccountShell";

type OrderFilter = "ALL" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export default function AccountOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<OrderFilter>("ALL");

  const fetchOrders = async () => {
    const token = localStorage.getItem("fictionfigure_token");
    if (!token) {
      router.push("/login?redirect=/account/orders");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await safeApiFetch<{ success: boolean; orders: any[] }>(`${API_BASE}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(data.orders || []);
    } catch (err: any) {
      if (err.status === 401) {
        localStorage.removeItem("fictionfigure_token");
        router.push("/login?redirect=/account/orders");
        return;
      }
      setError(err.message || "Unable to load order history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filterOptions: { key: OrderFilter; label: string }[] = [
    { key: "ALL", label: "ALL" },
    { key: "PROCESSING", label: "PROCESSING" },
    { key: "SHIPPED", label: "SHIPPED" },
    { key: "DELIVERED", label: "DELIVERED" },
    { key: "CANCELLED", label: "CANCELLED" },
  ];

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "PROCESSING") return o.status === "PROCESSING" || o.status === "PENDING";
    return o.status === activeFilter;
  });

  const getFilterCount = (key: OrderFilter) => {
    if (key === "ALL") return orders.length;
    if (key === "PROCESSING") return orders.filter((o) => o.status === "PROCESSING" || o.status === "PENDING").length;
    return orders.filter((o) => o.status === key).length;
  };

  if (loading) {
    return (
      <>
        <Header />
        <SearchModal />
        <CartDrawer />
        <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-16 text-[#F7F7F5] min-h-[60vh] flex items-center justify-center">
          <div className="text-center text-xs text-[#9A9DA5] space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#F7F7F5]" />
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
      <AccountShell>
        {/* Header */}
        <div className="flex items-center space-x-3 border-b border-white/[0.08] pb-6">
          <Link
            href="/account"
            className="p-2 border border-white/[0.08] hover:border-white/30 rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#F7F7F5]" />
          </Link>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9A9DA5] block">
              Collector Sanctuary
            </span>
            <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-[#F7F7F5] truncate">
              My Orders {error ? "" : `(${orders.length})`}
            </h1>
          </div>
        </div>

        {/* Account Tab Navigation */}

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-semibold rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">{error}</span>
            </div>
            <button
              onClick={fetchOrders}
              className="px-3 py-1 bg-rose-500/15 text-rose-300 text-[10px] font-bold uppercase tracking-wider rounded-md hover:bg-rose-500/25 transition-colors flex items-center space-x-1 shrink-0 ml-2"
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Retry
            </button>
          </div>
        )}

        {/* Order Status Filters */}
        {!error && orders.length > 0 && (
          <div className="w-full max-w-full overflow-x-auto whitespace-nowrap bg-[#111318] border border-white/[0.08] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl shadow-2xs scrollbar-none">
            <div className="flex items-center gap-1.5 sm:gap-2 w-max min-w-full">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A9DA5] px-3 flex items-center shrink-0">
                <Filter className="w-3.5 h-3.5 mr-1.5 inline" /> FILTER STATUS:
              </span>
              {filterOptions.map((f) => {
                const count = getFilterCount(f.key);
                const isActive = activeFilter === f.key;

                return (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`px-3.5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all flex items-center space-x-2 min-h-[40px] shrink-0 ${
                      isActive
                        ? "bg-[#F5C518] text-[#08090B] border-[#F5C518] shadow-xs"
                        : "bg-[#111318] text-[#9A9DA5] border-white/[0.08] hover:border-white/30 hover:text-white"
                    }`}
                  >
                    <span>{f.label}</span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                        isActive ? "bg-white/20 text-white" : "bg-[#17191F] text-[#9A9DA5]"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Orders List / Empty States */}
        {!error && orders.length === 0 ? (
          <div className="p-8 sm:p-14 text-center bg-[#111318] border border-white/[0.08] rounded-2xl shadow-2xs space-y-4 text-xs">
            <Package className="w-12 h-12 text-[#9A9DA5] mx-auto opacity-40" />
            <div className="space-y-1">
              <h3 className="text-base font-bold uppercase tracking-wider text-[#F7F7F5]">NO ORDERS YET</h3>
              <p className="text-[#9A9DA5]">You haven&apos;t placed an order yet.</p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#F5C518] text-[#08090B] text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#FFD43B] transition-colors min-h-[44px]"
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-2" /> EXPLORE COLLECTIONS
            </Link>
          </div>
        ) : !error && filteredOrders.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-[#111318] border border-white/[0.08] rounded-2xl shadow-2xs space-y-4 text-xs">
            <Package className="w-10 h-10 text-[#9A9DA5] mx-auto opacity-40" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#F7F7F5]">
                NO {activeFilter} ORDERS
              </h3>
              <p className="text-[#9A9DA5]">No orders found matching status &quot;{activeFilter}&quot;.</p>
            </div>
            <button
              onClick={() => setActiveFilter("ALL")}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-[#F5C518] text-[#08090B] text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-[#FFD43B] transition-colors min-h-[40px]"
            >
              VIEW ALL ORDERS
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {filteredOrders.map((o) => {
              const isCod = o.paymentMethod === "COD";
              const isPaid = o.paymentStatus === "PAID" || o.status === "DELIVERED";
              const primaryImage = o.image || o.items?.[0]?.image || "";
              const totalItems = o.itemCount || o.items?.length || 1;
              const firstItemVariant = o.items?.[0]?.variantTitle || "";

              return (
                <div
                  key={o.id}
                  className="bg-[#111318] border border-white/[0.08] p-5 sm:p-6 rounded-2xl shadow-2xs hover:border-white/30 transition-all flex flex-col space-y-4 min-w-0"
                >
                  {/* Top Bar: Order Reference & Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="font-mono font-bold text-sm text-[#F7F7F5] tracking-tight">ORDER {o.orderNumber}</span>
                      <span className="text-[11px] text-[#9A9DA5] border-l border-white/[0.08] pl-3">
                        {formatDate(o.createdAt)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
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
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                          isCod
                            ? "bg-[#F5C518] text-[#08090B]"
                            : isPaid
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-[#F5C518]/15 text-[#F5C518]"
                        }`}
                      >
                        {isCod ? "Cash on Delivery" : o.paymentStatus || "UPI"}
                      </span>
                    </div>
                  </div>

                  {/* Middle Section: Thumbnail, Title, Variant, Tracking */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center space-x-4 min-w-0 flex-1">
                      {/* Product Thumbnail */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-[#17191F] border border-white/[0.08] rounded-xl shrink-0 overflow-hidden flex items-center justify-center p-1">
                        {primaryImage ? (
                          <Image src={primaryImage} alt={o.firstItemTitle || "Product"} fill className="object-contain p-1" />
                        ) : (
                          <Package className="w-6 h-6 text-[#9A9DA5] opacity-50" />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="font-semibold text-[#F7F7F5] text-sm leading-snug truncate">
                          {o.firstItemTitle || "Collectible Figure"}
                        </h4>

                        {firstItemVariant && (
                          <p className="text-[11px] font-medium text-[#9A9DA5]">
                            Variant: <strong className="font-mono text-[#F7F7F5]">{firstItemVariant}</strong>
                          </p>
                        )}

                        <p className="text-[11px] font-medium text-[#9A9DA5]">
                          {totalItems} {totalItems === 1 ? "item" : "items"} {totalItems > 1 ? `(${totalItems} total)` : ""}
                        </p>

                        {/* Tracking details display */}
                        <div className="pt-0.5 text-[11px]">
                          {o.trackingNumber ? (
                            <span className="font-mono font-semibold text-[#F7F7F5]">
                              TRACKING: <strong className="text-emerald-400">{o.trackingNumber}</strong>
                            </span>
                          ) : (
                            <span className="text-[#9A9DA5] italic">
                              Tracking details will be provided once your order ships.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Total & View Order CTA */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/[0.08]">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A9DA5] block">TOTAL</span>
                        <span className="font-mono font-extrabold text-base sm:text-lg text-[#F7F7F5]">
                          {formatPrice(o.totalAmount)}
                        </span>
                      </div>
                      <Link
                        href={`/order/${o.orderNumber || o.id}`}
                        className="min-h-[44px] px-5 py-2.5 bg-[#F5C518] text-[#08090B] hover:bg-[#FFD43B] text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center shrink-0 shadow-xs"
                      >
                        VIEW ORDER <ArrowRight className="w-3.5 h-3.5 ml-1.5 inline" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AccountShell>
      <Footer />
    </>
  );
}
