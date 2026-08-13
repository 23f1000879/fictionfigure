"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";
import { Users, Loader2, Ban, ArrowUpRight, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/admin/customers");
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (e) {
      console.error(e);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleBlock = async (userId: string, currentBlocked: boolean) => {
    setActionId(userId);
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/admin/users/block", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isBlocked: !currentBlocked }),
      });

      if (res.ok) {
        setMessage(`User account status updated to ${!currentBlocked ? "BLOCKED" : "ACTIVE"}`);
        fetchCustomers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6 text-[#111111]">
      <div className="border-b border-[#E5E5E2] pb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
          Customer Directory
        </span>
        <h1 className="text-2xl font-semibold text-[#111111] tracking-tight">
          Registered Collectors ({customers.length})
        </h1>
      </div>

      {message && (
        <div className="p-3 bg-[#2E6B44]/10 border border-[#2E6B44] text-[#2E6B44] text-xs font-semibold flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          <span>{message}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-[#6B6B6B]">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Loading customer directory...
        </div>
      ) : customers.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E5E5E2] space-y-2 text-xs">
          <Users className="w-6 h-6 text-[#6B6B6B] mx-auto opacity-40" />
          <p className="text-[#6B6B6B]">No registered customers found in database.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5E2] overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F7F5] border-b border-[#E5E5E2] uppercase font-semibold text-[#6B6B6B]">
                <th className="p-4">Collector Name</th>
                <th className="p-4">Mobile / Contact</th>
                <th className="p-4">Orders</th>
                <th className="p-4">Total Spent</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E2]">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-[#F7F7F5]">
                  <td className="p-4 font-semibold text-[#111111]">
                    <div className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-[#6B6B6B]" />
                      <span>{c.name || "Anonymous Collector"}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-[#111111] block">{c.phone || "No Mobile"}</span>
                    <span className="text-[11px] text-[#6B6B6B] block">{c.email || "No Email"}</span>
                  </td>
                  <td className="p-4 font-mono font-semibold text-[#111111]">
                    {c.orderCount} order(s)
                  </td>
                  <td className="p-4 font-mono font-bold text-[#111111]">
                    {formatPrice(c.totalSpent)}
                  </td>
                  <td className="p-4">
                    {c.isBlocked ? (
                      <span className="bg-[#A83232] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 inline-flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" /> BLOCKED
                      </span>
                    ) : (
                      <span className="bg-[#2E6B44] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 inline-flex items-center">
                        <ShieldCheck className="w-3 h-3 mr-1" /> VERIFIED
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="px-2.5 py-1.5 border border-[#E5E5E2] hover:border-[#111111] text-[11px] font-semibold uppercase tracking-wider inline-flex items-center"
                    >
                      Profile <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Link>
                    <button
                      onClick={() => handleToggleBlock(c.id, c.isBlocked || false)}
                      disabled={actionId === c.id}
                      className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                        c.isBlocked
                          ? "bg-[#2E6B44] text-white border-[#2E6B44]"
                          : "bg-[#A83232]/10 border-[#A83232] text-[#A83232] hover:bg-[#A83232] hover:text-white"
                      }`}
                    >
                      {c.isBlocked ? "Unblock" : "Block"}
                    </button>
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
