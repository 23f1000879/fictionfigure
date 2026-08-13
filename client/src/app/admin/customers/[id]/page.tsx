"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Users, ShoppingBag, ShieldCheck, Phone, Mail, MapPin, AlertTriangle, CheckCircle2, Ban, Trash2 } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const getAdminHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fictionfigure_token") : "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchCustomerProfile = async () => {
    if (!customerId) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE}/admin/customers/${customerId}`, {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load customer profile.");
      if (data.customer) {
        setCustomer(data.customer);
      }
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "Failed to load customer profile.");
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerProfile();
  }, [customerId]);

  // Block / Unblock Customer Handler
  const handleToggleBlock = async () => {
    if (!customer) return;
    const isCurrentlyBlocked = Boolean(customer.isBlocked);
    const actionName = isCurrentlyBlocked ? "UNBLOCK" : "BLOCK";

    const confirmMsg = isCurrentlyBlocked
      ? `Unblock customer ${customer.name || customer.phone}? They will be able to log in and place orders.`
      : `Block customer ${customer.name || customer.phone}? Blocked customers cannot sign in or place orders.`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE}/admin/users/${customer.id}/block`, {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ blocked: !isCurrentlyBlocked }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${actionName.toLowerCase()} customer.`);

      setMessage(data.message || `Customer status updated to ${!isCurrentlyBlocked ? "BLOCKED" : "VERIFIED"}.`);
      fetchCustomerProfile();
    } catch (e: any) {
      setErrorMessage(e.message || `Failed to ${actionName.toLowerCase()} customer.`);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Customer Account Handler
  const handleDeleteCustomer = async () => {
    if (!customer) return;

    if (customer.orderCount > 0) {
      alert(`This customer has ${customer.orderCount} existing order(s) and cannot be permanently deleted. You can block the account instead to disable access while keeping historical order records intact.`);
      return;
    }

    if (!window.confirm(`Delete customer ${customer.name || customer.phone}? This action is permanent and cannot be undone.`)) return;

    setActionLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE}/admin/users/${customer.id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete customer account.");
      }

      alert("Customer account deleted successfully.");
      router.push("/admin/customers");
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to delete customer account.");
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#6B6B6B]">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Loading customer profile...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <Link href="/admin/customers" className="inline-flex items-center text-xs text-[#6B6B6B] hover:text-[#111111]">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Customer Directory
        </Link>
        <div className="p-6 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold">
          {errorMessage || "Customer profile not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl text-[#111111]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E2] pb-4">
        <div className="flex items-center space-x-3">
          <Link href="/admin/customers" className="p-2 border border-[#E5E5E2] hover:border-[#111111] transition-colors">
            <ArrowLeft className="w-4 h-4 text-[#111111]" />
          </Link>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B] block">
              Collector Profile
            </span>
            <h1 className="text-xl font-semibold text-[#111111] tracking-tight">
              {customer.name}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleBlock}
            disabled={actionLoading}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-colors flex items-center space-x-1.5 ${
              customer.isBlocked
                ? "bg-[#2E6B44] text-white border-[#2E6B44] hover:bg-[#235434]"
                : "bg-[#A83232]/10 border-[#A83232] text-[#A83232] hover:bg-[#A83232] hover:text-white"
            }`}
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : customer.isBlocked ? (
              <>
                <ShieldCheck className="w-4 h-4 mr-1" />
                <span>UNBLOCK CUSTOMER</span>
              </>
            ) : (
              <>
                <Ban className="w-4 h-4 mr-1" />
                <span>BLOCK CUSTOMER</span>
              </>
            )}
          </button>

          <button
            onClick={handleDeleteCustomer}
            disabled={actionLoading}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider border border-[#E5E5E2] text-[#6B6B6B] hover:border-[#A83232] hover:text-[#A83232] transition-colors flex items-center space-x-1.5"
            title={customer.orderCount > 0 ? "Customer has order history and cannot be deleted" : "Delete customer"}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            <span>DELETE</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-[#2E6B44]/10 border border-[#2E6B44] text-[#2E6B44] text-xs font-semibold flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Collector Overview Metadata */}
      <div className="bg-white border border-[#E5E5E2] p-6 space-y-4 text-xs">
        <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-3">
          <h3 className="font-semibold uppercase tracking-wider text-[#111111]">
            Collector Information & Account Status
          </h3>
          {customer.isBlocked ? (
            <span className="bg-[#A83232] text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 inline-flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" /> BLOCKED ACCOUNT
            </span>
          ) : (
            <span className="bg-[#2E6B44] text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 inline-flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1" /> VERIFIED ACCOUNT
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-[#6B6B6B] uppercase block text-[10px]">Mobile Number</span>
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
              {customer.orderCount || 0} order(s)
            </span>
          </div>
          <div>
            <span className="text-[#6B6B6B] uppercase block text-[10px]">Total Lifetime Spending</span>
            <span className="font-mono font-bold text-sm text-[#111111] mt-0.5 block">
              {formatPrice(customer.totalSpent || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Saved Delivery Addresses */}
      {customer.addresses && customer.addresses.length > 0 && (
        <div className="bg-white border border-[#E5E5E2] p-6 space-y-3 text-xs">
          <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-3 flex items-center">
            <MapPin className="w-4 h-4 mr-1.5 text-[#6B6B6B]" /> Saved Delivery Addresses ({customer.addresses.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {customer.addresses.map((addr: any) => (
              <div key={addr.id} className="p-4 bg-[#F7F7F5] border border-[#E5E5E2] space-y-1">
                <span className="font-bold text-[#111111] block">{addr.fullName}</span>
                <span className="text-[#6B6B6B] block">{addr.streetAddress} {addr.apartment ? `, ${addr.apartment}` : ""}</span>
                <span className="text-[#6B6B6B] block">{addr.city}, {addr.state} — <span className="font-mono">{addr.postalCode}</span></span>
                <span className="text-[#6B6B6B] block">{addr.country}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E2]">
                {customer.orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-[#F7F7F5]">
                    <td className="p-4 font-mono font-semibold text-[#111111]">{o.orderNumber}</td>
                    <td className="p-4 text-[#6B6B6B]">{formatDate(o.createdAt)}</td>
                    <td className="p-4 font-mono font-semibold text-[#111111]">{formatPrice(o.totalAmount)}</td>
                    <td className="p-4 font-mono text-[#6B6B6B] uppercase">{o.paymentMethod || "N/A"} ({o.paymentStatus || "PENDING"})</td>
                    <td className="p-4">
                      <span className="bg-[#2E6B44] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="px-2.5 py-1 border border-[#E5E5E2] hover:border-[#111111] text-[10px] font-semibold uppercase tracking-wider"
                      >
                        View Order
                      </Link>
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
