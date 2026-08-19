"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { formatPrice } from "@/lib/utils";
import {
  Check,
  Lock,
  QrCode,
  Banknote,
  ArrowLeft,
  Loader2,
  Phone,
  AlertCircle,
  ShieldCheck,
  Tag,
  ChevronDown,
  ChevronUp,
  MapPin,
  CreditCard,
  UserCheck,
} from "lucide-react";
import { API_BASE } from "@/lib/api";
import { MSG91OTPWidget, MSG91VerificationPayload } from "@/components/auth/MSG91OTPWidget";
import { normalizeIndianPhone } from "@/lib/phone";

export function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, cartSubtotal, clearCart } = useCart();
  const { shippingFee: configShippingFee, freeShippingThreshold: configThreshold } = useSettings();

  // State Management
  const [sessionToken, setSessionToken] = useState<string>("");
  const [isMobileVerified, setIsMobileVerified] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [isReviewStep, setIsReviewStep] = useState(false);

  // Address State
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");

  // Form State
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
    paymentMethod: "UPI" as "UPI" | "COD",
  });

  // Validation Errors State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Coupon State
  const [couponInput, setCouponInput] = useState(searchParams.get("coupon") || "");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Store Settings (UPI QR)
  const [upiSettings, setUpiSettings] = useState({
    upiId: "fictionfigure@upi",
    upiQrUrl: "",
  });
  const [utrNumber, setUtrNumber] = useState("");

  // 1. Fetch Store Settings for UPI QR on Mount
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

  // 2. Fetch Authenticated User Session & Saved Addresses on Mount
  useEffect(() => {
    const token = localStorage.getItem("fictionfigure_token");
    if (token) {
      setSessionToken(token);
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user && data.user.phoneVerified) {
            setIsMobileVerified(true);
            setFormData((prev) => ({
              ...prev,
              email: data.user.email || prev.email,
              phone: data.user.phone || prev.phone,
              fullName: `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim() || prev.fullName,
            }));

            // Fetch Saved Addresses
            fetch(`${API_BASE}/checkout/addresses`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((res) => res.json())
              .then((addrData) => {
                if (addrData.addresses && addrData.addresses.length > 0) {
                  setSavedAddresses(addrData.addresses);
                  const def = addrData.addresses.find((a: any) => a.isDefault) || addrData.addresses[0];
                  setSelectedAddressId(def.id);
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

  // 3. Handle Coupon Validation
  const handleApplyCoupon = async (codeToApply?: string) => {
    const targetCode = codeToApply || couponInput;
    if (!targetCode || !targetCode.trim()) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError("");

    try {
      const res = await fetch(`${API_BASE}/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: targetCode, cartSubtotal }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setAppliedCoupon(null);
        setCouponError(data.error || "Invalid coupon code.");
      } else {
        setAppliedCoupon({
          code: data.coupon.code,
          discountAmount: data.discountAmount,
        });
        setCouponError("");
      }
    } catch (err: any) {
      setCouponError("Failed to validate coupon code.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  // Re-validate coupon if cartSubtotal changes
  useEffect(() => {
    if (appliedCoupon && cartSubtotal > 0) {
      handleApplyCoupon(appliedCoupon.code);
    }
  }, [cartSubtotal]);

  // Exact Authoritative Business Rules for Price Calculation:
  // 1. FREE SHIPPING eligibility is based on subtotal >= configThreshold
  // 2. Shipping is configShippingFee if subtotal < configThreshold, otherwise FREE (₹0)
  // 3. COD handling fee is REMOVED completely (₹0)
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const shippingFee = cartSubtotal >= configThreshold || cartSubtotal === 0 ? 0 : configShippingFee;
  const codFee = 0; // REMOVED

  const afterDiscount = Math.max(0, cartSubtotal - couponDiscount);
  const grandTotal = Math.max(0, afterDiscount + shippingFee);

  // Form Input Change Handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate Address Fields
  const validateAddressForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) errors.fullName = "Full name is required.";
    if (!formData.streetAddress.trim()) errors.streetAddress = "Street address is required.";
    if (!formData.city.trim()) errors.city = "City is required.";
    if (!formData.state.trim()) errors.state = "State is required.";
    if (!formData.postalCode.trim()) {
      errors.postalCode = "6-digit PIN Code is required.";
    } else if (!/^\d{6}$/.test(formData.postalCode.trim())) {
      errors.postalCode = "Please enter a valid 6-digit Indian PIN Code (e.g. 334001).";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Mobile Authentication Identification Handler
  const handleIdentifyCustomer = async () => {
    const norm = normalizeIndianPhone(formData.phone);
    if (!norm) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setIsIdentifying(true);
    setErrorMessage("");

    try {
      const identifyRes = await fetch(`${API_BASE}/checkout/auth/identify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: norm }),
      });

      const identifyData = await identifyRes.json();
      if (!identifyRes.ok) throw new Error(identifyData.error || "Failed to identify mobile number.");

      setFormData((prev) => ({ ...prev, phone: norm }));

      // Existing Verified Customer -> Restore token & skip OTP
      if (identifyData.exists && identifyData.phoneVerified) {
        setIsMobileVerified(true);
        setIsOtpSent(false);
        if (identifyData.token) {
          localStorage.setItem("fictionfigure_token", identifyData.token);
          setSessionToken(identifyData.token);
        }
        if (identifyData.user) {
          setFormData((prev) => ({
            ...prev,
            fullName: `${identifyData.user.firstName || ""} ${identifyData.user.lastName || ""}`.trim() || prev.fullName,
            email: identifyData.user.email || prev.email,
          }));
        }
        return;
      }

      // New / Unverified Customer -> Trigger MSG91 OTP Widget
      setIsOtpSent(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process mobile verification.");
    } finally {
      setIsIdentifying(false);
    }
  };

  // OTP Success Callback from MSG91 OTP Widget
  const handleWidgetSuccess = async (payload: MSG91VerificationPayload) => {
    setIsVerifyingOtp(true);
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE}/checkout/auth/verify-widget-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formData.phone,
          accessToken: payload.accessToken,
          reqId: payload.reqId,
          email: formData.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "MSG91 OTP verification failed.");

      setIsMobileVerified(true);
      setIsOtpSent(false);

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
    } catch (err: any) {
      setErrorMessage(err.message || "OTP verification failed. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step 1 -> Step 2 Review Transition Handler
  const handleProceedToReview = () => {
    if (!isMobileVerified) {
      setErrorMessage("Please complete mobile phone verification under Contact Information first.");
      return;
    }

    if (!validateAddressForm()) {
      setErrorMessage("Please complete all required delivery address fields with a valid PIN code.");
      return;
    }

    if (formData.paymentMethod === "UPI" && (!utrNumber || utrNumber.trim().length < 6)) {
      setErrorMessage("Please enter a valid 12-digit UTR / Transaction Reference Number for your UPI payment.");
      return;
    }

    setErrorMessage("");
    setIsReviewStep(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Return to Form Edit Handler
  const handleEditSection = () => {
    setIsReviewStep(false);
    setErrorMessage("");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Final Order Submission Handler
  const handlePlaceOrder = async () => {
    // 1. Mobile verification check
    if (!isMobileVerified) {
      setErrorMessage("Please complete mobile phone verification under Contact Information first.");
      return;
    }

    // 2. Address validation
    if (!validateAddressForm()) {
      setErrorMessage("Please complete all required delivery address fields with a valid PIN code.");
      return;
    }

    // 3. Payment method details check
    if (formData.paymentMethod === "UPI" && (!utrNumber || utrNumber.trim().length < 6)) {
      setErrorMessage("Please enter a valid 12-digit UTR / Transaction Reference Number for your UPI payment.");
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
        couponCode: appliedCoupon ? appliedCoupon.code : "",
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
      if (!res.ok) throw new Error(data.error || "Failed to create order. Please try again.");

      clearCart();
      router.push(`/order/${data.orderNumber}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Order creation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Empty Cart Screen
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex flex-col justify-center items-center p-6 text-[#111111]">
        <div className="bg-white border border-[#E5E5E2] p-8 sm:p-12 text-center space-y-6 max-w-md w-full">
          <h2 className="text-xl font-bold uppercase tracking-wider text-[#111111]">
            Your Cart is Empty
          </h2>
          <p className="text-xs text-[#6B6B6B] leading-relaxed">
            There are no collectibles in your checkout cart. Please browse our catalog to add items before checking out.
          </p>
          <Link
            href="/shop"
            className="inline-block w-full min-h-[44px] px-6 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors"
          >
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  // Reusable Coupon Form Component
  const CouponComponent = () => (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B] block">
        Discount Code
      </label>
      {!appliedCoupon ? (
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Enter coupon code"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
            className="flex-1 p-2.5 bg-white border border-[#E5E5E2] font-mono text-xs uppercase focus:border-[#111111] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleApplyCoupon()}
            disabled={isValidatingCoupon}
            className="px-4 py-2.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black disabled:opacity-50 transition-colors shrink-0"
          >
            {isValidatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-[#2E6B44]/10 border border-[#2E6B44] text-[#2E6B44] font-semibold text-xs">
          <div className="flex items-center space-x-1.5 font-mono truncate mr-2">
            <Tag className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{appliedCoupon.code} (-{formatPrice(appliedCoupon.discountAmount)})</span>
          </div>
          <button
            type="button"
            onClick={handleRemoveCoupon}
            className="text-[#2E6B44] hover:underline text-[10px] uppercase font-bold shrink-0"
          >
            Remove
          </button>
        </div>
      )}
      {couponError && <p className="text-[11px] text-[#A83232]">{couponError}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#111111] flex flex-col font-sans">
      {/* 1. Header: FICTIONFIGURE Logo + Return to Cart Link */}
      <header className="bg-white border-b border-[#E5E5E2] sticky top-0 z-30">
        <div className="editorial-container flex justify-between items-center py-4 px-4 sm:px-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tighter uppercase text-[#111111] font-mono hover:opacity-80 transition-opacity"
          >
            FICTIONFIGURE
          </Link>

          <Link
            href="/cart"
            className="flex items-center space-x-1.5 text-xs text-[#6B6B6B] hover:text-[#111111] transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider text-[11px]">Return to Cart</span>
          </Link>
        </div>
      </header>

      {/* Mobile Collapsible Order Summary Accordion (< lg) */}
      <div className="lg:hidden bg-white border-b border-[#E5E5E2]">
        <button
          onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-medium text-[#111111]"
        >
          <div className="flex items-center space-x-2">
            <span className="font-semibold uppercase tracking-wider">Order Summary</span>
            <span className="text-[11px] text-[#6B6B6B] font-mono">({cart.length} items)</span>
          </div>
          <div className="flex items-center space-x-2 font-mono font-bold text-sm">
            <span>{formatPrice(grandTotal)}</span>
            {mobileSummaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {mobileSummaryOpen && (
          <div className="p-4 border-t border-[#E5E5E2] bg-[#F7F7F5] space-y-4 text-xs">
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.variantId} className="flex space-x-3 items-center">
                  <div className="relative w-12 h-12 bg-white shrink-0 border border-[#E5E5E2]">
                    {item.image && <Image src={item.image} alt={item.title} fill className="object-contain p-1" />}
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

            {/* Mobile Coupon Component */}
            <div className="pt-2 border-t border-[#E5E5E2]">
              <CouponComponent />
            </div>

            {/* Mobile Price Summary */}
            <div className="space-y-1.5 pt-2 border-t border-[#E5E5E2] text-xs">
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Subtotal</span>
                <span className="font-mono text-[#111111]">{formatPrice(cartSubtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-[#2E6B44]">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span className="font-mono">-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Shipping & Delivery</span>
                <span className="font-mono text-[#111111]">{shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}</span>
              </div>
              {codFee > 0 && (
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>COD Handling Fee</span>
                  <span className="font-mono text-[#111111]">{formatPrice(codFee)}</span>
                </div>
              )}
              <p className="text-[10px] text-[#6B6B6B] italic pt-1">
                Free shipping on orders of {formatPrice(configThreshold)} or more.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Checkout Grid Layout */}
      <main className="editorial-container py-6 sm:py-12 flex-1 px-4 sm:px-6">
        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN (~60% / 7 cols): Checkout Flow Sections OR Review Step */}
          <div className="lg:col-span-7 space-y-8 bg-white border border-[#E5E5E2] p-5 sm:p-8">
            {isReviewStep ? (
              /* REVIEW YOUR ORDER STEP */
              <div className="space-y-6">
                {/* Top Navigation Back */}
                <button
                  type="button"
                  onClick={handleEditSection}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#6B6B6B] hover:text-[#111111] uppercase tracking-wider transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>← Edit Details</span>
                </button>

                <div className="border-b border-[#E5E5E2] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B6B6B] block">
                    FINAL STEP BEFORE CONFIRMATION
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-[#111111]">
                    Review Your Order
                  </h2>
                  <p className="text-xs text-[#6B6B6B] mt-1">
                    Please check your details carefully before placing your order.
                  </p>
                </div>

                {/* 1. DELIVERY DETAILS */}
                <div className="p-4 sm:p-5 bg-[#F7F7F5] border border-[#E5E5E2] space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-2.5">
                    <h4 className="font-bold uppercase tracking-wider text-[#111111] flex items-center">
                      <MapPin className="w-4 h-4 mr-1.5 text-[#111111]" /> 1. Delivery Details
                    </h4>
                    <button
                      type="button"
                      onClick={handleEditSection}
                      className="text-[11px] font-bold uppercase tracking-wider text-[#111111] hover:underline px-2.5 py-1 bg-white border border-[#E5E5E2] min-h-[36px] flex items-center"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#6B6B6B]">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#111111] block">Full Name</span>
                      <span className="text-[#111111] font-semibold">{formData.fullName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#111111] block">Mobile Number</span>
                      <span className="text-[#111111] font-mono">{formData.phone}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-[#111111] block">Delivery Address</span>
                      <span className="text-[#111111] leading-relaxed block font-medium">
                        {formData.streetAddress}
                        {formData.apartment ? `, ${formData.apartment}` : ""}
                      </span>
                      <span className="text-[#6B6B6B] block mt-0.5">
                        {formData.city}, {formData.state} - {formData.postalCode}, {formData.country}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. ORDER ITEMS */}
                <div className="p-4 sm:p-5 bg-[#F7F7F5] border border-[#E5E5E2] space-y-4 text-xs">
                  <h4 className="font-bold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2.5">
                    2. Order Items ({cart.length})
                  </h4>

                  <div className="divide-y divide-[#E5E5E2]">
                    {cart.map((item) => (
                      <div key={item.variantId} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="relative w-12 h-12 bg-white shrink-0 border border-[#E5E5E2]">
                            {item.image && <Image src={item.image} alt={item.title} fill className="object-contain p-1" />}
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <h5 className="font-semibold text-[#111111] truncate">{item.title}</h5>
                            <span className="text-[11px] text-[#6B6B6B] block">
                              Qty: {item.quantity} × {formatPrice(item.price)}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono font-semibold text-[#111111] shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. PAYMENT METHOD */}
                <div className="p-4 sm:p-5 bg-[#F7F7F5] border border-[#E5E5E2] space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-2.5">
                    <h4 className="font-bold uppercase tracking-wider text-[#111111] flex items-center">
                      <CreditCard className="w-4 h-4 mr-1.5 text-[#111111]" /> 3. Payment
                    </h4>
                    <button
                      type="button"
                      onClick={handleEditSection}
                      className="text-[11px] font-bold uppercase tracking-wider text-[#111111] hover:underline px-2.5 py-1 bg-white border border-[#E5E5E2] min-h-[36px] flex items-center"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">Payment Method</span>
                      <span className="font-bold text-[#111111]">
                        {formData.paymentMethod === "UPI" ? "UPI / Online Payment" : "Cash on Delivery (COD)"}
                      </span>
                    </div>

                    {formData.paymentMethod === "UPI" ? (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">UTR / Transaction Reference</span>
                        <span className="font-mono font-bold text-[#111111] bg-white px-2.5 py-1 border border-[#E5E5E2] inline-block mt-0.5">
                          {utrNumber}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">Payment Terms</span>
                        <span className="text-[#111111]">Cash on Delivery (+₹100 COD handling fee)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. SHIPPING & DELIVERY */}
                <div className="p-4 sm:p-5 bg-[#F7F7F5] border border-[#E5E5E2] space-y-2 text-xs">
                  <h4 className="font-bold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2.5">
                    4. Shipping & Delivery
                  </h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#6B6B6B]">Standard Shipping</span>
                    <span className="font-mono font-bold text-[#111111]">
                      {shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}
                    </span>
                  </div>
                </div>

                {/* 5. DISCOUNT (IF APPLIED) */}
                {appliedCoupon && (
                  <div className="p-4 sm:p-5 bg-[#F7F7F5] border border-[#E5E5E2] space-y-2 text-xs">
                    <h4 className="font-bold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2.5">
                      5. Coupon Discount
                    </h4>
                    <div className="flex justify-between items-center text-xs text-[#2E6B44] font-semibold">
                      <span>Coupon ({appliedCoupon.code})</span>
                      <span className="font-mono">-{formatPrice(couponDiscount)}</span>
                    </div>
                  </div>
                )}

                {/* 6. FINAL TOTAL SUMMARY & CTA */}
                <div className="p-4 sm:p-5 bg-white border-2 border-[#111111] space-y-4 text-xs">
                  <h4 className="font-bold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2.5">
                    Final Order Total
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-[#6B6B6B]">
                      <span>Subtotal</span>
                      <span className="font-mono text-[#111111]">{formatPrice(cartSubtotal)}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-[#2E6B44]">
                        <span>Discount ({appliedCoupon?.code})</span>
                        <span className="font-mono">-{formatPrice(couponDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#6B6B6B]">
                      <span>Shipping & Delivery</span>
                      <span className="font-mono text-[#111111]">
                        {shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}
                      </span>
                    </div>
                    {codFee > 0 && (
                      <div className="flex justify-between text-[#6B6B6B]">
                        <span>COD Handling Fee</span>
                        <span className="font-mono text-[#111111]">{formatPrice(codFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 border-t border-[#E5E5E2] text-sm font-extrabold text-[#111111]">
                      <span className="uppercase tracking-wider">Total Amount</span>
                      <span className="font-mono text-lg">{formatPrice(grandTotal)}</span>
                    </div>
                  </div>

                  {/* FINAL PLACE ORDER CTA */}
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="w-full min-h-[52px] px-6 sm:px-8 py-4 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span>Creating Order...</span>
                      </>
                    ) : (
                      <span>PLACE ORDER — {formatPrice(grandTotal)}</span>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-[#6B6B6B]">
                    By clicking Place Order, your order will be confirmed and created in our system.
                  </p>
                </div>
              </div>
            ) : (
              /* FORM FLOW (SECTIONS 1, 2, 3) */
              <>
                {/* SECTION 1: CONTACT INFORMATION */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#111111] flex items-center">
                      <UserCheck className="w-4 h-4 mr-2 text-[#111111]" /> 1. Contact Information
                    </h3>
                    {isMobileVerified && (
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2E6B44] bg-[#2E6B44]/10 px-2 py-0.5 border border-[#2E6B44]/20 flex items-center">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                      </span>
                    )}
                  </div>

                  {isMobileVerified ? (
                    <div className="p-4 bg-[#F7F7F5] border border-[#E5E5E2] space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-[#111111] block">
                            {formData.fullName || "Customer"}
                          </span>
                          <span className="text-[#6B6B6B] font-mono block">{formData.phone}</span>
                          {formData.email && <span className="text-[#6B6B6B] block text-[11px]">{formData.email}</span>}
                        </div>
                        <button
                          onClick={() => setIsMobileVerified(false)}
                          className="text-[11px] text-[#6B6B6B] hover:text-[#111111] underline uppercase tracking-wider font-medium"
                        >
                          Change Number
                        </button>
                      </div>
                    </div>
                  ) : !isOtpSent ? (
                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">
                            Mobile Phone Number *
                          </label>
                          <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+91 98765 43210"
                            className="w-full p-3 min-h-[44px] bg-[#F7F7F5] border border-[#E5E5E2] text-xs text-[#111111] focus:border-[#111111] focus:outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">
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

                      <button
                        type="button"
                        onClick={handleIdentifyCustomer}
                        disabled={isIdentifying}
                        className="w-full min-h-[44px] px-6 py-3 bg-[#111111] text-white text-xs font-semibold uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-colors flex items-center justify-center"
                      >
                        {isIdentifying ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Phone className="w-4 h-4 mr-2" />
                        )}
                        <span>VERIFY MOBILE VIA OTP</span>
                      </button>
                    </div>
                  ) : (
                    /* MSG91 Web OTP Widget */
                    <div className="p-5 bg-[#F7F7F5] border border-[#E5E5E2] space-y-4 text-xs">
                      <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-3">
                        <div>
                          <h4 className="font-semibold uppercase tracking-wider text-[#111111]">
                            Verify OTP Sent to {formData.phone}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsOtpSent(false)}
                          className="text-[#6B6B6B] hover:text-[#111111] underline uppercase tracking-wider text-[10px]"
                        >
                          Change Phone
                        </button>
                      </div>

                      <MSG91OTPWidget
                        phone={formData.phone}
                        onSuccess={handleWidgetSuccess}
                        onError={(err) => setErrorMessage(err)}
                      />
                    </div>
                  )}
                </section>

                {/* SECTION 2: DELIVERY ADDRESS */}
                <section className="space-y-4 pt-4 border-t border-[#E5E5E2]">
                  <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#111111] flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-[#111111]" /> 2. Delivery Address
                    </h3>
                  </div>

                  {/* Saved Address Cards */}
                  {savedAddresses.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-[11px] font-semibold uppercase text-[#6B6B6B] block">
                        Saved Addresses
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {savedAddresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id;
                          return (
                            <div
                              key={addr.id}
                              onClick={() => {
                                setSelectedAddressId(addr.id);
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
                                setFieldErrors({});
                              }}
                              className={`p-3.5 border cursor-pointer text-xs space-y-1.5 transition-all ${
                                isSelected
                                  ? "border-[#111111] bg-[#F7F7F5] shadow-2xs"
                                  : "border-[#E5E5E2] hover:border-[#111111]"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-[#111111]">{addr.fullName}</span>
                                {isSelected && (
                                  <span className="w-2 h-2 rounded-full bg-[#111111]"></span>
                                )}
                              </div>
                              <p className="text-[#6B6B6B] text-[11px] leading-tight">
                                {addr.streetAddress}, {addr.apartment ? `${addr.apartment}, ` : ""}
                                {addr.city}, {addr.state} - {addr.postalCode}
                              </p>
                            </div>
                          );
                        })}

                        <div
                          onClick={() => {
                            setSelectedAddressId("new");
                            setFormData((prev) => ({
                              ...prev,
                              streetAddress: "",
                              apartment: "",
                              city: "",
                              state: "",
                              postalCode: "",
                            }));
                          }}
                          className={`p-3.5 border border-dashed text-center flex items-center justify-center cursor-pointer text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] hover:text-[#111111] hover:border-[#111111] ${
                            selectedAddressId === "new" ? "border-[#111111] bg-[#F7F7F5]" : "border-[#E5E5E2]"
                          }`}
                        >
                          + Add New Address
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address Form Inputs */}
                  <div className="space-y-4 text-xs pt-2">
                    <div className="space-y-1">
                      <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="e.g. Ren Amamiya"
                        className="w-full p-3 min-h-[44px] bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                      />
                      {fieldErrors.fullName && (
                        <p className="text-[11px] text-[#A83232]">{fieldErrors.fullName}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">
                        Street Address (Flat / House No. / Building / Street) *
                      </label>
                      <input
                        type="text"
                        name="streetAddress"
                        value={formData.streetAddress}
                        onChange={handleInputChange}
                        placeholder="e.g. 42 Collector's Enclave, Station Road"
                        className="w-full p-3 min-h-[44px] bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                      />
                      {fieldErrors.streetAddress && (
                        <p className="text-[11px] text-[#A83232]">{fieldErrors.streetAddress}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">
                          Apartment / Suite / Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          name="apartment"
                          value={formData.apartment}
                          onChange={handleInputChange}
                          placeholder="Near City Circle"
                          className="w-full p-3 min-h-[44px] bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">
                          City *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Bikaner"
                          className="w-full p-3 min-h-[44px] bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                        />
                        {fieldErrors.city && (
                          <p className="text-[11px] text-[#A83232]">{fieldErrors.city}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">
                          State *
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="Rajasthan"
                          className="w-full p-3 min-h-[44px] bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                        />
                        {fieldErrors.state && (
                          <p className="text-[11px] text-[#A83232]">{fieldErrors.state}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">
                          PIN Code (6 Digits) *
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          maxLength={6}
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          placeholder="334001"
                          className="w-full p-3 min-h-[44px] bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-[#111111] focus:border-[#111111] focus:outline-none"
                        />
                        {fieldErrors.postalCode && (
                          <p className="text-[11px] text-[#A83232]">{fieldErrors.postalCode}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          readOnly
                          className="w-full p-3 min-h-[44px] bg-[#E5E5E2]/50 border border-[#E5E5E2] text-[#6B6B6B] cursor-not-allowed focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* SECTION 3: PAYMENT METHOD */}
                <section className="space-y-4 pt-4 border-t border-[#E5E5E2]">
                  <div className="border-b border-[#E5E5E2] pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#111111] flex items-center">
                      <CreditCard className="w-4 h-4 mr-2 text-[#111111]" /> 3. Payment Method
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* UPI Option */}
                    <label
                      onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: "UPI" }))}
                      className={`flex items-start space-x-3 p-4 border cursor-pointer transition-all ${
                        formData.paymentMethod === "UPI" ? "border-[#111111] bg-[#F7F7F5]" : "border-[#E5E5E2] hover:border-[#111111]"
                      }`}
                    >
                      <QrCode className="w-5 h-5 text-[#111111] shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#111111] block">UPI / Online Payment (Instant QR Code)</span>
                        <span className="text-[#6B6B6B] text-[11px]">
                          Scan using Google Pay, PhonePe, Paytm, BHIM, or any UPI banking app.
                        </span>
                      </div>
                    </label>

                    {/* COD Option */}
                    <label
                      onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: "COD" }))}
                      className={`flex items-start space-x-3 p-4 border cursor-pointer transition-all ${
                        formData.paymentMethod === "COD" ? "border-[#111111] bg-[#F7F7F5]" : "border-[#E5E5E2] hover:border-[#111111]"
                      }`}
                    >
                      <Banknote className="w-5 h-5 text-[#111111] shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#111111] block">Cash on Delivery (COD)</span>
                        <span className="text-[#6B6B6B] text-[11px]">
                          Pay cash upon physical arrival at your doorstep.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* UPI Sub-Section (Responsive QR & UTR input) */}
                  {formData.paymentMethod === "UPI" && (
                    <div className="p-4 sm:p-6 bg-[#F7F7F5] border border-[#E5E5E2] space-y-5 text-center text-xs">
                      <h4 className="font-bold uppercase tracking-wider text-[#111111]">
                        SCAN & PAY VIA UPI ({formatPrice(grandTotal)})
                      </h4>

                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="relative w-40 h-40 max-w-full bg-white border-2 border-[#111111] p-2 flex items-center justify-center mx-auto">
                          {upiSettings.upiQrUrl ? (
                            <Image
                              src={upiSettings.upiQrUrl}
                              alt="FictionFigure UPI QR Code"
                              width={160}
                              height={160}
                              className="object-contain max-w-full h-auto"
                            />
                          ) : (
                            <div className="text-center space-y-2 text-[#6B6B6B]">
                              <QrCode className="w-12 h-12 mx-auto text-[#111111]" />
                              <p className="text-[10px] uppercase font-mono">Scan QR via GPay / PhonePe</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 max-w-full overflow-hidden">
                          <span className="text-[11px] text-[#6B6B6B] block">Official UPI ID:</span>
                          <span className="font-mono font-bold text-xs sm:text-sm text-[#111111] bg-white px-3 py-1 border border-[#E5E5E2] inline-block truncate max-w-full">
                            {upiSettings.upiId}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 max-w-md mx-auto text-left pt-2">
                        <label className="font-bold uppercase text-[#111111] text-[11px]">
                          12-Digit UTR / Transaction Reference Number *
                        </label>
                        <input
                          type="text"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                          placeholder="e.g. 423456789012"
                          className="w-full p-3 min-h-[44px] bg-white border border-[#E5E5E2] font-mono text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                        />
                        <span className="text-[10px] text-[#6B6B6B] block">
                          Enter the 12-digit UTR or Reference ID from your UPI app receipt after making payment.
                        </span>
                      </div>
                    </div>
                  )}
                </section>

                {/* Mobile Coupon Section (Visible on Mobile) */}
                <div className="lg:hidden pt-4 border-t border-[#E5E5E2]">
                  <CouponComponent />
                </div>

                {/* CONTINUE TO REVIEW STEP CTA */}
                <div className="pt-4 border-t border-[#E5E5E2]">
                  <button
                    type="button"
                    onClick={handleProceedToReview}
                    className="w-full min-h-[52px] px-6 sm:px-8 py-4 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>REVIEW ORDER — {formatPrice(grandTotal)}</span>
                  </button>

                  <p className="text-[10px] text-center text-[#6B6B6B] mt-3">
                    You will have a final opportunity to review your address and items before the order is placed.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* RIGHT COLUMN (~40% / 5 cols): Desktop Order Summary Sidebar */}
          <aside className="hidden lg:block lg:col-span-5 space-y-6 sticky top-24">
            <div className="bg-white border border-[#E5E5E2] p-6 space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#111111] border-b border-[#E5E5E2] pb-3">
                Order Summary ({cart.length})
              </h3>

              {/* Product Items List */}
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.variantId} className="flex space-x-3 items-center text-xs">
                    <div className="relative w-14 h-14 bg-[#F7F7F5] shrink-0 border border-[#E5E5E2]">
                      {item.image && <Image src={item.image} alt={item.title} fill className="object-contain p-1" />}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h5 className="font-semibold text-[#111111] truncate">{item.title}</h5>
                      <div className="text-[10px] text-[#6B6B6B] flex items-center space-x-2">
                        <span>Qty: {item.quantity}</span>
                        <span>•</span>
                        <span className="font-mono">{formatPrice(item.price)} each</span>
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-[#111111]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Desktop Coupon Code Entry Box */}
              <div className="pt-4 border-t border-[#E5E5E2]">
                <CouponComponent />
              </div>

              {/* Authoritative Price Breakdown Table */}
              <div className="space-y-2.5 pt-4 border-t border-[#E5E5E2] text-xs">
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Subtotal</span>
                  <span className="font-mono text-[#111111]">{formatPrice(cartSubtotal)}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-[#2E6B44]">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span className="font-mono">-{formatPrice(couponDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Shipping & Delivery</span>
                  <span className="font-mono text-[#111111]">
                    {shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}
                  </span>
                </div>

                {codFee > 0 && (
                  <div className="flex justify-between text-[#6B6B6B]">
                    <span>COD Handling Fee</span>
                    <span className="font-mono text-[#111111]">{formatPrice(codFee)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-[#E5E5E2] text-sm font-bold">
                  <span className="uppercase text-xs tracking-wider">Total Amount</span>
                  <span className="font-mono text-base text-[#111111]">{formatPrice(grandTotal)}</span>
                </div>

                <p className="text-[10px] text-[#6B6B6B] italic pt-1 text-right">
                  Free shipping on orders of {formatPrice(configThreshold)} or more.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
