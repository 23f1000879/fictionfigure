"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { CheckCircle2, Clock, Package, Truck, ArrowLeft, Loader2, AlertCircle, ShoppingBag, ShieldCheck, Star } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";

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
      <>
        <Header />
        <SearchModal />
        <CartDrawer />
        <main className="min-h-[60vh] flex flex-col items-center justify-center text-xs text-[#9A9DA5] space-y-2 py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#F7F7F5]" />
          <span>Loading your order confirmation...</span>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !order) {
    const isUnauth = httpStatus === 401;
    const isForbidden = httpStatus === 403;

    return (
      <>
        <Header />
        <SearchModal />
        <CartDrawer />
        <main className="w-full max-w-md mx-auto my-12 sm:my-20 p-6 sm:p-8 bg-[#111318] border border-white/[0.08] rounded-2xl text-center space-y-4 shadow-sm min-h-[50vh]">
          <AlertCircle className="w-8 h-8 text-rose-300 mx-auto" />
          <h2 className="text-base font-bold text-[#F7F7F5] uppercase tracking-wider">
            {isUnauth ? "Authentication Required" : isForbidden ? "Access Restricted" : "Order Not Found"}
          </h2>
          <p className="text-xs text-[#9A9DA5] leading-relaxed">
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
                className="px-6 py-3 bg-[#F5C518] text-[#08090B] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#FFD43B] transition-colors min-h-[44px] flex items-center"
              >
                Sign In to Account
              </Link>
            ) : (
              <Link
                href="/shop"
                className="px-6 py-3 bg-[#F5C518] text-[#08090B] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#FFD43B] transition-colors min-h-[44px] flex items-center"
              >
                Return to Shop
              </Link>
            )}
          </div>
        </main>
        <Footer />
      </>
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
        bg: "bg-rose-500/10 border-rose-500/40 text-rose-300",
        icon: <AlertCircle className="w-5 h-5 shrink-0" />,
      };
    }

    if (order.status === "DELIVERED") {
      return {
        title: "ORDER DELIVERED",
        subtitle: "Your order has been delivered.",
        bg: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
        icon: <CheckCircle2 className="w-5 h-5 shrink-0" />,
      };
    }

    if (order.status === "SHIPPED") {
      return {
        title: "ORDER SHIPPED & ON THE WAY",
        subtitle: "Your order is on the way.",
        bg: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
        icon: <Truck className="w-5 h-5 shrink-0" />,
      };
    }

    if (order.status === "PROCESSING" || (isUpi && isPaymentPaid)) {
      return {
        title: "ORDER VERIFIED & BEING PREPARED",
        subtitle: "Your payment has been verified and your order is being processed.",
        bg: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
        icon: <Package className="w-5 h-5 shrink-0" />,
      };
    }

    if (isUpi) {
      return {
        title: "ORDER PLACED — PAYMENT VERIFICATION PENDING",
        subtitle: "Your payment details have been submitted and are awaiting verification.",
        bg: "bg-[#B86E00]/10 border-[#B86E00] text-[#F5C518]",
        icon: <Clock className="w-5 h-5 shrink-0" />,
      };
    }

    return {
      title: "ORDER PLACED — CASH ON DELIVERY",
      subtitle: "Your order has been received. Please keep cash ready when your shipment arrives at your doorstep.",
      bg: "bg-[#F5C518]/10 border-[#F5C518] text-[#F7F7F5]",
      icon: <Clock className="w-5 h-5 shrink-0" />,
    };
  };

  const banner = getStatusBanner();

  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16 text-foreground space-y-6 sm:space-y-8 box-border overflow-x-hidden min-h-[70vh]">
        {/* Order Confirmed Hero Header */}
        <div className="text-center space-y-4 bg-[#111318] border border-white/[0.08] p-8 sm:p-12 rounded-2xl shadow-2xs">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/40/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37] block mb-1">
              PURCHASE COMPLETE
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#F7F7F5]">
              ORDER CONFIRMED
            </h1>
            <p className="text-sm font-semibold text-[#F7F7F5] mt-1">
              Thank you for your order!
            </p>
            <p className="text-xs text-[#9A9DA5] mt-1 font-mono">
              Order Reference: <strong className="text-[#F7F7F5]">{order.orderNumber}</strong> • Placed on {formatDate(order.createdAt)}
            </p>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/shop"
              className="px-6 py-3 bg-[#F5C518] text-[#08090B] text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#FFD43B] transition-all min-h-[44px] flex items-center justify-center"
            >
              CONTINUE SHOPPING →
            </Link>
            <Link
              href="/account/orders"
              className="px-6 py-3 bg-transparent border border-white/[0.08] text-[#F7F7F5] text-xs font-bold uppercase tracking-widest rounded-lg hover:border-white/30 transition-all min-h-[44px] flex items-center justify-center"
            >
              VIEW ALL ORDERS
            </Link>
          </div>
        </div>

        {/* Dynamic Status Banner */}
        <div className={`p-4 sm:p-5 border rounded-xl flex items-start space-x-3 ${banner.bg}`}>
          {banner.icon}
          <div className="min-w-0">
            <h4 className="font-bold text-xs uppercase tracking-wider leading-snug">{banner.title}</h4>
            <p className="text-xs mt-0.5 leading-relaxed">{banner.subtitle}</p>
          </div>
        </div>

        {/* Order Details & Address Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#111318] border border-white/[0.08] p-6 sm:p-8 text-xs rounded-2xl shadow-2xs">
          {/* Shipping Address */}
          <div className="space-y-2 min-w-0">
            <span className="text-[#9A9DA5] font-bold uppercase tracking-widest text-[10px] block border-b border-white/[0.08] pb-2">
              SHIPPING ADDRESS
            </span>
            <p className="font-bold text-[#F7F7F5] truncate text-sm">{order.shippingAddress?.fullName || "Collector"}</p>
            <p className="text-[#9A9DA5] break-words">{order.shippingAddress?.streetAddress}</p>
            {order.shippingAddress?.apartment && <p className="text-[#9A9DA5] break-words">{order.shippingAddress.apartment}</p>}
            <p className="text-[#9A9DA5]">
              {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
            </p>
            <p className="text-[#9A9DA5]">{order.shippingAddress?.country || "India"}</p>
            {order.shippingAddress?.phone && <p className="font-mono text-[#F7F7F5] pt-1">Phone: {order.shippingAddress.phone}</p>}
          </div>

          {/* Payment & Tracking Status */}
          <div className="space-y-3 min-w-0">
            <span className="text-[#9A9DA5] font-bold uppercase tracking-widest text-[10px] block border-b border-white/[0.08] pb-2">
              FULFILLMENT & PAYMENT
            </span>

            <div className="space-y-1">
              <span className="text-[#9A9DA5] text-[10px] font-bold uppercase block">Payment Method</span>
              <span className="font-semibold text-[#F7F7F5] block">
                {isCod ? "Cash on Delivery (COD)" : "UPI Payment"}
              </span>
            </div>

            {isUpi && primaryPayment?.utr && (
              <div className="space-y-1">
                <span className="text-[#9A9DA5] text-[10px] font-bold uppercase block">Submitted UTR Reference</span>
                <span className="font-mono font-bold text-[#F7F7F5] bg-[#17191F] px-2.5 py-1 border border-white/[0.08] rounded-lg inline-block max-w-full truncate">
                  {primaryPayment.utr}
                </span>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[#9A9DA5] text-[10px] font-bold uppercase block">Payment Status</span>
              {isCod ? (
                <span className="inline-block px-2.5 py-0.5 bg-[#F5C518] text-[#08090B] text-[10px] uppercase font-bold tracking-wider rounded-md">
                  PAYMENT DUE ON DELIVERY
                </span>
              ) : isPaymentPaid ? (
                <span className="inline-block px-2.5 py-0.5 bg-emerald-500/15 text-emerald-300 text-[10px] uppercase font-bold tracking-wider rounded-md">
                  PAID
                </span>
              ) : isPaymentFailed ? (
                <span className="inline-block px-2.5 py-0.5 bg-rose-500/15 text-rose-300 text-[10px] uppercase font-bold tracking-wider rounded-md">
                  PAYMENT FAILED
                </span>
              ) : (
                <span className="inline-block px-2.5 py-0.5 bg-[#F5C518]/15 text-[#F5C518] text-[10px] uppercase font-bold tracking-wider rounded-md">
                  PAYMENT VERIFICATION PENDING
                </span>
              )}
            </div>

            <div className="space-y-1 pt-1">
              <span className="text-[#9A9DA5] text-[10px] font-bold uppercase block">Tracking Reference</span>
              {order.trackingNumber ? (
                <span className="font-mono font-bold text-[#F7F7F5] block break-words">TRK: {order.trackingNumber}</span>
              ) : (
                <span className="text-[#9A9DA5] italic block text-[11px] leading-relaxed">
                  Tracking details will be provided once your order ships.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Purchased Items List */}
        <div className="bg-[#111318] border border-white/[0.08] p-6 sm:p-8 space-y-4 text-xs rounded-2xl shadow-2xs">
          <h3 className="font-bold uppercase tracking-widest text-[#F7F7F5] border-b border-white/[0.08] pb-3 text-xs">
            ORDER ITEMS ({order.items?.length || 0})
          </h3>

          <div className="space-y-4 divide-y divide-white/[0.06]/80">
            {order.items?.map((item: any) => {
              const isDelivered = order.status === "DELIVERED";
              const productTarget = item.productSlug || item.productId;

              return (
                <div key={item.id} className="pt-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                  <div className="flex space-x-4 items-center min-w-0 flex-1">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-[#17191F] shrink-0 border border-white/[0.08] rounded-xl overflow-hidden p-1">
                      {item.image ? (
                        <Image src={item.image} alt={item.title} fill className="object-contain p-1" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[#9A9DA5]">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <h5 className="font-semibold text-[#F7F7F5] leading-snug break-words">{item.title}</h5>
                      {item.variantTitle && (
                        <p className="text-[11px] font-medium text-[#9A9DA5]">
                          Variant: <strong className="font-mono text-[#F7F7F5]">{item.variantTitle}</strong>
                        </p>
                      )}
                      {item.sku && <p className="text-[10px] text-[#9A9DA5] font-mono">SKU: {item.sku}</p>}
                      <p className="text-[11px] text-[#9A9DA5]">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F7F7F5]">
                    <span className="font-mono font-extrabold text-sm text-[#F7F7F5]">
                      {formatPrice(item.total)}
                    </span>

                    {isDelivered && productTarget && (
                      <Link
                        href={`/products/${productTarget}#reviews`}
                        className="px-3.5 py-2 bg-[#F5C518] text-[#08090B] text-[10px] font-bold uppercase tracking-wider hover:bg-[#FFD43B] transition-colors inline-flex items-center space-x-1.5 shrink-0 rounded-lg min-h-[36px]"
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
          <div className="pt-4 border-t border-white/[0.08] space-y-2.5 text-xs w-full sm:max-w-xs sm:ml-auto">
            <div className="flex justify-between text-[#9A9DA5]">
              <span>Subtotal</span>
              <span className="font-mono text-[#F7F7F5] font-medium">{formatPrice(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Discount {order.coupon?.code ? `(${order.coupon.code})` : ""}</span>
                <span className="font-mono">-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#9A9DA5]">
              <span>Shipping ({order.shippingMethod || "Standard"})</span>
              <span className="font-mono text-[#F7F7F5] font-medium">
                {order.shippingAmount === 0 ? "FREE" : formatPrice(order.shippingAmount)}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-white/[0.08] text-sm font-extrabold text-[#F7F7F5]">
              <span className="uppercase text-xs tracking-wider">GRAND TOTAL</span>
              <span className="font-mono text-base">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
