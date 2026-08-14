import React, { Suspense } from "react";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { CartProvider } from "@/context/CartContext";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-[#6B6B6B]">Loading checkout...</div>}>
      <CheckoutClient />
    </Suspense>
  );
}
