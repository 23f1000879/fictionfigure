"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { Check, Lock, QrCode, Banknote, ArrowRight, Loader2, Phone, AlertCircle } from "lucide-react";
import { API_BASE } from "@/lib/api";

export function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, cartSubtotal, clearCart } = useCart();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [sessionToken, setSessionToken] = useState<string>("");
  const [isMobileVerified, setIsMobileVerified] = useState(false);

  // Store Settings for UPI QR Code
  const [upiSettings, setUpiSettings] = useState({
    upiId: "fictionfigure@upi",
    upiQrUrl: "",
  });

  const [utrNumber, setUtrNumber] = useState("");

  // Form State (No Hardcoded Demo Strings)
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    fullName: "",
    streetAddress: "",
    apartment: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    shippingMethod: "Standard Shipping" as "Standard Shipping" | "Express Courier",
    paymentMethod: "UPI" as "UPI" | "COD",
    couponCode: searchParams.get("coupon") || "",
  });

  const [couponDiscount, setCouponDiscount] = useState(0);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  // Fetch UPI Store Settings on Mount
  useEffect(() => {
    fetch(`${API_BASE}/settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setUpiSettings({
            upiId: data.settings.upi_id || "fictionfigure@upi",
            upiQrUrl: data.settings.upi_qr_url || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Authenticated User Session on Mount
  useEffect(() => {
    const token = localStorage.getItem("fictionfigure_token");
    if (token) {
      setSessionToken(token);
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user) {
            setIsMobileVerified(true);
            setFormData((prev) => ({
              ...prev,
              email: data.user.email || prev.email,
              phone: data.user.phone || prev.phone,
              fullName: `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim() || prev.fullName,
            }));

            fetch(`${API_BASE}/checkout/addresses`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((res) => res.json())
              .then((addrData) => {
                if (addrData.addresses && addrData.addresses.length > 0) {
                  setSavedAddresses(addrData.addresses);
                  const def = addrData.addresses.find((a: any) => a.isDefault) || addrData.addresses[0];
                  setFormData((prev) => ({
                    ...prev,
                    fullName: def.fullName || prev.fullName,
                    streetAddress: def.streetAddress || prev.streetAddress,
                    apartment: def.apartment || prev.apartment,
                    city: def.city || prev.city,
                    state: def.state || prev.state,
                    postalCode: def.postalCode || prev.postalCode,
                    country: def.country || prev.country,
                  }));
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, []);

  // Validate Coupon Server-Side
  useEffect(() => {
    if (formData.couponCode && cartSubtotal > 0) {
      fetch(`${API_BASE}/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: formData.couponCode, cartSubtotal }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) setCouponDiscount(data.discountAmount);
          else setCouponDiscount(0);
        })
        .catch(() => setCouponDiscount(0));
    } else {
      setCouponDiscount(0);
    }
  }, [formData.couponCode, cartSubtotal]);

  const shippingFee =
    formData.shippingMethod === "Express Courier"
      ? 500
      : cartSubtotal >= 15000 || cartSubtotal === 0
      ? 0
      : 350;

  const estimatedTotal = Math.max(0, cartSubtotal - couponDiscount + shippingFee);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Customer Mobile Identification
  const handleIdentifyCustomer = async () => {
    if (!formData.phone || formData.phone.trim().length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsIdentifying(true);
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE}/checkout/auth/identify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify mobile number.");

      if (data.exists && data.phoneVerified) {
        setIsMobileVerified(true);
        if (data.token) {
          localStorage.setItem("fictionfigure_token", data.token);
          setSessionToken(data.token);
        }
        if (data.user) {
          setFormData((prev) => ({
            ...prev,
            fullName: `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim() || prev.fullName,
            email: data.user.email || prev.email,
          }));
        }
        setStep(2);
      } else {
        setIsMobileVerified(false);
        setErrorMessage("Mobile number requires verification via SMS OTP.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to identify mobile number.");
    } finally {
      setIsIdentifying(false);
    }
  };

  // Submit Order (UPI QR with UTR or COD)
  const handlePlaceOrder = async () => {
    if (formData.paymentMethod === "UPI" && (!utrNumber || utrNumber.trim().length < 6)) {
      setErrorMessage("Please enter a valid 12-digit UTR / Transaction Reference Number.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const cartItemsPayload = cart.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }

      const endpoint =
        formData.paymentMethod === "UPI"
          ? `${API_BASE}/checkout/submit-upi-payment`
          : `${API_BASE}/checkout/submit-cod`;

      const bodyPayload: any = {
        cartItems: cartItemsPayload,
        couponCode: formData.couponCode,
        shippingAddress: {
          fullName: formData.fullName,
          streetAddress: formData.streetAddress,
          apartment: formData.apartment,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
          phone: formData.phone,
          email: formData.email,
        },
        shippingMethod: formData.shippingMethod,
      };

      if (formData.paymentMethod === "UPI") {
        bodyPayload.utr = utrNumber.trim();
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit order.");

      // Clear cart & navigate to order confirmation page
      clearCart();
      router.push(`/order/${data.orderNumber}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Order creation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto px-4">
        <h2 className="text-xl font-semibold text-[#111111]">No items in checkout</h2>
        <p className="text-xs text-[#6B6B6B]">Your cart is empty. Please add collectibles to continue checkout.</p>
        <Link
          href="/shop"
          className="inline-block min-h-[44px] px-6 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E2] py-4">
        <div className="editorial-container flex justify-between items-center px-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tighter uppercase text-[#111111] font-mono">
            FICTIONFIGURE
          </Link>
          <div className="flex items-center text-xs text-[#6B6B6B] space-x-1 font-mono">
            <Lock className="w-3.5 h-3.5 mr-1 text-[#2E6B44]" />
            <span className="hidden sm:inline">256-Bit Encrypted Secure Checkout</span>
            <span className="sm:hidden">Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Mobile-Friendly Stepper Bar */}
      <div className="bg-white border-b border-[#E5E5E2]">
        <div className="editorial-container py-3 flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] overflow-x-auto px-4 sm:px-6 scrollbar-none">
          {[
            { num: 1, label: "Contact" },
            { num: 2, label: "Address" },
            { num: 3, label: "Delivery" },
            { num: 4, label: "Payment" },
            { num: 5, label: "Review" },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num as any)}
              className={`flex items-center space-x-1.5 whitespace-nowrap px-2 py-1 min-h-[36px] ${
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
              <span className="text-[11px]">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Layout */}
      <main className="editorial-container py-8 sm:py-12 flex-1 px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-6 sm:space-y-8 bg-white border border-[#E5E5E2] p-5 sm:p-8">
            {errorMessage && (
              <div className="p-4 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step 1: Contact */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-[#111111] border-b border-[#E5E5E2] pb-3">
                  Step 1 — Mobile Verification
                </h3>

                {isMobileVerified && (
                  <div className="p-3 bg-[#2E6B44]/10 border border-[#2E6B44] text-[#2E6B44] text-xs font-semibold flex items-center space-x-2">
                    <Check className="w-4 h-4" />
                    <span>Verified Mobile Customer ({formData.phone})</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-[#6B6B6B]">
                      Mobile Phone Number *
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="+91 98765 43210"
                      className="w-full p-3 min-h-[44px] bg-[#F7F7F5] border border-[#E5E5E2] text-xs text-[#111111] focus:border-[#111111] focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-[#6B6B6B]">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="collector@domain.com"
                      className="w-full p-3 min-h-[44px] bg-[#F7F7F5] border border-[#E5E5E2] text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  {isMobileVerified ? (
                    <button
                      onClick={() => setStep(2)}
                      className="w-full sm:w-auto min-h-[44px] px-8 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors"
                    >
                      Continue to Shipping Address <ArrowRight className="w-4 h-4 inline ml-2" />
                    </button>
                  ) : (
                    <button
                      onClick={handleIdentifyCustomer}
                      disabled={isIdentifying}
                      className="w-full sm:w-auto min-h-[44px] px-8 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-colors flex items-center justify-center"
                    >
                      {isIdentifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
                      <span>Verify Mobile Number</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Shipping Address */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-[#111111] border-b border-[#E5E5E2] pb-3">
                  Step 2 — Shipping Address
                </h3>

                {savedAddresses.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-[#6B6B6B]">Select Saved Address</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              fullName: addr.fullName,
                              streetAddress: addr.streetAddress,
                              apartment: addr.apartment || "",
                              city: addr.city,
                              state: addr.state,
                              postalCode: addr.postalCode,
                              country: addr.country,
                            }));
                          }}
                          className="p-3 border border-[#E5E5E2] hover:border-[#111111] cursor-pointer text-xs space-y-1 bg-[#F7F7F5]"
                        >
                          <span className="font-semibold text-[#111111] block">{addr.fullName}</span>
                          <span className="text-[#6B6B6B] block truncate">{addr.streetAddress}, {addr.city}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold uppercase text-[#6B6B6B]">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="e.g. Ren Amamiya"
                      className="w-full p-3 min-h-[44px] bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold uppercase text-[#6B6B6B]">Street Address *</label>
                    <input
                      type="text"
                      name="streetAddress"
                      value={formData.streetAddress}
                      onChange={handleInputChange}
                      placeholder="Flat / House No., Building Name, Street"
                      className="w-full p-3 min-h-[44px] bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold uppercase text-[#6B6B6B]">Apartment / Landmark</label>
                      <input
                        type="text"
                        name="apartment"
                        value={formData.apartment}
                        onChange={handleInputChange}
                        placeholder="Suite / Landmark"
                        className="w-full p-3 min-h-[44px] bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold uppercase text-[#6B6B6B]">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Mumbai"
                        className="w-full p-3 min-h-[44px] bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold uppercase text-[#6B6B6B]">State *</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="Maharashtra"
                        className="w-full p-3 min-h-[44px] bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold uppercase text-[#6B6B6B]">PIN Code *</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        placeholder="400001"
                        className="w-full p-3 min-h-[44px] bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-[#111111] focus:border-[#111111] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold uppercase text-[#6B6B6B]">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full p-3 min-h-[44px] bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(1)} className="text-xs font-semibold text-[#6B6B6B] hover:text-[#111111] min-h-[44px] px-2">
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="min-h-[44px] px-8 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors"
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
                    className={`flex items-center justify-between p-4 border cursor-pointer min-h-[64px] transition-all ${
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
                        Reinforced outer box padding with transit loss insurance.
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[#111111] shrink-0 ml-2">
                      {cartSubtotal >= 15000 ? "FREE" : "₹350"}
                    </span>
                  </label>

                  <label
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, shippingMethod: "Express Courier" }))
                    }
                    className={`flex items-center justify-between p-4 border cursor-pointer min-h-[64px] transition-all ${
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
                        Priority dispatch with wooden corner reinforcement.
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[#111111] shrink-0 ml-2">₹500</span>
                  </label>
                </div>
                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(2)} className="text-xs font-semibold text-[#6B6B6B] hover:text-[#111111] min-h-[44px] px-2">
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="min-h-[44px] px-8 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors"
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
                <div className="space-y-4">
                  {/* Option 1: Instant UPI QR Code */}
                  <label
                    onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: "UPI" }))}
                    className={`flex items-start space-x-3 p-4 border cursor-pointer ${
                      formData.paymentMethod === "UPI" ? "border-[#111111] bg-[#F7F7F5]" : "border-[#E5E5E2]"
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-[#111111] shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <span className="font-semibold text-[#111111] block">UPI Payment (QR Code & UTR Verification)</span>
                      <span className="text-[#6B6B6B] text-[11px] block">
                        Scan using Google Pay, PhonePe, Paytm, BHIM, or any UPI app.
                      </span>
                    </div>
                  </label>

                  {/* Option 2: Cash on Delivery */}
                  <label
                    onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: "COD" }))}
                    className={`flex items-start space-x-3 p-4 border cursor-pointer ${
                      formData.paymentMethod === "COD" ? "border-[#111111] bg-[#F7F7F5]" : "border-[#E5E5E2]"
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-[#111111] shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <span className="font-semibold text-[#111111] block">Cash on Delivery (COD)</span>
                      <span className="text-[#6B6B6B] text-[11px] block">
                        Pay cash upon physical arrival at your doorstep.
                      </span>
                    </div>
                  </label>
                </div>

                {/* UPI QR & UTR Section when UPI is selected */}
                {formData.paymentMethod === "UPI" && (
                  <div className="p-6 bg-white border border-[#E5E5E2] space-y-6 text-center text-xs">
                    <h4 className="font-semibold uppercase tracking-wider text-[#111111]">
                      SCAN & PAY VIA UPI ({formatPrice(estimatedTotal)})
                    </h4>

                    {/* Responsive Centered QR Code */}
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="relative w-48 h-48 sm:w-56 sm:h-56 bg-white border-2 border-[#111111] p-2 flex items-center justify-center">
                        {upiSettings.upiQrUrl ? (
                          <Image
                            src={upiSettings.upiQrUrl}
                            alt="FictionFigure UPI QR Code"
                            width={220}
                            height={220}
                            className="object-contain"
                          />
                        ) : (
                          <div className="text-center space-y-2 text-[#6B6B6B]">
                            <QrCode className="w-16 h-16 mx-auto text-[#111111]" />
                            <p className="text-[10px] uppercase font-mono">Scan QR Code via GPay / PhonePe</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] text-[#6B6B6B] block">Official UPI ID:</span>
                        <span className="font-mono font-bold text-sm text-[#111111] bg-[#F0F0ED] px-3 py-1 border border-[#E5E5E2] inline-block">
                          {upiSettings.upiId}
                        </span>
                      </div>
                    </div>

                    {/* UTR Input Field */}
                    <div className="space-y-2 max-w-md mx-auto text-left pt-2">
                      <label className="font-semibold uppercase text-[#111111] text-[11px]">
                        12-Digit Transaction / UTR Number *
                      </label>
                      <input
                        type="text"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="e.g. 423456789012"
                        className="w-full p-3 min-h-[44px] bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                      />
                      <span className="text-[10px] text-[#6B6B6B] block">
                        Enter the 12-digit UTR or Reference ID from your UPI app receipt after payment.
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(3)} className="text-xs font-semibold text-[#6B6B6B] hover:text-[#111111] min-h-[44px] px-2">
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(5)}
                    className="min-h-[44px] px-8 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors"
                  >
                    Review Final Order <ArrowRight className="w-4 h-4 inline ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Review Order */}
            {step === 5 && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-[#111111] border-b border-[#E5E5E2] pb-3">
                  Step 5 — Final Order Review
                </h3>
                <div className="p-4 bg-[#F7F7F5] border border-[#E5E5E2] space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#6B6B6B]">Customer Contact:</span>
                    <span className="text-[#111111] font-mono">{formData.phone}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#E5E5E2] pt-2">
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
                    <span className="text-[#111111] font-semibold">
                      {formData.paymentMethod === "UPI" ? `UPI QR (UTR: ${utrNumber || "N/A"})` : "Cash on Delivery (COD)"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(4)} className="text-xs font-semibold text-[#6B6B6B] hover:text-[#111111] min-h-[44px] px-2">
                    ← Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="min-h-[48px] px-10 py-4 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-colors flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting Order...
                      </>
                    ) : (
                      <>Place Order ({formatPrice(estimatedTotal)})</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Summary Box */}
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
                    <span>Discount (Code: {formData.couponCode})</span>
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
                  <span className="uppercase text-xs tracking-wider">Estimated Total</span>
                  <span className="font-mono text-[#111111]">{formatPrice(estimatedTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
