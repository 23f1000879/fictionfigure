"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Users, ShoppingBag, ShieldCheck, Phone, Mail, MapPin } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const customerId = params?.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerId) {
      fetch(`http://localhost:5000/api/admin/customers/${customerId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.customer) {
            setCustomer(data.customer);
            setTotalSpent(data.totalSpent || 0);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [customerId]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#6B6B6B]">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Loading customer profile...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold">
        Customer profile not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl text-[#111111]">
      <div className="flex items-center space-x-3 border-b border-[#E5E5E2] pb-4">
        <Link href="/admin/customers" className="p-2 border border-[#E5E5E2] hover:border-[#111111]">
          <ArrowLeft className="w-4 h-4 text-[#111111]" />
        </Link>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Collector Profile
          </span>
          <h1 className="text-xl font-semibold text-[#111111] tracking-tight">
            {customer.firstName} {customer.lastName}
          </h1>
        </div>
      </div>

      {/* Collector Overview Metadata */}
      <div className="bg-white border border-[#E5E5E2] p-6 space-y-4 text-xs">
        <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-3">
          Collector Information & Account Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-[#6B6B6B] uppercase block text-[10px]">Verified Phone</span>
            <span className="font-mono font-semibold text-[#111111] flex items-center mt-0.5">
              <Phone className="w-3 h-3 mr-1 text-[#2E6B44]" />
              {customer.phone || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-[#6B6B6B] uppercase block text-[10px]">Email Address</span>
            <span className="font-mono text-[#111111] flex items-center mt-0.5">
              <Mail className="w-3 h-3 mr-1 text-[#6B6B6B]" />
              {customer.email || "No email assigned"}
            </span>
          </div>
          <div>
            <span className="text-[#6B6B6B] uppercase block text-[10px]">Total Orders</span>
            <span className="font-mono font-bold text-[#111111] mt-0.5 block">
              {customer.orders?.length || 0} order(s)
            </span>
          </div>
          <div>
            <span className="text-[#6B6B6B] uppercase block text-[10px]">Total Lifetime Spending</span>
            <span className="font-mono font-bold text-sm text-[#111111] mt-0.5 block">
              {formatPrice(totalSpent)}
            </span>
          </div>
        </div>
      </div>

      {/* Order History Timeline */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
          Order History ({customer.orders?.length || 0})
        </h2>

        {customer.orders?.length === 0 ? (
          <div className="p-8 text-center bg-white border border-[#E5E5E2] space-y-2 text-xs">
            <ShoppingBag className="w-6 h-6 text-[#6B6B6B] mx-auto opacity-40" />
            <p className="text-[#6B6B6B]">This collector has not placed any orders yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E5E2] overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F7F7F5] border-b border-[#E5E5E2] uppercase font-semibold text-[#6B6B6B]">
                  <th className="p-4">Order #</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E2]">
                {customer.orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-[#F7F7F5]">
                    <td className="p-4 font-mono font-semibold text-[#111111]">{o.orderNumber}</td>
                    <td className="p-4 text-[#6B6B6B]">{formatDate(o.createdAt)}</td>
                    <td className="p-4 font-mono font-semibold text-[#111111]">{formatPrice(o.totalAmount)}</td>
                    <td className="p-4">
                      <span className="bg-[#2E6B44] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-[#6B6B6B]">
                      {o.items?.length || 0} item(s)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
