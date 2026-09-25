import React from "react";
import { formatPrice } from "@/lib/utils";

interface OrderTotalsProps {
  subtotal: number;
  discount?: number;
  discountCode?: string;
  shipping: number;
  codFee?: number;
  total: number;
  totalLabel?: string;
  freeShippingThreshold?: number;
  className?: string;
}

/**
 * Presentation-only price breakdown shared by Cart, Checkout and Review Order.
 * All amounts are computed by the calling page; this component only displays them.
 */
export function OrderTotals({
  subtotal,
  discount = 0,
  discountCode,
  shipping,
  codFee = 0,
  total,
  totalLabel = "Total",
  freeShippingThreshold,
  className = "",
}: OrderTotalsProps) {
  return (
    <div className={`space-y-2.5 text-[13px] ${className}`}>
      <div className="flex justify-between text-[#9A9DA5]">
        <span>Subtotal</span>
        <span className="text-[#F7F7F5]">{formatPrice(subtotal)}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-emerald-400">
          <span>Discount{discountCode ? ` (${discountCode})` : ""}</span>
          <span>-{formatPrice(discount)}</span>
        </div>
      )}
      <div className="flex justify-between text-[#9A9DA5]">
        <span>Shipping &amp; Delivery</span>
        <span className={shipping === 0 ? "text-emerald-400 font-semibold" : "text-[#F7F7F5]"}>
          {shipping === 0 ? "FREE" : formatPrice(shipping)}
        </span>
      </div>
      {codFee > 0 && (
        <div className="flex justify-between text-[#9A9DA5]">
          <span>COD Handling Fee</span>
          <span className="text-[#F7F7F5]">{formatPrice(codFee)}</span>
        </div>
      )}
      <div className="flex justify-between items-baseline pt-3 mt-1 border-t border-white/[0.08]">
        <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white">{totalLabel}</span>
        <span className="text-[22px] font-extrabold tracking-tight text-white">{formatPrice(total)}</span>
      </div>
      {typeof freeShippingThreshold === "number" && freeShippingThreshold > 0 && (
        <p className="text-[11px] text-[#6E717A]">
          {shipping === 0
            ? "Free shipping applied to this order."
            : `Free shipping on orders of ${formatPrice(freeShippingThreshold)} or more.`}
        </p>
      )}
    </div>
  );
}
