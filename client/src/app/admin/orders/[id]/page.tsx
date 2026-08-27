"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, Clock, Truck, Package, Loader2, AlertCircle, MapPin, Tag } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { API_BASE, adminFetch } from "@/lib/api";

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchOrderDetails = () => {
    if (!orderId) return;

    setIsLoading(true);
    adminFetch(`${API_BASE}/admin/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.order) {
          setOrder(data.order);
          setStatus(data.order.status || "PENDING");
        } else {
          setError(data.error || "Order not found.");
        }
      })
      .catch((err: any) => setError(err.message || "Failed to load order details."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    setMessage("");
    setError("");

    try {
      const res = await adminFetch(`${API_BASE}/admin/orders`, {
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

  if (error && !order) {
    return (
      <div className="p-8 bg-white border border-[#E5E5E2] text-center space-y-4 max-w-md mx-auto my-12 text-xs">
        <AlertCircle className="w-8 h-8 text-[#A83232] mx-auto" />
        <h2 className="text-base font-semibold text-[#111111]">Order Not Found</h2>
        <p className="text-[#6B6B6B]">{error}</p>
        <Link
          href="/admin/orders"
          className="inline-block px-6 py-2.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider"
        >
          Return to Orders
        </Link>
      </div>
    );
  }

  const items = order?.formattedItems || order?.items || [];
  const primaryPayment = order?.payments?.[0];
  const isCod = primaryPayment?.paymentMethod === "COD";
  const isUpi = primaryPayment?.paymentMethod === "UPI";
  const isPaid = primaryPayment?.status === "PAID";
  const shippingAddr = order?.shippingAddress || {};

  // Financial Breakdown calculations
  const subtotal = order?.subtotal || items.reduce((acc: number, item: any) => acc + (item.total || item.price * item.quantity), 0);
  const discountAmount = order?.discountAmount || 0;
  const shippingAmount = order?.shippingAmount || 0;
  const codFee = 0; // COD Handling Fee REMOVED
  const grandTotal = order?.totalAmount || Math.max(0, subtotal - discountAmount + shippingAmount);

  return (
    <div className="space-y-6 max-w-4xl text-[#111111] font-sans">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-[#E5E5E2] pb-4">
        <Link href="/admin/orders" className="p-2 border border-[#E5E5E2] hover:border-[#111111] shrink-0">
          <ArrowLeft className="w-4 h-4 text-[#111111]" />
        </Link>
        <div className="min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Fulfillment Console
          </span>
          <h1 className="text-lg sm:text-xl font-semibold text-[#111111] tracking-tight truncate">
            Order Status Management {order ? `(${order.orderNumber})` : ""}
          </h1>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-[#2E6B44]/10 border border-[#2E6B44] text-[#2E6B44] text-xs font-semibold flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. STATUS TRANSITION CONTROL BOX */}
      <div className="bg-white border border-[#E5E5E2] p-5 sm:p-6 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#111111]">
          1. Update Fulfillment Status Timeline
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => handleStatusChange(st)}
              disabled={isUpdating}
              className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider border transition-all flex items-center space-x-1.5 ${
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

      {/* 2. MANUAL PAYMENT VERIFICATION & SECURITY CONSOLE */}
      {order && (
        <div className="bg-white border border-[#E5E5E2] p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5E5E2] gap-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#111111]">
                2. Payment Verification & Security Console
              </h3>
              <span className="text-[11px] text-[#6B6B6B] block mt-1">
                Method: <strong className="text-[#111111]">{isCod ? "Cash on Delivery (COD)" : "UPI Payment"}</strong> | Status:{" "}
                <strong className={isPaid ? "text-[#2E6B44]" : isCod ? "text-[#111111]" : "text-[#B86E00]"}>
                  {isCod && !isPaid ? "PAYMENT DUE ON DELIVERY" : (primaryPayment?.status || "PENDING")}
                </strong>
              </span>
            </div>

            {primaryPayment?.transactionRef && (
              <div className="bg-[#F7F7F5] border border-[#E5E5E2] px-3 py-1.5 font-mono text-xs text-[#111111] shrink-0 self-start sm:self-auto max-w-full overflow-hidden">
                UTR: <strong className="break-all">{primaryPayment.transactionRef}</strong>
              </div>
            )}
          </div>

          {!isPaid && (
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={async () => {
                  if (confirm(`Confirm receipt of ${formatPrice(order.totalAmount)} for UTR: ${primaryPayment?.transactionRef || "N/A"}?`)) {
                    setIsUpdating(true);
                    try {
                      const res = await adminFetch(`${API_BASE}/admin/orders/${order.id}/verify-payment`, {
                        method: "PATCH",
                      });
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
                className="px-6 py-2.5 bg-[#2E6B44] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#235434] transition-colors"
              >
                Verify Payment
              </button>

              <button
                onClick={async () => {
                  if (confirm("Reject payment and cancel order?")) {
                    setIsUpdating(true);
                    try {
                      const res = await adminFetch(`${API_BASE}/admin/orders/${order.id}/reject-payment`, {
                        method: "PATCH",
                      });
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
                className="px-6 py-2.5 bg-[#A83232] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#852727] transition-colors"
              >
                Reject Payment
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. ORDER ITEMS & PRODUCT DETAILS SECTION */}
      {order && (
        <div className="bg-white border border-[#E5E5E2] p-5 sm:p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#111111]">
              3. Order Items ({items.length})
            </h3>
            <span className="text-[11px] text-[#6B6B6B] font-mono font-medium">
              Authoritative Inventory Record
            </span>
          </div>

          {/* Purchased Products List */}
          <div className="space-y-4 divide-y divide-[#E5E5E2]">
            {items.map((item: any) => {
              const itemTitle = item.productName || item.title;
              const variantTitle = item.variantTitle || (item.title !== itemTitle ? item.title : null);

              return (
                <div key={item.id} className="pt-4 first:pt-0 flex space-x-3.5 sm:space-x-4 items-center min-w-0">
                  {/* Product Image */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-[#F7F7F5] shrink-0 border border-[#E5E5E2] p-1 flex items-center justify-center">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={itemTitle}
                        fill
                        className="object-contain p-1"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-[#6B6B6B] opacity-40" />
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="min-w-0 flex-1 space-y-1 text-xs">
                    {item.categoryName && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#6B6B6B] block">
                        {item.categoryName}
                      </span>
                    )}
                    <h4 className="font-bold text-[#111111] leading-snug break-words">
                      {itemTitle}
                    </h4>
                    {variantTitle && (
                      <span className="text-[11px] font-medium text-[#6B6B6B] block">
                        Edition / Variant: <strong className="text-[#111111]">{variantTitle}</strong>
                      </span>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6B6B6B] pt-0.5">
                      <span>SKU: <strong className="font-mono text-[#111111]">{item.sku}</strong></span>
                      <span>•</span>
                      <span>Qty: <strong className="text-[#111111]">{item.quantity}</strong> × {formatPrice(item.price)}</span>
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-sm text-[#111111] block">
                      {formatPrice(item.total || item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Authoritative Financial Breakdown Box */}
          <div className="pt-4 border-t border-[#E5E5E2] space-y-2 text-xs w-full sm:max-w-xs sm:ml-auto">
            <div className="flex justify-between text-[#6B6B6B]">
              <span>Subtotal</span>
              <span className="font-mono text-[#111111]">{formatPrice(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-[#2E6B44]">
                <span>Discount {order.coupon?.code ? `(${order.coupon.code})` : ""}</span>
                <span className="font-mono">-{formatPrice(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-[#6B6B6B]">
              <span>Shipping & Delivery</span>
              <span className="font-mono text-[#111111]">
                {shippingAmount === 0 ? "FREE" : formatPrice(shippingAmount)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#E5E5E2] text-sm font-bold">
              <span className="uppercase text-xs tracking-wider">Total Amount</span>
              <span className="font-mono text-base text-[#111111]">{formatPrice(grandTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. DELIVERY ADDRESS SECTION */}
      {order && (
        <div className="bg-white border border-[#E5E5E2] p-5 sm:p-6 space-y-3 text-xs">
          <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-3 flex items-center">
            <MapPin className="w-4 h-4 mr-1.5 text-[#111111]" /> 4. Delivery Address
          </h3>

          <div className="space-y-1.5 leading-relaxed text-[#111111]">
            <p className="font-bold text-sm">
              {shippingAddr.fullName || (order.user ? `${order.user.firstName} ${order.user.lastName}` : "Collector")}
            </p>
            <p className="text-[#6B6B6B]">{shippingAddr.streetAddress || "No street address provided"}</p>
            {shippingAddr.apartment && <p className="text-[#6B6B6B]">{shippingAddr.apartment}</p>}
            <p className="text-[#6B6B6B]">
              {shippingAddr.city || "City"}, {shippingAddr.state || "State"} - <strong className="font-mono text-[#111111]">{shippingAddr.postalCode || "PIN Code"}</strong>
            </p>
            <p className="text-[#6B6B6B]">{shippingAddr.country || "India"}</p>
            {(shippingAddr.phone || order.user?.phone) && (
              <p className="font-mono font-bold text-[#111111] pt-1">
                Contact Phone: {shippingAddr.phone || order.user?.phone}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 5. ORDER METADATA & CUSTOMER INFORMATION SECTION */}
      {order && (
        <div className="bg-white border border-[#E5E5E2] p-5 sm:p-6 space-y-4 text-xs">
          <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-3">
            5. Order Metadata & Customer Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[#6B6B6B] uppercase block text-[10px] font-semibold">Order Date</span>
              <span className="font-mono font-semibold text-[#111111]">{formatDate(order.createdAt)}</span>
            </div>
            <div>
              <span className="text-[#6B6B6B] uppercase block text-[10px] font-semibold">Grand Total</span>
              <span className="font-mono font-bold text-[#111111]">{formatPrice(grandTotal)}</span>
            </div>
            <div>
              <span className="text-[#6B6B6B] uppercase block text-[10px] font-semibold">Customer Name</span>
              <span className="font-semibold text-[#111111]">
                {order.user ? `${order.user.firstName} ${order.user.lastName}` : shippingAddr.fullName || "Guest Collector"}
              </span>
            </div>
            <div>
              <span className="text-[#6B6B6B] uppercase block text-[10px] font-semibold">Account Identity</span>
              <span className="font-mono text-[11px] text-[#6B6B6B] truncate block">
                {order.user ? order.user.id.slice(0, 12) + "..." : "Guest"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
