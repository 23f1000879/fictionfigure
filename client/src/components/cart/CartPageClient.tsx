"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, Tag, ShoppingBag, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { formatPrice } from "@/lib/utils";
import { API_BASE } from "@/lib/api";
import { OrderTotals } from "@/components/checkout/OrderTotals";

export function CartPageClient() {
  const { cart, removeItem, updateQuantity, cartSubtotal, isHydrating, isValidating } = useCart();
  const { shippingFee, freeShippingThreshold } = useSettings();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    discountType: string;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsValidatingCoupon(true);
    setCouponError("");

    try {
      const res = await fetch(`${API_BASE}/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, cartSubtotal }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setAppliedCoupon(null);
        setCouponError(data.error || "Invalid coupon code");
      } else {
        setAppliedCoupon({
          code: data.coupon.code,
          discountAmount: data.discountAmount,
          discountType: data.coupon.discountType,
        });
        setCouponError("");
        setCouponCode("");
      }
    } catch (err) {
      setCouponError("Failed to validate coupon");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const shippingAmount = cartSubtotal >= freeShippingThreshold || cartSubtotal === 0 ? 0 : shippingFee;
  const finalTotal = Math.max(0, cartSubtotal - discountAmount + shippingAmount);

  if (isHydrating || isValidating) {
    return (
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <Loader2 className="w-8 h-8 text-[#F5C518] animate-spin mx-auto" />
        <p className="text-[12px] font-semibold text-[#9A9DA5] uppercase tracking-[0.14em]">Updating your bag…</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <section className="relative isolate overflow-hidden rounded-[16px] border border-white/[0.08] bg-[#0D0E12] my-6 lg:my-10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(245,197,24,0.12),transparent_60%)]" aria-hidden />
        <div className="py-16 sm:py-20 lg:py-24 px-6 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#F5C518]/10 border border-[#F5C518]/30 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-7 h-7 text-[#F5C518]" />
          </div>
          <p className="ff-eyebrow justify-center">Fiction Figures bag</p>
          <h1 className="mt-3 text-[30px] sm:text-[40px] font-black uppercase leading-[1] tracking-[-0.02em] text-white">
            Your collection is waiting.
          </h1>
          <p className="mt-4 text-[14px] sm:text-[15px] text-[#C9CBD1] leading-relaxed max-w-md mx-auto">
            Looks like you haven&apos;t added anything yet. Explore our curated collections of authentic scale figures and collectibles.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/collections" className="ff-btn ff-btn-gold w-full sm:w-auto">
              Explore collections <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/shop" className="ff-btn ff-btn-outline w-full sm:w-auto">
              Continue shopping
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6 lg:space-y-8 pb-12">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-5 border-b border-white/[0.08]">
        <div className="space-y-2">
          <p className="ff-eyebrow">Shopping bag</p>
          <h1 className="text-[30px] sm:text-[38px] font-extrabold leading-[1.05] tracking-[-0.02em] text-white">
            Your Bag
            <span className="ml-3 align-middle text-[14px] font-semibold text-[#9A9DA5] tracking-normal">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </h1>
        </div>
        <Link href="/shop" className="ff-link-arrow min-h-[44px]">
          <ArrowLeft className="w-3.5 h-3.5" /> Continue shopping
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Items */}
        <ul className="lg:col-span-8 space-y-3">
          {cart.map((item) => (
            <li
              key={item.variantId}
              className="rounded-[12px] border border-white/[0.08] bg-[#111318] p-3 sm:p-4 flex gap-4 items-center hover:border-white/15 transition-colors duration-200"
            >
              <div className="relative w-20 h-24 sm:w-24 sm:h-28 shrink-0 overflow-hidden rounded-[8px] bg-[radial-gradient(ellipse_at_50%_35%,#FFFFFF_0%,#F5F5F2_60%,#ECECE7_100%)] dark:bg-[radial-gradient(ellipse_at_50%_35%,#22242c_0%,#111318_60%,#0b0c0f_100%)] border border-white/[0.06]">
                {item.image && item.image.trim() !== "" ? (
                  <Image src={item.image} alt={item.title} fill sizes="96px" className="object-contain p-1" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-[#6E717A]">No image</div>
                )}
              </div>

              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-6 min-w-0 space-y-1">
                  {item.brand && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5C518]/90 block truncate">
                      {item.brand}
                    </span>
                  )}
                  <h2 className="text-[14px] sm:text-[15px] font-semibold text-white leading-snug line-clamp-2">{item.title}</h2>
                  {item.variantTitle && (
                    <p className="text-[12px] text-[#9A9DA5]">
                      Variant: <span className="text-[#F7F7F5]">{item.variantTitle}</span>
                    </p>
                  )}
                  {item.sku && <span className="text-[11px] text-[#6E717A] font-mono block truncate">SKU: {item.sku}</span>}
                  <span className="text-[13px] text-[#9A9DA5] sm:hidden">{formatPrice(item.price)} each</span>
                </div>

                <div className="hidden sm:block sm:col-span-2 text-center text-[13px] text-[#9A9DA5]">
                  {formatPrice(item.price)}
                </div>

                <div className="sm:col-span-2 flex sm:justify-center">
                  <div className="flex items-center h-11 rounded-[8px] border border-white/[0.12] bg-[#0D0E12]">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="w-11 h-full flex items-center justify-center text-[#9A9DA5] hover:text-white transition-colors"
                      title="Decrease quantity"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-[14px] font-bold text-white" aria-live="polite">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="w-11 h-full flex items-center justify-center text-[#9A9DA5] hover:text-white transition-colors"
                      title="Increase quantity"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                  <span className="text-[15px] font-bold text-white">{formatPrice(item.price * item.quantity)}</span>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="w-11 h-11 flex items-center justify-center rounded-full text-[#9A9DA5] hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24">
          <div className="rounded-[14px] border border-white/[0.08] bg-[#111318] p-5 sm:p-6 space-y-5">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-white pb-3 border-b border-white/[0.08]">
              Order Summary
            </h2>

            <OrderTotals
              subtotal={cartSubtotal}
              discount={discountAmount}
              discountCode={appliedCoupon?.code}
              shipping={shippingAmount}
              total={finalTotal}
              freeShippingThreshold={freeShippingThreshold}
            />

            {/* Coupon */}
            <div className="pt-4 border-t border-white/[0.08] space-y-2">
              <label htmlFor="cart-coupon" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A9DA5] block">
                Coupon code
              </label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 rounded-[8px] bg-emerald-500/10 border border-emerald-500/30 text-[12px] text-emerald-300 font-semibold">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    <span className="uppercase tracking-wider">{appliedCoupon.code} applied</span>
                  </div>
                  <button
                    onClick={() => setAppliedCoupon(null)}
                    className="min-h-[36px] text-[11px] text-[#9A9DA5] hover:text-white underline uppercase font-bold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    id="cart-coupon"
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter code"
                    className="w-full h-11 px-3 rounded-[8px] bg-[#0D0E12] border border-white/[0.1] text-[13px] font-mono uppercase text-white placeholder:text-[#6E717A] focus:border-[#F5C518]/60 focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isValidatingCoupon}
                    className="ff-btn ff-btn-outline h-11 px-4 shrink-0 disabled:opacity-50"
                  >
                    {isValidatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                  </button>
                </form>
              )}
              {couponError && <p className="text-[12px] text-rose-300">{couponError}</p>}
            </div>

            <Link
              href={`/checkout${appliedCoupon ? `?coupon=${appliedCoupon.code}` : ""}`}
              className="ff-btn ff-btn-gold w-full h-12"
            >
              Proceed to checkout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
