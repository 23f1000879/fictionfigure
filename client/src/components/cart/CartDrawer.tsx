"use client";

import React, { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeItem,
    updateQuantity,
    cartCount,
    cartSubtotal,
    isHydrating,
    isValidating,
  } = useCart();
  const { freeShippingThreshold } = useSettings();

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const threshold = freeShippingThreshold || 999;
  const progressPercent = Math.min(100, Math.round((cartSubtotal / threshold) * 100));
  const remainingForFreeShipping = Math.max(0, threshold - cartSubtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark Overlay Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 w-full sm:w-auto max-w-full flex justify-end pl-0 sm:pl-10">
        <div className="w-full sm:w-screen max-w-full sm:max-w-md bg-[#121318] border-l border-white/10 flex flex-col shadow-2xl shadow-black animate-in slide-in-from-right duration-300 min-w-0 box-border h-full overflow-hidden text-white">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#0E0F14] shrink-0 min-w-0 w-full box-border">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#F5C518]/10 border border-[#F5C518]/25 flex items-center justify-center text-[#F5C518] shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white truncate">
                Collector Bag ({isHydrating ? "..." : cartCount})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-white/[0.05] border border-white/10 text-white/80 hover:text-white flex items-center justify-center shrink-0 transition-all cursor-pointer"
              aria-label="Close cart drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Free Shipping Dynamic Progress Meter */}
          {cart.length > 0 && (
            <div className="p-3.5 sm:p-4 bg-[#181920] border-b border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8] font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F5C518]" />
                  {remainingForFreeShipping === 0 ? (
                    <span className="text-[#10B981] font-bold">Free Insured Shipping Unlocked!</span>
                  ) : (
                    <span>Add <strong className="text-white font-mono">{formatPrice(remainingForFreeShipping)}</strong> for Free Shipping</span>
                  )}
                </span>
                <span className="text-[11px] font-mono text-[#64748B]">{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#F5C518] to-[#10B981] transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-3.5 min-w-0 w-full box-border">
            {isHydrating || isValidating ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16">
                <Loader2 className="w-7 h-7 text-[#F5C518] animate-spin" />
                <p className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider">
                  Updating Bag...
                </p>
              </div>
            ) : cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16 px-4">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#F5C518]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <p className="text-base font-bold text-white uppercase tracking-wider">
                    Your Bag is Empty
                  </p>
                  <p className="text-xs text-[#94A3B8]">
                    Explore our curated vault of scale figures and limited statues.
                  </p>
                </div>
                <Link
                  href="/shop"
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#F5C518] to-[#D4AF37] text-[#0A0A0C] text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all"
                >
                  Explore Catalog
                </Link>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.variantId}
                  className="flex space-x-3.5 p-3.5 bg-[#181920] border border-white/[0.08] rounded-xl hover:border-white/15 transition-all min-w-0 w-full box-border"
                >
                  {/* Thumbnail */}
                  <div className="relative w-18 h-18 sm:w-20 sm:h-20 bg-[#0E0F13] border border-white/10 rounded-lg overflow-hidden shrink-0 p-1 flex items-center justify-center">
                    {item.image && item.image.trim() !== "" ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="text-[10px] text-[#64748B] font-mono">No Image</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#F5C518] block tracking-wider truncate">
                        {item.brand || "COLLECTIBLE"}
                      </span>
                      <h4 className="text-xs font-semibold text-white truncate leading-snug">
                        {item.title}
                      </h4>
                      {item.variantTitle && item.variantTitle !== "Standard Edition" && item.variantTitle !== "Standard" && (
                        <span className="text-[10px] font-mono text-[#94A3B8] block">
                          {item.variantTitle}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {/* Stepper */}
                      <div className="flex items-center border border-white/15 rounded-lg bg-[#0E0F13] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-mono font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Price & Trash */}
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold text-white">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.variantId)}
                          className="text-[#64748B] hover:text-rose-400 p-1 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Strip */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-white/10 bg-[#0E0F14] shrink-0 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <span>Subtotal</span>
                  <span className="font-mono text-sm font-bold text-white">{formatPrice(cartSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                  <span>Shipping & Taxes</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 text-white text-xs font-bold uppercase tracking-wider text-center transition-all flex items-center justify-center"
                >
                  View Bag
                </Link>
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#F5C518] to-[#D4AF37] text-[#0A0A0C] text-xs font-bold uppercase tracking-wider text-center hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-[#64748B]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#F5C518]" />
                <span>100% Authentic Japanese Import Guarantee</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
