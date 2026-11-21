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
      <section className="sakuga-empty-cart relative isolate overflow-hidden rounded-[16px] border border-white/[0.08] bg-[#0D0E12] my-6 lg:my-10">
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
              Explore collections
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
    <div className="concept-bag space-y-6 lg:space-y-8 pb-12">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-5 border-b border-white/[0.08]">
        <div className="space-y-2">
          <p className="ff-eyebrow">Shopping bag</p>
          <h1 className="text-[30px] sm:text-[38px] font-extrabold leading-[1.05] tracking-[-0.02em] text-white">
            Your bag
            <span className="ml-3 align-middle text-[14px] font-semibold text-[#9A9DA5] tracking-normal">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </h1>
          <p className="concept-bag-subtitle">A good start to your universe.</p>
        </div>
        <Link href="/shop" className="ff-link-arrow min-h-[44px]">
          <ArrowLeft className="w-3.5 h-3.5" /> Continue shopping
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Items */}
        <ul className="lg:col-span-8 space-y-3">
          {cart.map(item=><li key={item.variantId} className="concept-bag-item">
            <div className="concept-bag-image">{item.image?.trim()?<Image src={item.image} alt={item.title} fill sizes="110px" className="object-contain p-1" unoptimized/>:<ShoppingBag aria-hidden size={26}/>}</div>
            <div className="concept-bag-item-details"><h2>{item.title}</h2>
              {item.variantTitle && !["Standard Edition","Standard","Default Title"].includes(item.variantTitle) && <p>{item.variantTitle}</p>}
              <strong>{formatPrice(item.price*item.quantity)}</strong>{item.quantity>1 && <span className="text-sm text-foreground-secondary"> · {formatPrice(item.price)} each</span>}
              <div className="concept-bag-item-actions"><div className="concept-quantity"><button type="button" onClick={()=>updateQuantity(item.variantId,item.quantity-1)} aria-label={`Decrease quantity of ${item.title}`}><Minus size={16}/></button><span aria-live="polite">{item.quantity}</span><button type="button" onClick={()=>updateQuantity(item.variantId,item.quantity+1)} aria-label={`Increase quantity of ${item.title}`}><Plus size={16}/></button></div><button type="button" onClick={()=>removeItem(item.variantId)} className="concept-remove" aria-label={`Remove ${item.title}`}>Remove</button></div>
            </div>
          </li>)}
        </ul>

        {/* Summary */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24">
          <div className="rounded-[14px] border border-white/[0.08] bg-[#111318] p-5 sm:p-6 space-y-5">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-white pb-3 border-b border-white/[0.08]">
              Order summary
            </h2>

            {freeShippingThreshold > 0 && <div className="concept-shipping-progress">
              <strong>{cartSubtotal >= freeShippingThreshold ? "Your bag ships free!" : `${formatPrice(freeShippingThreshold - cartSubtotal)} away from free shipping`}</strong>
              <div className="concept-shipping-track" role="progressbar" aria-label="Progress to free shipping" aria-valuenow={Math.min(cartSubtotal, freeShippingThreshold)} aria-valuemin={0} aria-valuemax={freeShippingThreshold}><span style={{width:`${Math.min(100, cartSubtotal / freeShippingThreshold * 100)}%`}} /></div>
              <p>Free shipping on orders {formatPrice(freeShippingThreshold)} and above.</p>
            </div>}
            <OrderTotals
              subtotal={cartSubtotal}
              discount={discountAmount}
              discountCode={appliedCoupon?.code}
              shipping={shippingAmount}
              total={finalTotal}
              freeShippingThreshold={freeShippingThreshold}
            />

            {/* Coupon */}
            <details className="concept-coupon pt-4 border-t border-white/[0.08] space-y-2">
              <summary><Tag aria-hidden />Have a coupon?</summary>
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
            </details>

            <Link
              href={`/checkout${appliedCoupon ? `?coupon=${appliedCoupon.code}` : ""}`}
              className="ff-btn ff-btn-gold w-full h-12"
            >
              Continue to checkout
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
