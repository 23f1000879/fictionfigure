"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Truck, PackageCheck, Loader2 } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState<string>("PENDING");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (orderId) {
      fetch(`${API_BASE}/admin/orders/${orderId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.order) {
            setOrder(data.order);
            setStatus(data.order.status || "PENDING");
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [orderId]);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`${API_BASE}/admin/orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order?.id || orderId, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update order status");

      setStatus(newStatus);
      if (order) setOrder({ ...order, status: newStatus });
      setMessage(`Order status successfully updated to ${newStatus}`);
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-[#6B6B6B]">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Loading order details...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl text-[#111111]">
      <div className="flex items-center space-x-3 border-b border-[#E5E5E2] pb-4">
        <Link href="/admin/orders" className="p-2 border border-[#E5E5E2] hover:border-[#111111]">
          <ArrowLeft className="w-4 h-4 text-[#111111]" />
        </Link>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Fulfillment Console
          </span>
          <h1 className="text-xl font-semibold text-[#111111] tracking-tight">
            Order Status Management {order ? `(${order.orderNumber})` : ""}
          </h1>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-[#2E6B44]/10 border border-[#2E6B44] text-[#2E6B44] text-xs font-semibold flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Status Transition Control Box */}
      <div className="bg-white border border-[#E5E5E2] p-6 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#111111]">
          Update Fulfillment Status Timeline
        </h3>
        <div className="flex flex-wrap gap-3">
          {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => handleStatusChange(st)}
              disabled={isUpdating}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border transition-all flex items-center space-x-1.5 ${
                status === st
                  ? "bg-[#111111] text-white border-[#111111]"
                  : "bg-[#F7F7F5] text-[#6B6B6B] border-[#E5E5E2] hover:border-[#111111] hover:text-[#111111]"
              }`}
            >
              {isUpdating && status === st && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              <span>{st}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Payment Verification Actions (UPI / UTR / COD) */}
      {order && (
        <div className="bg-white border border-[#E5E5E2] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5E5E2] gap-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#111111]">
                Payment Verification & Security Console
              </h3>
              <span className="text-[11px] text-[#6B6B6B]">
                Method: <strong className="text-[#111111]">{order.payments?.[0]?.paymentMethod || "UPI"}</strong> | Status:{" "}
                <strong className={order.payments?.[0]?.status === "PAID" ? "text-[#2E6B44]" : "text-[#B86E00]"}>
                  {order.payments?.[0]?.status || "PENDING"}
                </strong>
              </span>
            </div>

            {order.payments?.[0]?.transactionRef && (
              <div className="bg-[#F7F7F5] border border-[#E5E5E2] px-3 py-1.5 font-mono text-xs text-[#111111]">
                UTR: <strong>{order.payments[0].transactionRef}</strong>
              </div>
            )}
          </div>

          {order.payments?.[0]?.status !== "PAID" && (
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={async () => {
                  if (confirm(`Confirm receipt of ${formatPrice(order.totalAmount)} for UTR: ${order.payments?.[0]?.transactionRef || "N/A"}?`)) {
                    setIsUpdating(true);
                    try {
                      const res = await fetch(`${API_BASE}/admin/orders/${order.id}/verify-payment`, { method: "PATCH" });
                      const data = await res.json();
                      if (res.ok) {
                        setOrder(data.order);
                        setStatus("PROCESSING");
                        setMessage("Payment verified successfully. Stock decremented & order processing started.");
                      } else {
                        setError(data.error || "Failed to verify payment.");
                      }
                    } catch (e: any) {
                      setError(e.message || "Failed to verify payment.");
                    } finally {
                      setIsUpdating(false);
                    }
                  }
                }}
                disabled={isUpdating}
                className="px-6 py-3 bg-[#2E6B44] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#235434] transition-colors"
              >
                Verify Payment
              </button>

              <button
                onClick={async () => {
                  if (confirm("Reject payment and cancel order?")) {
                    setIsUpdating(true);
                    try {
                      const res = await fetch(`${API_BASE}/admin/orders/${order.id}/reject-payment`, { method: "PATCH" });
                      const data = await res.json();
                      if (res.ok) {
                        setOrder(data.order);
                        setStatus("CANCELLED");
                        setMessage("Payment rejected and order cancelled.");
                      } else {
                        setError(data.error || "Failed to reject payment.");
                      }
                    } catch (e: any) {
                      setError(e.message || "Failed to reject payment.");
                    } finally {
                      setIsUpdating(false);
                    }
                  }
                }}
                disabled={isUpdating}
                className="px-6 py-3 bg-[#A83232] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#852727] transition-colors"
              >
                Reject Payment
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order Details Overview */}
      {order && (
        <div className="bg-white border border-[#E5E5E2] p-6 space-y-4 text-xs">
          <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-3">
            Order Metadata & Customer Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[#6B6B6B] uppercase block">Order Date</span>
              <span className="font-mono font-semibold text-[#111111]">{formatDate(order.createdAt)}</span>
            </div>
            <div>
              <span className="text-[#6B6B6B] uppercase block">Total Amount</span>
              <span className="font-mono font-semibold text-[#111111]">{formatPrice(order.totalAmount)}</span>
            </div>
            <div>
              <span className="text-[#6B6B6B] uppercase block">Customer Identity</span>
              <span className="font-semibold text-[#111111]">
                {order.user ? `${order.user.firstName} ${order.user.lastName}` : "Guest Collector"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
