"use client";

import React, { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
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
  } = useCart();

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

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#F7F7F5] border-l border-[#E5E5E2] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-[#E5E5E2] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-[#111111]" />
              <h3 className="text-sm font-semibold tracking-wide uppercase text-[#111111]">
                Your Cart ({cartCount})
              </h3>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 text-[#6B6B6B] hover:text-[#111111] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                <div className="w-16 h-16 rounded-full bg-[#F0F0ED] flex items-center justify-center text-[#6B6B6B]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-[#111111]">Your cart is empty.</h4>
                  <p className="text-xs text-[#6B6B6B] mt-1 max-w-xs">
                    Looks like you haven't found your next favorite figure yet.
                  </p>
                </div>
                <Link
                  href="/shop"
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black transition-colors"
                >
                  Explore Collection
                </Link>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.variantId}
                  className="p-4 bg-white border border-[#E5E5E2] flex space-x-4 items-center"
                >
                  {/* Thumbnail */}
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

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-semibold text-[#6B6B6B] block">
                      {item.brand}
                    </span>
                    <h4 className="text-xs font-semibold text-[#111111] truncate">{item.title}</h4>
                    <p className="text-[11px] text-[#6B6B6B] mt-0.5">{item.variantTitle}</p>
                    <span className="text-xs font-semibold text-[#111111] block mt-1">
                      {formatPrice(item.price)}
                    </span>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F0F0ED]">
                      <div className="flex items-center border border-[#E5E5E2] bg-[#F7F7F5]">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="px-2 py-0.5 text-[#6B6B6B] hover:text-[#111111]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-[#111111]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="px-2 py-0.5 text-[#6B6B6B] hover:text-[#111111]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="text-[#6B6B6B] hover:text-[#A83232] transition-colors p-1"
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
            <div className="p-6 bg-white border-t border-[#E5E5E2] space-y-4">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-[#6B6B6B] uppercase tracking-wider text-xs">Subtotal</span>
                <span className="text-[#111111]">{formatPrice(cartSubtotal)}</span>
              </div>
              <p className="text-[11px] text-[#6B6B6B]">
                Taxes and shipping calculated at checkout. Free shipping on orders over ₹10,000.
              </p>

              <div className="space-y-2 pt-2">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full flex items-center justify-center py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black transition-colors"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
                </Link>

                <Link
                  href="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full flex items-center justify-center py-2.5 bg-transparent border border-[#E5E5E2] text-[#111111] text-xs font-semibold uppercase tracking-wider hover:border-[#111111] transition-colors"
                >
                  View Shopping Cart
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
