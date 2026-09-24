"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { CheckCircle2, Clock, Package, Truck, ArrowLeft, Loader2, AlertCircle, ShoppingBag, ShieldCheck, Star } from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [httpStatus, setHttpStatus] = useState<number | null>(null);

  const getAuthHeader = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fictionfigure_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (!orderId) return;

    setLoading(true);
    setError("");
    setHttpStatus(null);

    const headers = getAuthHeader();

    // Single Authoritative Order Receipt Request
    fetch(`${API_BASE}/orders/${orderId}`, { headers })
      .then(async (res) => {
        setHttpStatus(res.status);
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.order) {
          setOrder(data.order);
        } else {
          throw new Error(data.error || "Order not found.");
        }
      })
      .catch((err: any) => setError(err.message || "Failed to load order receipt."))
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
    const isUnauth = httpStatus === 401;
    const isForbidden = httpStatus === 403;

    return (
      <div className="max-w-md mx-auto my-12 sm:my-20 p-6 sm:p-8 bg-white border border-[#E5E5E2] text-center space-y-4 shadow-sm">
        <AlertCircle className="w-8 h-8 text-[#A83232] mx-auto" />
        <h2 className="text-base font-bold text-[#111111] uppercase tracking-wider">
          {isUnauth ? "Authentication Required" : isForbidden ? "Access Restricted" : "Order Not Found"}
        </h2>
        <p className="text-xs text-[#6B6B6B] leading-relaxed">
          {isUnauth
            ? "Please sign in to view the confirmation receipt for this order."
            : isForbidden
            ? `Order #${orderId} belongs to a different customer account. Please sign in with the correct account.`
            : error || `Order #${orderId} could not be located in our system.`}
        </p>
        <div className="pt-2 flex justify-center space-x-3">
          {isUnauth ? (
            <Link
              href={`/login?redirect=/order/${orderId}`}
              className="px-6 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black transition-colors"
            >
              Sign In to Account
            </Link>
          ) : (
            <Link
              href="/shop"
              className="px-6 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black transition-colors"
            >
              Return to Shop
            </Link>
          )}
        </div>
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
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16 text-[#111111] space-y-8 box-border overflow-x-hidden">
      {/* Order Confirmed Hero Header */}
      <div className="text-center space-y-4 bg-white border border-[#E5E5E2] p-8 sm:p-12 rounded-lg shadow-2xs">
        <div className="w-16 h-16 bg-[#2E6B44]/10 border border-[#2E6B44]/20 rounded-full flex items-center justify-center mx-auto text-[#2E6B44]">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37] block mb-1">
            PURCHASE COMPLETE
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#111111]">
            ORDER CONFIRMED
          </h1>
          <p className="text-sm font-semibold text-[#111111] mt-1">
            Thank you for your order!
          </p>
          <p className="text-xs text-[#6B6B6B] mt-1 font-mono">
            Order Reference: <strong className="text-[#111111]">{order.orderNumber}</strong> • Placed on {formatDate(order.createdAt)}
          </p>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/shop"
            className="px-6 py-3 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest rounded-md hover:bg-[#D4AF37] hover:text-[#111111] transition-all"
          >
            CONTINUE SHOPPING →
          </Link>
          <Link
            href="/account/orders"
            className="px-6 py-3 bg-transparent border border-[#E5E5E2] text-[#111111] text-xs font-bold uppercase tracking-widest rounded-md hover:border-[#111111] transition-all"
          >
            VIEW ALL ORDERS
          </Link>
        </div>
      </div>

      {/* Dynamic Status Banner */}
      <div className={`p-4 sm:p-5 border rounded-lg flex items-start space-x-3 ${banner.bg}`}>
        {banner.icon}
        <div className="min-w-0">
          <h4 className="font-bold text-xs uppercase tracking-wider leading-snug">{banner.title}</h4>
          <p className="text-xs mt-0.5 leading-relaxed">{banner.subtitle}</p>
        </div>
      </div>

      {/* Order Details & Address Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-[#E5E5E2] p-6 text-xs rounded-lg shadow-2xs">
        {/* Shipping Address */}
        <div className="space-y-2 min-w-0">
          <span className="text-[#6B6B6B] font-bold uppercase tracking-widest text-[10px] block border-b border-[#E5E5E2] pb-2">
            SHIPPING ADDRESS
          </span>
          <p className="font-bold text-[#111111] truncate text-sm">{order.shippingAddress?.fullName || "Collector"}</p>
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
          <span className="text-[#6B6B6B] font-bold uppercase tracking-widest text-[10px] block border-b border-[#E5E5E2] pb-2">
            FULFILLMENT & PAYMENT
          </span>

          <div className="space-y-1">
            <span className="text-[#6B6B6B] text-[10px] font-bold uppercase block">Payment Method</span>
            <span className="font-semibold text-[#111111] block">
              {isCod ? "Cash on Delivery (COD)" : "UPI Payment"}
            </span>
          </div>

          {isUpi && primaryPayment?.utr && (
            <div className="space-y-1">
              <span className="text-[#6B6B6B] text-[10px] font-bold uppercase block">Submitted UTR Reference</span>
              <span className="font-mono font-bold text-[#111111] bg-[#F7F7F5] px-2.5 py-1 border border-[#E5E5E2] rounded-md inline-block max-w-full truncate">
                {primaryPayment.utr}
              </span>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[#6B6B6B] text-[10px] font-bold uppercase block">Payment Status</span>
            {isCod ? (
              <span className="inline-block px-2.5 py-1 bg-[#111111] text-white text-[10px] uppercase font-bold tracking-wider rounded-xs">
                PAYMENT DUE ON DELIVERY
              </span>
            ) : isPaymentPaid ? (
              <span className="inline-block px-2.5 py-1 bg-[#2E6B44] text-white text-[10px] uppercase font-bold tracking-wider rounded-xs">
                PAID
              </span>
            ) : isPaymentFailed ? (
              <span className="inline-block px-2.5 py-1 bg-[#A83232] text-white text-[10px] uppercase font-bold tracking-wider rounded-xs">
                PAYMENT FAILED
              </span>
            ) : (
              <span className="inline-block px-2.5 py-1 bg-[#B86E00] text-white text-[10px] uppercase font-bold tracking-wider rounded-xs">
                PAYMENT VERIFICATION PENDING
              </span>
            )}
          </div>

          <div className="space-y-1 pt-1">
            <span className="text-[#6B6B6B] text-[10px] font-bold uppercase block">Tracking Reference</span>
            {order.trackingNumber ? (
              <span className="font-mono font-bold text-[#111111] block">TRK: {order.trackingNumber}</span>
            ) : (
              <span className="text-[#6B6B6B] italic block text-[11px]">
                Tracking details will be provided once your order ships.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Purchased Items List */}
      <div className="bg-white border border-[#E5E5E2] p-6 space-y-4 text-xs rounded-lg shadow-2xs">
        <h3 className="font-bold uppercase tracking-widest text-[#111111] border-b border-[#E5E5E2] pb-3 text-xs">
          ORDER ITEMS ({order.items?.length || 0})
        </h3>

        <div className="space-y-4 divide-y divide-[#E5E5E2]">
          {order.items?.map((item: any) => {
            const isDelivered = order.status === "DELIVERED";
            const productTarget = item.productSlug || item.productId;

            return (
              <div key={item.id} className="pt-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                <div className="flex space-x-4 items-center min-w-0 flex-1">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-[#F7F7F5] shrink-0 border border-[#E5E5E2] rounded-md overflow-hidden p-1">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} fill className="object-contain p-1" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[#6B6B6B]">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h5 className="font-semibold text-[#111111] leading-snug break-words">{item.title}</h5>
                    {item.variantTitle && (
                      <p className="text-[11px] font-medium text-[#6B6B6B]">
                        Variant: <strong className="font-mono text-[#111111]">{item.variantTitle}</strong>
                      </p>
                    )}
                    {item.sku && <p className="text-[10px] text-[#6B6B6B] font-mono">SKU: {item.sku}</p>}
                    <p className="text-[11px] text-[#6B6B6B]">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F7F7F5]">
                  <span className="font-mono font-extrabold text-sm text-[#111111]">
                    {formatPrice(item.total)}
                  </span>

                  {isDelivered && productTarget && (
                    <Link
                      href={`/products/${productTarget}#reviews`}
                      className="px-3 py-1.5 bg-[#111111] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-[#111111] transition-colors inline-flex items-center space-x-1.5 shrink-0 rounded-md"
                    >
                      <Star className="w-3 h-3 fill-white text-white" />
                      <span>Write Review</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Financial Breakdown */}
        <div className="pt-4 border-t border-[#E5E5E2] space-y-2.5 text-xs w-full sm:max-w-xs sm:ml-auto">
          <div className="flex justify-between text-[#6B6B6B]">
            <span>Subtotal</span>
            <span className="font-mono text-[#111111] font-medium">{formatPrice(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-[#2E6B44] font-medium">
              <span>Discount {order.coupon?.code ? `(${order.coupon.code})` : ""}</span>
              <span className="font-mono">-{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-[#6B6B6B]">
            <span>Shipping ({order.shippingMethod || "Standard"})</span>
            <span className="font-mono text-[#111111] font-medium">
              {order.shippingAmount === 0 ? "FREE" : formatPrice(order.shippingAmount)}
            </span>
          </div>
          <div className="flex justify-between pt-3 border-t border-[#E5E5E2] text-sm font-extrabold text-[#111111]">
            <span className="uppercase text-xs tracking-wider">GRAND TOTAL</span>
            <span className="font-mono text-base">{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
