"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, ArrowLeft, Loader2, ArrowUpRight } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";

export default function AccountOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fictionfigure_token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("http://localhost:5000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          localStorage.removeItem("fictionfigure_token");
          router.push("/login");
        } else {
          setOrders([]);
        }
      })
      .catch(() => {
        localStorage.removeItem("fictionfigure_token");
        router.push("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#6B6B6B]">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Loading orders...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-[#111111] space-y-8">
      <div className="flex items-center space-x-3 border-b border-[#E5E5E2] pb-6">
        <Link href="/account" className="p-2 border border-[#E5E5E2] hover:border-[#111111]">
          <ArrowLeft className="w-4 h-4 text-[#111111]" />
        </Link>
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Collector Vault
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">
            Order History
          </h1>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E5E5E2] space-y-4 text-xs">
          <Package className="w-8 h-8 text-[#6B6B6B] mx-auto" />
          <p className="text-[#6B6B6B]">No past orders found in your account.</p>
          <Link
            href="/shop"
            className="inline-block px-6 py-3 bg-[#111111] text-white font-semibold uppercase tracking-wider"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5E2] divide-y divide-[#E5E5E2] text-xs">
          {orders.map((o) => (
            <div key={o.id} className="p-6 flex justify-between items-center">
              <div>
                <span className="font-mono font-bold text-sm text-[#111111] block">{o.orderNumber}</span>
                <span className="text-[11px] text-[#6B6B6B] block">{formatDate(o.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-mono font-bold text-sm text-[#111111]">{formatPrice(o.totalAmount)}</span>
                <span className="bg-[#2E6B44] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                  {o.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
