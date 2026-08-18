"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";
import { ArrowUpRight, Loader2, Package, AlertCircle } from "lucide-react";
import { API_BASE, adminFetch } from "@/lib/api";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    setErrorMsg("");
    adminFetch(`${API_BASE}/admin/orders`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders || []);
      })
      .catch((err: any) => {
        setErrorMsg(err.message || "Failed to load orders.");
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 text-[#111111]">
      <div className="border-b border-[#E5E5E2] pb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
          Order Operations
        </span>
        <h1 className="text-2xl font-semibold text-[#111111] tracking-tight">
          Fulfillment Orders ({orders.length})
        </h1>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-[#6B6B6B]">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E5E5E2] space-y-3 text-xs">
          <Package className="w-8 h-8 text-[#6B6B6B] mx-auto opacity-40" />
          <p className="text-[#6B6B6B]">No customer orders found in system.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5E2] overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F7F5] border-b border-[#E5E5E2] uppercase font-semibold text-[#6B6B6B]">
                <th className="p-4">Order #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Date</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E2]">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-[#F7F7F5]">
                  <td className="p-4 font-mono font-semibold text-[#111111]">{o.orderNumber}</td>
                  <td className="p-4">
                    <span className="font-semibold text-[#111111] block">{o.customerName}</span>
                    <span className="text-[11px] text-[#6B6B6B] block">{o.customerEmail}</span>
                  </td>
                  <td className="p-4 text-[#6B6B6B]">{formatDate(o.createdAt)}</td>
                  <td className="p-4 font-mono font-semibold text-[#111111]">{formatPrice(o.totalAmount)}</td>
                  <td className="p-4">
                    <span className="bg-[#2E6B44] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="px-3 py-1.5 border border-[#E5E5E2] hover:border-[#111111] text-xs font-semibold uppercase tracking-wider inline-flex items-center"
                    >
                      Manage <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
