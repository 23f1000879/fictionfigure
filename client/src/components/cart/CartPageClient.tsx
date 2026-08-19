"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, Tag, ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { formatPrice } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

export function CartPageClient() {
  const { cart, removeItem, updateQuantity, cartSubtotal } = useCart();
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

  if (cart.length === 0) {
    return (
      <div className="py-20 text-center space-y-6 max-w-md mx-auto">
        <div className="w-20 h-20 bg-[#F0F0ED] rounded-full flex items-center justify-center mx-auto text-[#6B6B6B]">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-semibold text-[#111111]">Your cart is empty</h2>
        <p className="text-xs text-[#6B6B6B] leading-relaxed">
          Looks like you haven't added any figures to your cart yet. Explore our curated catalog of scale figures and statues.
        </p>
        <Link
          href="/shop"
          className="inline-block px-8 py-3.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-[#E5E5E2] pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Shopping Cart
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#111111] tracking-tight">
            Selected Figures ({cart.length})
          </h1>
        </div>
        <Link
          href="/shop"
          className="text-xs font-semibold text-[#111111] hover:underline flex items-center"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Cart Item Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="hidden sm:grid grid-cols-6 text-xs uppercase font-semibold text-[#6B6B6B] pb-3 border-b border-[#E5E5E2] tracking-wider">
            <span className="col-span-3">Item Details</span>
            <span className="text-center">Price</span>
            <span className="text-center">Quantity</span>
            <span className="text-right">Total</span>
          </div>

          <div className="divide-y divide-[#E5E5E2]">
            {cart.map((item) => (
              <div
                key={item.variantId}
                className="py-4 grid grid-cols-1 sm:grid-cols-6 gap-4 items-center"
              >
                {/* Product & Variant info */}
                <div className="sm:col-span-3 flex space-x-4 items-center">
                  <div className="relative w-20 h-20 bg-[#F0F0ED] shrink-0 border border-[#E5E5E2]">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[#6B6B6B]">
                        No img
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-semibold text-[#6B6B6B] block">
                      {item.brand}
                    </span>
                    <h4 className="text-xs font-semibold text-[#111111] truncate">{item.title}</h4>
                    <p className="text-[11px] text-[#6B6B6B]">{item.variantTitle}</p>
                    <span className="text-[10px] text-[#6B6B6B] font-mono block mt-0.5">
                      SKU: {item.sku}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-left sm:text-center text-xs font-mono font-semibold text-[#111111]">
                  {formatPrice(item.price)}
                </div>

                {/* Quantity */}
                <div className="flex justify-start sm:justify-center items-center">
                  <div className="flex items-center border border-[#E5E5E2] bg-white">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="p-1.5 text-[#6B6B6B] hover:text-[#111111]"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-mono font-semibold text-[#111111]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="p-1.5 text-[#6B6B6B] hover:text-[#111111]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Total & Delete */}
                <div className="flex items-center justify-between sm:justify-end space-x-4 text-xs font-mono font-semibold text-[#111111]">
                  <span>{formatPrice(item.price * item.quantity)}</span>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="text-[#6B6B6B] hover:text-[#A83232] transition-colors p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary & Coupon Form */}
        <div className="space-y-6">
          <div className="p-6 bg-white border border-[#E5E5E2] space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-[#111111] border-b border-[#E5E5E2] pb-3">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Items Subtotal</span>
                <span className="font-mono text-[#111111]">{formatPrice(cartSubtotal)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-[#2E6B44]">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span className="font-mono">-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#6B6B6B]">
                <span>Estimated Shipping</span>
                <span className="font-mono text-[#111111]">
                  {shippingAmount === 0 ? "FREE" : formatPrice(shippingAmount)}
                </span>
              </div>

              <div className="pt-3 border-t border-[#E5E5E2] flex justify-between text-sm font-semibold">
                <span className="uppercase text-xs tracking-wider">Total</span>
                <span className="font-mono text-base text-[#111111]">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {/* Coupon Code Form */}
            <div className="pt-4 border-t border-[#E5E5E2] space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] block">
                Promo Code
              </label>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-[#F0F0ED] border border-[#E5E5E2] text-xs text-[#2E6B44]">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4" />
                    <span className="font-semibold uppercase">{appliedCoupon.code} Applied</span>
                  </div>
                  <button
                    onClick={() => setAppliedCoupon(null)}
                    className="text-xs text-[#6B6B6B] hover:text-[#111111] underline"
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
                    placeholder="e.g. WELCOME10"
                    className="w-full px-3 py-2 bg-[#F7F7F5] border border-[#E5E5E2] text-xs uppercase text-[#111111] placeholder-[#6B6B6B] focus:border-[#111111] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isValidatingCoupon}
                    className="px-4 py-2 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black disabled:opacity-50 transition-colors"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponError && <p className="text-[11px] text-[#A83232]">{couponError}</p>}
            </div>

            {/* Checkout Action CTA */}
            <div className="pt-4">
              <Link
                href={`/checkout${appliedCoupon ? `?coupon=${appliedCoupon.code}` : ""}`}
                className="w-full flex items-center justify-center py-3.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
