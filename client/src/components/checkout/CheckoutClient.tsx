"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { Check, ShieldCheck, Lock, CreditCard, Smartphone, ArrowRight, Loader2 } from "lucide-react";

export function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, cartSubtotal, clearCart } = useCart();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    email: "collector@fictionfigure.demo",
    phone: "+91 98123 45678",
    fullName: "Ren Amamiya",
    streetAddress: "42 Shibuya Crossing Apt 4B",
    apartment: "Suite 4B",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    country: "India",
    shippingMethod: "Standard Shipping" as "Standard Shipping" | "Express Courier",
    paymentMethod: "CREDIT_CARD" as "CREDIT_CARD" | "UPI" | "RAZORPAY",
    couponCode: searchParams.get("coupon") || "",
  });

  const [couponDiscount, setCouponDiscount] = useState(0);

  // Validate coupon on mount if present in searchParams
  useEffect(() => {
    if (formData.couponCode && cartSubtotal > 0) {
      fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: formData.couponCode, subtotal: cartSubtotal }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) setCouponDiscount(data.discountAmount);
        })
        .catch(() => {});
    }
  }, [formData.couponCode, cartSubtotal]);

  const shippingFee =
    formData.shippingMethod === "Express Courier"
      ? 500
      : cartSubtotal > 10000 || cartSubtotal === 0
      ? 0
      : 350;

  const totalAmount = Math.max(0, cartSubtotal - couponDiscount + shippingFee);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkoutInput: formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Order placement failed");
      }

      clearCart();
      router.push(`/order/${data.orderNumber}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to complete order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <h2 className="text-xl font-semibold text-[#111111]">No items in checkout</h2>
        <p className="text-xs text-[#6B6B6B]">Your cart is empty. Please add figures to continue checkout.</p>
        <Link
          href="/shop"
          className="inline-block px-6 py-2.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col">
      {/* Distraction-Free Header */}
      <header className="bg-white border-b border-[#E5E5E2] py-4">
        <div className="editorial-container flex justify-between items-center">
          <Link href="/" className="text-lg font-bold tracking-tighter uppercase text-[#111111] font-mono">
            FICTIONFIGURE
          </Link>
          <div className="flex items-center text-xs text-[#6B6B6B] space-x-1 font-mono">
            <Lock className="w-3.5 h-3.5 mr-1 text-[#2E6B44]" />
            <span>256-Bit Encrypted Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Step Progress Bar */}
      <div className="bg-white border-b border-[#E5E5E2]">
        <div className="editorial-container py-3 flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] overflow-x-auto">
          {[
            { num: 1, label: "Contact" },
            { num: 2, label: "Shipping Address" },
            { num: 3, label: "Delivery" },
            { num: 4, label: "Payment" },
            { num: 5, label: "Review Order" },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num as any)}
              className={`flex items-center space-x-2 whitespace-nowrap px-2 py-1 ${
                step === s.num
                  ? "text-[#111111] font-bold border-b-2 border-[#111111]"
                  : step > s.num
                  ? "text-[#2E6B44]"
                  : "text-[#6B6B6B]"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step === s.num
                    ? "bg-[#111111] text-white"
                    : step > s.num
                    ? "bg-[#2E6B44] text-white"
                    : "bg-[#E5E5E2] text-[#6B6B6B]"
                }`}
              >
                {step > s.num ? <Check className="w-3 h-3" /> : s.num}
              </span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Checkout Content Split */}
      <main className="editorial-container py-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Step Form */}
          <div className="lg:col-span-2 space-y-8 bg-white border border-[#E5E5E2] p-6 sm:p-8">
            {errorMessage && (
              <div className="p-4 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            {/* Step 1: Contact */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-[#111111] border-b border-[#E5E5E2] pb-3">
                  Step 1 — Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-[#6B6B6B]">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-[#6B6B6B]">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto px-8 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors"
                >
                  Continue to Shipping <ArrowRight className="w-4 h-4 inline ml-2" />
                </button>
              </div>
            )}

            {/* Step 2: Shipping Address */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-[#111111] border-b border-[#E5E5E2] pb-3">
                  Step 2 — Shipping Address
                </h3>
                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold uppercase text-[#6B6B6B]">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold uppercase text-[#6B6B6B]">Street Address *</label>
                    <input
                      type="text"
                      name="streetAddress"
                      value={formData.streetAddress}
                      onChange={handleInputChange}
                      className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold uppercase text-[#6B6B6B]">Apartment / Unit</label>
                      <input
                        type="text"
                        name="apartment"
                        value={formData.apartment}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold uppercase text-[#6B6B6B]">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold uppercase text-[#6B6B6B]">State *</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold uppercase text-[#6B6B6B]">Postal Code *</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold uppercase text-[#6B6B6B]">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(1)} className="text-xs font-semibold text-[#6B6B6B] hover:text-[#111111]">
                    ← Back to Contact
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="px-8 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors"
                  >
                    Continue to Delivery <ArrowRight className="w-4 h-4 inline ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Delivery Options */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-[#111111] border-b border-[#E5E5E2] pb-3">
                  Step 3 — Delivery Options
                </h3>
                <div className="space-y-3">
                  <label
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, shippingMethod: "Standard Shipping" }))
                    }
                    className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${
                      formData.shippingMethod === "Standard Shipping"
                        ? "border-[#111111] bg-[#F7F7F5]"
                        : "border-[#E5E5E2]"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold text-[#111111] block">
                        Insured Standard Shipping (3–5 Days)
                      </span>
                      <span className="text-[11px] text-[#6B6B6B]">
                        Reinforced outer box padding with full transit loss insurance.
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[#111111]">
                      {cartSubtotal > 10000 ? "FREE" : "₹350"}
                    </span>
                  </label>

                  <label
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, shippingMethod: "Express Courier" }))
                    }
                    className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${
                      formData.shippingMethod === "Express Courier"
                        ? "border-[#111111] bg-[#F7F7F5]"
                        : "border-[#E5E5E2]"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold text-[#111111] block">
                        Priority Express Air Freight (24–48 Hours)
                      </span>
                      <span className="text-[11px] text-[#6B6B6B]">
                        Priority courier dispatch with wooden corner reinforcement.
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[#111111]">₹500</span>
                  </label>
                </div>
                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(2)} className="text-xs font-semibold text-[#6B6B6B] hover:text-[#111111]">
                    ← Back to Address
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="px-8 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors"
                  >
                    Continue to Payment <ArrowRight className="w-4 h-4 inline ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Payment Selection */}
            {step === 4 && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-[#111111] border-b border-[#E5E5E2] pb-3">
                  Step 4 — Payment Selection
                </h3>
                <div className="space-y-3">
                  <label
                    onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: "CREDIT_CARD" }))}
                    className={`flex items-center space-x-3 p-4 border cursor-pointer ${
                      formData.paymentMethod === "CREDIT_CARD" ? "border-[#111111] bg-[#F7F7F5]" : "border-[#E5E5E2]"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-[#111111]" />
                    <div className="text-xs">
                      <span className="font-semibold text-[#111111] block">Credit / Debit Card</span>
                      <span className="text-[#6B6B6B] text-[11px]">Visa, Mastercard, American Express</span>
                    </div>
                  </label>

                  <label
                    onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: "UPI" }))}
                    className={`flex items-center space-x-3 p-4 border cursor-pointer ${
                      formData.paymentMethod === "UPI" ? "border-[#111111] bg-[#F7F7F5]" : "border-[#E5E5E2]"
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-[#111111]" />
                    <div className="text-xs">
                      <span className="font-semibold text-[#111111] block">Instant UPI Payment</span>
                      <span className="text-[#6B6B6B] text-[11px]">Google Pay, PhonePe, Paytm, BHIM</span>
                    </div>
                  </label>
                </div>
                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(3)} className="text-xs font-semibold text-[#6B6B6B] hover:text-[#111111]">
                    ← Back to Delivery
                  </button>
                  <button
                    onClick={() => setStep(5)}
                    className="px-8 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors"
                  >
                    Review Final Order <ArrowRight className="w-4 h-4 inline ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Review & Place Order */}
            {step === 5 && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-[#111111] border-b border-[#E5E5E2] pb-3">
                  Step 5 — Final Review & Place Order
                </h3>
                <div className="p-4 bg-[#F7F7F5] border border-[#E5E5E2] space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#6B6B6B]">Ship To:</span>
                    <span className="text-[#111111] text-right">
                      {formData.fullName}, {formData.streetAddress}, {formData.city}, {formData.state} - {formData.postalCode}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[#E5E5E2] pt-2">
                    <span className="font-semibold text-[#6B6B6B]">Delivery Method:</span>
                    <span className="text-[#111111] font-semibold">{formData.shippingMethod}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#E5E5E2] pt-2">
                    <span className="font-semibold text-[#6B6B6B]">Payment Method:</span>
                    <span className="text-[#111111] font-semibold">{formData.paymentMethod}</span>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(4)} className="text-xs font-semibold text-[#6B6B6B] hover:text-[#111111]">
                    ← Change Payment
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="px-10 py-4 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-colors flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating Order...
                      </>
                    ) : (
                      <>Place Order ({formatPrice(totalAmount)})</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary Box */}
          <div className="space-y-4">
            <div className="bg-white border border-[#E5E5E2] p-6 space-y-6">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#111111] border-b border-[#E5E5E2] pb-3">
                Order Summary ({cart.length})
              </h3>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.variantId} className="flex space-x-3 items-center text-xs">
                    <div className="relative w-12 h-12 bg-[#F0F0ED] shrink-0 border border-[#E5E5E2]">
                      {item.image && <Image src={item.image} alt={item.title} fill className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-semibold text-[#111111] truncate">{item.title}</h5>
                      <span className="text-[10px] text-[#6B6B6B]">Qty: {item.quantity}</span>
                    </div>
                    <span className="font-mono font-semibold text-[#111111]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-3 border-t border-[#E5E5E2] text-xs">
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Subtotal</span>
                  <span className="font-mono text-[#111111]">{formatPrice(cartSubtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-[#2E6B44]">
                    <span>Discount</span>
                    <span className="font-mono">-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Shipping</span>
                  <span className="font-mono text-[#111111]">
                    {shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E5E5E2] text-sm font-semibold">
                  <span className="uppercase text-xs tracking-wider">Total</span>
                  <span className="font-mono text-[#111111]">{formatPrice(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
