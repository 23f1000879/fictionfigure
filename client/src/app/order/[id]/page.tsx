"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { CheckCircle2, Clock, Package, Truck, ArrowLeft, Loader2, AlertCircle, ShoppingBag, ShieldCheck } from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;

    const token = localStorage.getItem("fictionfigure_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch(`${API_BASE}/checkout/orders/${orderId}`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || "Order not found.");
        }
      })
      .catch(() => setError("Failed to load order details."))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-xs text-[#6B6B6B] space-y-2">
        <Loader2 className="w-6 h-6 animate-spin text-[#111111]" />
        <span>Loading your order confirmation...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-12 sm:my-20 p-6 sm:p-8 bg-white border border-[#E5E5E2] text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-[#A83232] mx-auto" />
        <h2 className="text-base font-semibold text-[#111111]">Order Not Found</h2>
        <p className="text-xs text-[#6B6B6B]">{error || "The requested order could not be located or you do not have permission to view it."}</p>
        <Link
          href="/shop"
          className="inline-block px-6 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  const primaryPayment = order.payments?.[0];
  const isUpi = primaryPayment?.paymentMethod === "UPI";
  const isCod = primaryPayment?.paymentMethod === "COD";
  const isPaymentPaid = primaryPayment?.status === "PAID";
  const isPaymentFailed = primaryPayment?.status === "FAILED";

  // Dynamic Status Banner Mapping
  const getStatusBanner = () => {
    if (order.status === "CANCELLED") {
      return {
        title: "ORDER CANCELLED",
        subtitle: "This order has been cancelled.",
        bg: "bg-[#A83232]/10 border-[#A83232] text-[#A83232]",
        icon: <AlertCircle className="w-5 h-5 shrink-0" />,
      };
    }

    if (order.status === "DELIVERED") {
      return {
        title: "ORDER DELIVERED",
        subtitle: "Your order has been delivered.",
        bg: "bg-[#2E6B44]/10 border-[#2E6B44] text-[#2E6B44]",
        icon: <CheckCircle2 className="w-5 h-5 shrink-0" />,
      };
    }

    if (order.status === "SHIPPED") {
      return {
        title: "ORDER SHIPPED & ON THE WAY",
        subtitle: "Your order is on the way.",
        bg: "bg-[#2E6B44]/10 border-[#2E6B44] text-[#2E6B44]",
        icon: <Truck className="w-5 h-5 shrink-0" />,
      };
    }

    if (order.status === "PROCESSING" || (isUpi && isPaymentPaid)) {
      return {
        title: "ORDER VERIFIED & BEING PREPARED",
        subtitle: "Your payment has been verified and your order is being processed.",
        bg: "bg-[#2E6B44]/10 border-[#2E6B44] text-[#2E6B44]",
        icon: <Package className="w-5 h-5 shrink-0" />,
      };
    }

    if (isUpi) {
      return {
        title: "ORDER PLACED — PAYMENT VERIFICATION PENDING",
        subtitle: "Your payment details have been submitted and are awaiting verification.",
        bg: "bg-[#B86E00]/10 border-[#B86E00] text-[#B86E00]",
        icon: <Clock className="w-5 h-5 shrink-0" />,
      };
    }

    return {
      title: "ORDER PLACED — CASH ON DELIVERY",
      subtitle: "Your order has been received. Please keep cash ready when your shipment arrives at your doorstep.",
      bg: "bg-[#111111]/10 border-[#111111] text-[#111111]",
      icon: <Clock className="w-5 h-5 shrink-0" />,
    };
  };

  const banner = getStatusBanner();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12 text-[#111111] space-y-6 sm:space-y-8 box-border overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-[#E5E5E2] pb-6">
        <Link href="/shop" className="p-2 border border-[#E5E5E2] hover:border-[#111111] min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 text-[#111111]" />
        </Link>
        <div className="min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Order Confirmation Receipt
          </span>
          <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-[#111111] truncate">
            Order #{order.orderNumber}
          </h1>
          <span className="text-xs text-[#6B6B6B] font-mono block mt-0.5">
            Placed on {formatDate(order.createdAt)}
          </span>
        </div>
      </div>

      {/* Dynamic Status Banner */}
      <div className={`p-4 sm:p-5 border flex items-start space-x-3 ${banner.bg}`}>
        {banner.icon}
        <div className="min-w-0">
          <h4 className="font-bold text-xs uppercase tracking-wider leading-snug">{banner.title}</h4>
          <p className="text-xs mt-0.5 leading-relaxed">{banner.subtitle}</p>
        </div>
      </div>

      {/* Order Details & Address Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-[#E5E5E2] p-5 sm:p-6 text-xs">
        {/* Shipping Address */}
        <div className="space-y-2 min-w-0">
          <span className="text-[#6B6B6B] font-semibold uppercase tracking-wider text-[11px] block border-b border-[#E5E5E2] pb-2">
            Shipping Address
          </span>
          <p className="font-semibold text-[#111111] truncate">{order.shippingAddress?.fullName || "Collector"}</p>
          <p className="text-[#6B6B6B] break-words">{order.shippingAddress?.streetAddress}</p>
          {order.shippingAddress?.apartment && <p className="text-[#6B6B6B] break-words">{order.shippingAddress.apartment}</p>}
          <p className="text-[#6B6B6B]">
            {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
          </p>
          <p className="text-[#6B6B6B]">{order.shippingAddress?.country || "India"}</p>
          {order.shippingAddress?.phone && <p className="font-mono text-[#111111] pt-1">Phone: {order.shippingAddress.phone}</p>}
        </div>

        {/* Payment & Tracking Status */}
        <div className="space-y-3 min-w-0">
          <span className="text-[#6B6B6B] font-semibold uppercase tracking-wider text-[11px] block border-b border-[#E5E5E2] pb-2">
            Fulfillment & Payment
          </span>

          <div className="space-y-1">
            <span className="text-[#6B6B6B] text-[11px] uppercase block">Payment Method:</span>
            <span className="font-semibold text-[#111111] block">
              {isCod ? "Cash on Delivery (COD)" : "UPI Payment"}
            </span>
          </div>

          {isUpi && primaryPayment?.utr && (
            <div className="space-y-1">
              <span className="text-[#6B6B6B] text-[11px] uppercase block">Submitted UTR Reference:</span>
              <span className="font-mono font-bold text-[#111111] bg-[#F0F0ED] px-2 py-0.5 border border-[#E5E5E2] inline-block max-w-full truncate">
                {primaryPayment.utr}
              </span>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[#6B6B6B] text-[11px] uppercase block">Payment Status:</span>
            {isCod ? (
              <span className="inline-block px-2.5 py-1 bg-[#111111] text-white text-[10px] uppercase font-bold tracking-wider">
                PAYMENT DUE ON DELIVERY
              </span>
            ) : isPaymentPaid ? (
              <span className="inline-block px-2.5 py-1 bg-[#2E6B44] text-white text-[10px] uppercase font-bold tracking-wider">
                PAID
              </span>
            ) : isPaymentFailed ? (
              <span className="inline-block px-2.5 py-1 bg-[#A83232] text-white text-[10px] uppercase font-bold tracking-wider">
                PAYMENT FAILED
              </span>
            ) : (
              <span className="inline-block px-2.5 py-1 bg-[#B86E00] text-white text-[10px] uppercase font-bold tracking-wider">
                PAYMENT VERIFICATION PENDING
              </span>
            )}
          </div>

          <div className="space-y-1 pt-1">
            <span className="text-[#6B6B6B] text-[11px] uppercase block">Tracking Reference:</span>
            {order.trackingNumber ? (
              <span className="font-mono font-bold text-[#111111] block">TRK: {order.trackingNumber}</span>
            ) : (
              <span className="text-[#6B6B6B] italic block text-[11px]">
                Tracking information will be available after your order is shipped.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Purchased Items List */}
      <div className="bg-white border border-[#E5E5E2] p-5 sm:p-6 space-y-4 text-xs">
        <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-3">
          Order Items ({order.items?.length || 0})
        </h3>

        <div className="space-y-4 divide-y divide-[#E5E5E2]">
          {order.items?.map((item: any) => (
            <div key={item.id} className="pt-4 first:pt-0 flex space-x-3.5 items-center min-w-0">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-[#F0F0ED] shrink-0 border border-[#E5E5E2]">
                {item.image ? (
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-[#6B6B6B]">
                    No Image
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h5 className="font-semibold text-[#111111] leading-snug break-words">{item.title}</h5>
                <p className="text-[10px] text-[#6B6B6B] font-mono">SKU: {item.sku}</p>
                <p className="text-[11px] text-[#6B6B6B]">Qty: {item.quantity} × {formatPrice(item.price)}</p>
              </div>
              <span className="font-mono font-semibold text-[#111111] shrink-0">
                {formatPrice(item.total)}
              </span>
            </div>
          ))}
        </div>

        {/* Financial Breakdown */}
        <div className="pt-4 border-t border-[#E5E5E2] space-y-2 text-xs w-full sm:max-w-xs sm:ml-auto">
          <div className="flex justify-between text-[#6B6B6B]">
            <span>Subtotal</span>
            <span className="font-mono text-[#111111]">{formatPrice(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-[#2E6B44]">
              <span>Discount {order.coupon?.code ? `(${order.coupon.code})` : ""}</span>
              <span className="font-mono">-{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-[#6B6B6B]">
            <span>Shipping ({order.shippingMethod || "Standard"})</span>
            <span className="font-mono text-[#111111]">
              {order.shippingAmount === 0 ? "FREE" : formatPrice(order.shippingAmount)}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-[#E5E5E2] text-sm font-semibold">
            <span className="uppercase text-xs tracking-wider">Grand Total</span>
            <span className="font-mono text-[#111111]">{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
        <Link
          href="/shop"
          className="w-full sm:w-auto min-h-[44px] px-8 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors text-center flex items-center justify-center"
        >
          <ShoppingBag className="w-4 h-4 mr-2" /> Continue Shopping
        </Link>

        <Link
          href="/account/orders"
          className="w-full sm:w-auto min-h-[44px] px-6 py-3 border border-[#E5E5E2] hover:border-[#111111] text-xs font-semibold uppercase tracking-widest text-[#111111] text-center flex items-center justify-center"
        >
          View All Orders
        </Link>
      </div>
    </div>
  );
}
