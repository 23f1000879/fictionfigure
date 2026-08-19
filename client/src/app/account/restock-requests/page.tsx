"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bell, Loader2, Package, Check, Trash2, ArrowRight } from "lucide-react";
import { API_BASE, safeApiFetch } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AccountTabNav } from "@/components/account/AccountTabNav";

export default function MyRestockRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("fictionfigure_token") || localStorage.getItem("token");
  };

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      router.push("/login");
      return;
    }

    // Verify authentication
    safeApiFetch<{ authenticated: boolean; user: any }>(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          // Fetch restock requests
          return safeApiFetch<{ success: boolean; requests: any[] }>(`${API_BASE}/restock-requests/my`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          router.push("/login");
          return null;
        }
      })
      .then((res) => {
        if (res && res.success && Array.isArray(res.requests)) {
          setRequests(res.requests);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const handleUpdateQty = async (id: string, newQty: number) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const data = await safeApiFetch<{ success: boolean; request: any }>(`${API_BASE}/restock-requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: Math.max(1, newQty) }),
      });

      if (data.success && data.request) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, quantity: data.request.quantity } : r))
        );
      }
    } catch (err: any) {
      setActionErr(err.message || "Failed to update quantity.");
    }
  };

  const handleCancelRequest = async (id: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const data = await safeApiFetch<{ success: boolean; request: any }>(`${API_BASE}/restock-requests/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success && data.request) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "CANCELLED" } : r))
        );
      }
    } catch (err: any) {
      setActionErr(err.message || "Failed to cancel request.");
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <SearchModal />
        <CartDrawer />
        <main className="editorial-container py-16 text-[#111111] min-h-[60vh] flex items-center justify-center">
          <div className="text-center text-xs text-[#6B6B6B]">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Loading Restock Requests...
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

      <main className="editorial-container py-10 sm:py-16 space-y-8 text-[#111111]">
        {/* Header Title */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#6B6B6B]">
            Priority Restock Notifications
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">My Restock Requests</h1>
        </div>

        {/* Account Tab Navigation */}
        <AccountTabNav
          activeTab="restock-requests"
          restockCount={requests.filter((r) => r.status === "PENDING").length}
          isAdmin={user?.role === "ADMIN"}
        />

        {actionErr && (
          <div className="p-4 bg-[#FFEBEE] border border-[#A83232] text-[#A83232] text-xs font-semibold">
            {actionErr}
          </div>
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="bg-[#FAF9F6] border border-[#E5E5E2] p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-white border border-[#E5E5E2] flex items-center justify-center mx-auto text-[#6B6B6B]">
              <Bell className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-[#111111]">No Restock Requests</h3>
              <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
                When a figure you love is sold out, click "NOTIFY ME WHEN RESTOCKED" on its product page to receive priority restock alerts.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center px-6 py-3 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors mt-2"
            >
              Explore Shop <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((item) => {
              const prod = item.product;
              const imageUrl = prod?.images[0]?.url || "/placeholder.jpg";
              const isPending = item.status === "PENDING";
              const isFulfilled = item.status === "FULFILLED";

              return (
                <div
                  key={item.id}
                  className="bg-white border border-[#E5E5E2] p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 relative bg-[#FAF9F6] border border-[#E5E5E2] shrink-0 overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={prod?.name || "Product"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <Link
                        href={`/products/${prod?.slug}`}
                        className="font-semibold text-sm text-[#111111] hover:underline block"
                      >
                        {prod?.name}
                      </Link>
                      <div className="flex items-center space-x-3 text-xs text-[#6B6B6B] mt-1 font-mono">
                        <span>Requested: {formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E5E5E2]">
                    {/* Status Badge */}
                    <div>
                      {isPending && (
                        <span className="px-2.5 py-1 bg-[#FFF8E1] text-[#B86E00] border border-[#FFE082] text-[10px] uppercase font-bold tracking-wider">
                          PENDING RESTOCK
                        </span>
                      )}
                      {isFulfilled && (
                        <span className="px-2.5 py-1 bg-[#E8F5E9] text-[#2E6B44] border border-[#A5D6A7] text-[10px] uppercase font-bold tracking-wider flex items-center">
                          <Check className="w-3 h-3 mr-1" /> RESTOCKED / FULFILLED
                        </span>
                      )}
                      {item.status === "CANCELLED" && (
                        <span className="px-2.5 py-1 bg-[#F5F5F5] text-[#757575] border border-[#E0E0E0] text-[10px] uppercase font-bold tracking-wider">
                          CANCELLED
                        </span>
                      )}
                    </div>

                    {/* Quantity Selector for Pending */}
                    {isPending ? (
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center border border-[#E5E5E2] bg-white">
                          <button
                            onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                            className="px-2.5 py-1 text-xs text-[#6B6B6B] hover:text-[#111111]"
                          >
                            -
                          </button>
                          <span className="px-2 font-mono text-xs font-semibold text-[#111111]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                            className="px-2.5 py-1 text-xs text-[#6B6B6B] hover:text-[#111111]"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => handleCancelRequest(item.id)}
                          className="p-1.5 text-[#6B6B6B] hover:text-[#A83232] transition-colors"
                          title="Cancel Restock Request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono text-xs font-semibold text-[#111111]">
                        Qty: {item.quantity}
                      </span>
                    )}
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
