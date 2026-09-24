"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, Tag, ShoppingBag, Loader2, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { formatPrice } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

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
        <Loader2 className="w-8 h-8 text-[#111111] animate-spin mx-auto" />
        <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">
          Updating Shopping Cart...
        </p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="py-20 sm:py-28 text-center max-w-lg mx-auto px-4">
        <div className="w-20 h-20 bg-[#F0F0ED] rounded-full flex items-center justify-center mx-auto text-[#6B6B6B] mb-6 border border-[#E5E5E2]">
          <ShoppingBag className="w-8 h-8 text-[#111111]" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37] block mb-2">
          FICTIONFIGURE BAG
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#111111] mb-3">
          YOUR CART IS EMPTY
        </h2>
        <p className="text-xs text-[#6B6B6B] leading-relaxed max-w-sm mx-auto mb-8 font-normal">
          Looks like you haven't added anything yet. Explore our curated collections of authentic scale figures and collectibles.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/shop"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-[#111111] transition-all shadow-sm text-center"
          >
            EXPLORE COLLECTIONS
          </Link>
          <Link
            href="/shop"
            className="w-full sm:w-auto px-8 py-3.5 bg-transparent border border-[#E5E5E2] text-[#111111] text-xs font-bold uppercase tracking-widest hover:border-[#111111] transition-all text-center"
          >
            CONTINUE SHOPPING
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Editorial Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#E5E5E2] pb-6 gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37] block mb-1">
            SHOPPING BAG
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight uppercase">
            CART ({cart.length} {cart.length === 1 ? "ITEM" : "ITEMS"})
          </h1>
        </div>
        <Link
          href="/shop"
          className="text-xs font-bold uppercase tracking-wider text-[#111111] hover:text-[#D4AF37] transition-colors flex items-center"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Cart Item List (8 columns) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="hidden sm:grid grid-cols-12 text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B] pb-3 border-b border-[#E5E5E2]">
            <span className="col-span-6">PRODUCT</span>
            <span className="col-span-2 text-center">PRICE</span>
            <span className="col-span-2 text-center">QUANTITY</span>
            <span className="col-span-2 text-right">TOTAL</span>
          </div>

          <div className="divide-y divide-[#E5E5E2]">
            {cart.map((item) => (
              <div
                key={item.variantId}
                className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center"
              >
                {/* Product Image & Details (6 cols) */}
                <div className="sm:col-span-6 flex space-x-4 items-center">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-[#F7F7F5] rounded-lg border border-[#E5E5E2] overflow-hidden shrink-0 p-1 flex items-center justify-center">
                    {item.image && item.image.trim() !== "" ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="96px"
                        className="object-contain p-1"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[#6B6B6B] font-mono uppercase">
                        No img
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    {item.brand && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B] block">
                        {item.brand}
                      </span>
                    )}
                    <h4 className="text-xs sm:text-sm font-semibold text-[#111111] truncate leading-snug">
                      {item.title}
                    </h4>
                    {item.variantTitle && (
                      <p className="text-[11px] text-[#6B6B6B] font-medium">
                        Variant: <strong className="text-[#111111] font-mono">{item.variantTitle}</strong>
                      </p>
                    )}
                    {item.sku && (
                      <span className="text-[10px] text-[#6B6B6B] font-mono block">
                        SKU: {item.sku}
                      </span>
                    )}

                    {/* Mobile Price Display */}
                    <div className="sm:hidden text-xs font-mono font-bold text-[#111111] pt-1">
                      {formatPrice(item.price)}
                    </div>
                  </div>
                </div>

                {/* Desktop Unit Price (2 cols) */}
                <div className="hidden sm:block sm:col-span-2 text-center text-xs font-mono font-semibold text-[#111111]">
                  {formatPrice(item.price)}
                </div>

                {/* Compact Quantity Control (2 cols) */}
                <div className="sm:col-span-2 flex justify-between sm:justify-center items-center">
                  <div className="flex items-center border border-[#E5E5E2] rounded-md bg-white shadow-2xs">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="p-2 text-[#6B6B6B] hover:text-[#111111] transition-colors"
                      title="Decrease quantity"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-3 text-xs font-mono font-bold text-[#111111]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="p-2 text-[#6B6B6B] hover:text-[#111111] transition-colors"
                      title="Increase quantity"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Mobile Remove Button */}
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="sm:hidden text-xs font-semibold text-[#6B6B6B] hover:text-[#A83232] transition-colors uppercase tracking-wider flex items-center"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                  </button>
                </div>

                {/* Line Total & Remove Action (2 cols) */}
                <div className="hidden sm:flex sm:col-span-2 items-center justify-end space-x-3 text-xs font-mono font-semibold text-[#111111]">
                  <span>{formatPrice(item.price * item.quantity)}</span>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="text-[#6B6B6B] hover:text-[#A83232] transition-colors p-1"
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary Column (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 bg-white border border-[#E5E5E2] rounded-lg space-y-6 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#111111] border-b border-[#E5E5E2] pb-3">
              ORDER SUMMARY
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Subtotal</span>
                <span className="font-mono text-[#111111] font-medium">{formatPrice(cartSubtotal)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-[#2E6B44] font-medium">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span className="font-mono">-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#6B6B6B]">
                <span>Shipping</span>
                <span className="font-mono text-[#111111] font-medium">
                  {shippingAmount === 0 ? "FREE" : formatPrice(shippingAmount)}
                </span>
              </div>

              <div className="pt-3 border-t border-[#E5E5E2] flex justify-between items-center text-sm font-extrabold text-[#111111]">
                <span className="uppercase text-xs tracking-wider">TOTAL</span>
                <span className="font-mono text-lg">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {/* Coupon Code Area */}
            <div className="pt-4 border-t border-[#E5E5E2] space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B] block">
                COUPON CODE
              </label>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 bg-[#2E6B44]/10 border border-[#2E6B44] text-xs text-[#2E6B44] rounded-md font-semibold">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    <span className="uppercase tracking-wider">{appliedCoupon.code} Applied</span>
                  </div>
                  <button
                    onClick={() => setAppliedCoupon(null)}
                    className="text-xs text-[#6B6B6B] hover:text-[#111111] underline uppercase font-bold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter code"
                    className="w-full px-3 py-2.5 bg-[#F7F7F5] border border-[#E5E5E2] text-xs font-mono uppercase text-[#111111] placeholder-[#6B6B6B] rounded-md focus:border-[#111111] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isValidatingCoupon}
                    className="px-4 py-2.5 bg-[#111111] text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-[#D4AF37] hover:text-[#111111] disabled:opacity-50 transition-colors shrink-0"
                  >
                    {isValidatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "APPLY"}
                  </button>
                </form>
              )}

              {couponError && <p className="text-[11px] text-[#A83232]">{couponError}</p>}
            </div>

            {/* Checkout Primary CTA */}
            <div className="pt-4">
              <Link
                href={`/checkout${appliedCoupon ? `?coupon=${appliedCoupon.code}` : ""}`}
                className="w-full flex items-center justify-center py-4 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest rounded-md hover:bg-[#D4AF37] hover:text-[#111111] transition-all shadow-sm"
              >
                CHECKOUT <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

