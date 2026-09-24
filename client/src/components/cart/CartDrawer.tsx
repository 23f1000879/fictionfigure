"use client";

import React, { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 w-full sm:w-auto max-w-full flex justify-end pl-0 sm:pl-10">
        <div className="w-full sm:w-screen max-w-full sm:max-w-md bg-[#F7F7F5] border-l border-[#E5E5E2] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 min-w-0 box-border h-full overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-[#E5E5E2] flex items-center justify-between bg-white shrink-0 min-w-0 w-full box-border">
            <div className="flex items-center space-x-2 min-w-0">
              <ShoppingBag className="w-5 h-5 text-[#111111] shrink-0" />
              <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#111111] truncate">
                Shopping Cart ({isHydrating ? "..." : cartCount})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-[#6B6B6B] hover:text-[#111111] transition-colors shrink-0 ml-2"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4 sm:space-y-6 min-w-0 w-full box-border">
            {isHydrating || isValidating ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                <Loader2 className="w-8 h-8 text-[#111111] animate-spin" />
                <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
                  Updating Cart...
                </p>
              </div>
            ) : cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                <ShoppingBag className="w-12 h-12 text-[#6B6B6B]" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#111111] uppercase tracking-wider">
                    Your Cart is Empty
                  </p>
                  <p className="text-xs text-[#6B6B6B]">
                    Explore our curated collection of scale figures and statues.
                  </p>
                </div>
                <Link
                  href="/shop"
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black transition-colors"
                >
                  Explore Catalog
                </Link>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.variantId}
                  className="flex space-x-3 sm:space-x-4 p-3.5 sm:p-4 bg-white border border-[#E5E5E2] rounded-lg shadow-2xs min-w-0 w-full box-border"
                >
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-[#F7F7F5] border border-[#E5E5E2] rounded-md overflow-hidden shrink-0 p-1 flex items-center justify-center">
                    {item.image && item.image.trim() !== "" ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="80px"
                        className="object-contain p-1"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[#6B6B6B] font-mono uppercase">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-[#111111] truncate leading-snug">
                        {item.title}
                      </h4>
                      {item.variantTitle && (
                        <p className="text-[11px] font-medium text-[#6B6B6B] mt-0.5 truncate">
                          Variant: <strong className="font-mono text-[#111111]">{item.variantTitle}</strong>
                        </p>
                      )}
                      <p className="text-[11px] font-mono font-bold text-[#111111] mt-0.5">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 gap-2 min-w-0">
                      <div className="flex items-center border border-[#E5E5E2] rounded-md bg-white shrink-0">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-1 text-[#6B6B6B] hover:text-[#111111] transition-colors"
                          title="Decrease quantity"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono font-bold text-[#111111]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="p-1 text-[#6B6B6B] hover:text-[#111111] transition-colors"
                          title="Increase quantity"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="text-[#6B6B6B] hover:text-[#A83232] transition-colors p-1 shrink-0"
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 bg-white border-t border-[#E5E5E2] space-y-4 shrink-0 min-w-0 w-full box-border">
              <div className="flex justify-between items-center text-sm font-extrabold gap-2 min-w-0 w-full">
                <span className="text-[#6B6B6B] uppercase tracking-wider text-xs font-bold shrink-0">Subtotal</span>
                <span className="text-[#111111] font-mono text-sm sm:text-base font-bold shrink-0 text-right">{formatPrice(cartSubtotal)}</span>
              </div>
              <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
                Taxes and shipping calculated at checkout. Free shipping on orders of {formatPrice(freeShippingThreshold)} or more.
              </p>

              <div className="space-y-2 pt-2 w-full min-w-0">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full flex items-center justify-center py-3.5 px-4 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest rounded-md hover:bg-[#D4AF37] hover:text-[#111111] transition-all shadow-sm min-h-[44px] box-border"
                >
                  CHECKOUT <ArrowRight className="w-4 h-4 ml-2 shrink-0" />
                </Link>

                <Link
                  href="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full flex items-center justify-center py-3 px-4 bg-transparent border border-[#E5E5E2] text-[#111111] text-xs font-bold uppercase tracking-widest rounded-md hover:border-[#111111] transition-all min-h-[44px] box-border"
                >
                  VIEW SHOPPING BAG
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
