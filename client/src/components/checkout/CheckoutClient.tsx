"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { OrderTotals } from "@/components/checkout/OrderTotals";
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
  const { cart, cartSubtotal, clearCart, isHydrating, isValidating, reconcileCart } = useCart();
  const { shippingFee: configShippingFee, freeShippingThreshold: configThreshold } = useSettings();
  const isOrderPlacedRef = React.useRef(false);

  useEffect(() => {
    if (!isHydrating && !isValidating && cart.length === 0 && !isOrderPlacedRef.current) {
      router.replace("/cart");
    }
  }, [cart.length, isHydrating, isValidating, router]);

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

  const { upiId: contextUpiId, upiQrUrl: contextUpiQrUrl } = useSettings();

  // 1. Fetch Store Settings for UPI QR on Mount
  useEffect(() => {
    fetch(`${API_BASE}/settings`)
      .then((res) => res.json())
      .then((data) => {
        setUpiSettings({
          upiId: data.upiId || data.settings?.upi_id || "fictionfigure@upi",
          upiQrUrl: data.upiQrUrl || data.settings?.upi_qr_url || "",
        });
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

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order. Please try again.");

      isOrderPlacedRef.current = true;
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
      <div className="min-h-screen bg-[#08090B] flex flex-col justify-center items-center p-6 text-[#F7F7F5]">
        <div className="rounded-[16px] border border-white/[0.08] bg-[#111318] p-8 sm:p-12 text-center space-y-6 max-w-md w-full">
          <p className="ff-eyebrow justify-center">Secure checkout</p>
          <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-white">
            Your Cart is Empty
          </h2>
          <p className="text-[14px] text-[#C9CBD1] leading-relaxed">
            There are no collectibles in your checkout cart. Please browse our catalog to add items before checking out.
          </p>
          <Link
            href="/shop"
            className="ff-btn ff-btn-gold w-full"
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
      <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9DA5] block">
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
            className="flex-1 min-w-0 h-11 px-3 bg-[#0D0E12] border border-white/[0.08] font-mono text-xs uppercase text-white focus:border-[#F5C518]/60 focus:outline-none rounded-[8px] placeholder:text-[#6E717A] transition-colors"
          />
          <button
            type="button"
            onClick={() => handleApplyCoupon()}
            disabled={isValidatingCoupon}
            className="ff-btn ff-btn-outline h-11 px-4 shrink-0 disabled:opacity-50"
          >
            {isValidatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-[8px] bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-semibold text-xs">
          <div className="flex items-center space-x-1.5 font-mono truncate mr-2">
            <Tag className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{appliedCoupon.code} (-{formatPrice(appliedCoupon.discountAmount)})</span>
          </div>
          <button
            type="button"
            onClick={handleRemoveCoupon}
            className="text-emerald-400 hover:underline text-[10px] uppercase font-bold shrink-0"
          >
            Remove
          </button>
        </div>
      )}
      {couponError && <p className="text-[11px] text-rose-300">{couponError}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#08090B] text-[#F7F7F5] flex flex-col font-sans">
      {/* 1. Simplified checkout header (FICTIONFIGURE dark system) */}
      <header className="sticky top-0 z-30 bg-[#08090B]/90 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="ff-container h-16 flex justify-between items-center gap-4">
          <Link href="/" className="flex items-center shrink-0" aria-label="FictionFigure home">
            <Image src="/fictionfigure-logo-dark.svg" alt="FictionFigure" width={160} height={40} className="h-9 w-auto" priority />
          </Link>

          <ol className="hidden sm:flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]" aria-label="Checkout progress">
            <li className={isReviewStep ? "text-[#9A9DA5]" : "text-[#F5C518]"}>01 Details</li>
            <li className="w-8 h-px bg-white/15" aria-hidden />
            <li className={isReviewStep ? "text-[#F5C518]" : "text-[#6E717A]"}>02 Review</li>
            <li className="w-8 h-px bg-white/15" aria-hidden />
            <li className="text-[#6E717A]">03 Confirmed</li>
          </ol>

          <Link
            href="/cart"
            className="min-h-[44px] flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A9DA5] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Cart</span>
          </Link>
        </div>
      </header>

      {/* Mobile Collapsible Order Summary Accordion (< lg) */}
      <div className="lg:hidden bg-[#111318] border-b border-white/[0.08]">
        <button
          onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
          className="w-full px-4 min-h-[52px] flex items-center justify-between text-xs font-medium text-[#F7F7F5]"
        >
          <div className="flex items-center space-x-2">
            <span className="font-semibold uppercase tracking-wider">Order Summary</span>
            <span className="text-[11px] text-[#9A9DA5] font-mono">({cart.length} items)</span>
          </div>
          <div className="flex items-center space-x-2 font-mono font-bold text-sm">
            <span>{formatPrice(grandTotal)}</span>
            {mobileSummaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {mobileSummaryOpen && (
          <div className="p-4 border-t border-white/[0.08] bg-[#17191F] space-y-4 text-xs">
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.variantId} className="flex space-x-3 items-center">
                  <div className="relative w-12 h-12 bg-[#0D0E12] shrink-0 border border-white/[0.08] rounded-md overflow-hidden p-0.5">
                    {item.image && <Image src={item.image} alt={item.title} fill className="object-contain p-0.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-[#F7F7F5] truncate">{item.title}</h5>
                    {item.variantTitle && (
                      <span className="text-[10px] font-medium text-[#9A9DA5] block">
                        Variant: <strong className="font-mono text-[#F7F7F5]">{item.variantTitle}</strong>
                      </span>
                    )}
                    <span className="text-[10px] text-[#9A9DA5]">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-mono font-semibold text-[#F7F7F5]">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Mobile Coupon Component */}
            <div className="pt-2 border-t border-white/[0.08]">
              <CouponComponent />
            </div>

            {/* Mobile Price Summary */}
            <div className="pt-3 border-t border-white/[0.08]">
              <OrderTotals
                subtotal={cartSubtotal}
                discount={couponDiscount}
                discountCode={appliedCoupon?.code}
                shipping={shippingFee}
                codFee={codFee}
                total={grandTotal}
                totalLabel="Total Amount"
                freeShippingThreshold={configThreshold}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Checkout Grid Layout */}
      <main className="ff-container py-6 sm:py-10 flex-1">
        {!isReviewStep && (
          <div className="mb-6 lg:mb-8 space-y-2">
            <p className="ff-eyebrow">Secure checkout</p>
            <h1 className="text-[30px] sm:text-[38px] font-extrabold leading-[1.05] tracking-[-0.02em] text-white">Checkout</h1>
          </div>
        )}
        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-[10px] bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN (~60% / 7 cols): Checkout Flow Sections OR Review Step */}
          <div className="lg:col-span-7 space-y-4">
            {isReviewStep ? (
              /* REVIEW YOUR ORDER STEP */
              <div className="space-y-5 rounded-[14px] border border-white/[0.08] bg-[#111318] p-5 sm:p-8">
                {/* Top Navigation Back */}
                <button
                  type="button"
                  onClick={handleEditSection}
                  className="min-h-[44px] inline-flex items-center space-x-1.5 text-xs font-semibold text-[#9A9DA5] hover:text-white uppercase tracking-wider transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Edit Details</span>
                </button>

                <div className="border-b border-white/[0.08] pb-4">
                  <span className="ff-eyebrow">Final step before confirmation</span>
                  <h1 className="mt-2 text-[28px] sm:text-[34px] font-extrabold leading-[1.05] tracking-[-0.02em] text-white">
                    Review Your Order
                  </h1>
                  <p className="text-[13px] text-[#9A9DA5] mt-2">
                    Please check your details carefully before placing your order.
                  </p>
                </div>

                {/* 1. DELIVERY DETAILS */}
                <div className="p-4 sm:p-5 bg-[#17191F] border border-white/[0.08] space-y-3 text-xs rounded-[10px]">
                  <div className="flex justify-between items-center border-b border-white/[0.08] pb-2.5">
                    <h4 className="font-bold uppercase tracking-wider text-[#F7F7F5] flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-[#F5C518]" /> 01 Delivery Details
                    </h4>
                    <button
                      type="button"
                      onClick={handleEditSection}
                      className="text-[11px] font-bold uppercase tracking-wider text-[#F7F7F5] hover:underline px-3 rounded-[6px] bg-[#111318] border border-white/[0.08] min-h-[44px] flex items-center"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#9A9DA5]">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#F7F7F5] block">Full Name</span>
                      <span className="text-[#F7F7F5] font-semibold">{formData.fullName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#F7F7F5] block">Mobile Number</span>
                      <span className="text-[#F7F7F5] font-mono">{formData.phone}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-[#F7F7F5] block">Delivery Address</span>
                      <span className="text-[#F7F7F5] leading-relaxed block font-medium">
                        {formData.streetAddress}
                        {formData.apartment ? `, ${formData.apartment}` : ""}
                      </span>
                      <span className="text-[#9A9DA5] block mt-0.5">
                        {formData.city}, {formData.state} - {formData.postalCode}, {formData.country}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. ORDER ITEMS */}
                <div className="p-4 sm:p-5 bg-[#17191F] border border-white/[0.08] space-y-4 text-xs rounded-[10px]">
                  <h4 className="font-bold uppercase tracking-wider text-[#F7F7F5] border-b border-white/[0.08] pb-2.5">
                    02 Order Items ({cart.length})
                  </h4>

                  <div className="divide-y divide-white/[0.06]">
                    {cart.map((item) => (
                      <div key={item.variantId} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="relative w-12 h-12 bg-[#0D0E12] shrink-0 border border-white/[0.08] rounded-md overflow-hidden p-0.5">
                            {item.image && <Image src={item.image} alt={item.title} fill className="object-contain p-0.5" />}
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <h5 className="font-semibold text-[#F7F7F5] truncate">{item.title}</h5>
                            {item.variantTitle && (
                              <p className="text-[11px] font-medium text-[#9A9DA5]">
                                Variant: <strong className="font-mono text-[#F7F7F5]">{item.variantTitle}</strong>
                              </p>
                            )}
                            <span className="text-[11px] text-[#9A9DA5] block">
                              Qty: {item.quantity} × {formatPrice(item.price)}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono font-semibold text-[#F7F7F5] shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. PAYMENT METHOD */}
                <div className="p-4 sm:p-5 bg-[#17191F] border border-white/[0.08] space-y-3 text-xs rounded-[10px]">
                  <div className="flex justify-between items-center border-b border-white/[0.08] pb-2.5">
                    <h4 className="font-bold uppercase tracking-wider text-[#F7F7F5] flex items-center">
                      <CreditCard className="w-4 h-4 mr-2 text-[#F5C518]" /> 03 Payment
                    </h4>
                    <button
                      type="button"
                      onClick={handleEditSection}
                      className="text-[11px] font-bold uppercase tracking-wider text-[#F7F7F5] hover:underline px-3 rounded-[6px] bg-[#111318] border border-white/[0.08] min-h-[44px] flex items-center"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#9A9DA5] block">Payment Method</span>
                      <span className="font-bold text-[#F7F7F5]">
                        {formData.paymentMethod === "UPI" ? "UPI / Online Payment" : "Cash on Delivery (COD)"}
                      </span>
                    </div>

                    {formData.paymentMethod === "UPI" ? (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#9A9DA5] block">Payment Terms</span>
                        <span className="text-[#F7F7F5]">Instant UPI QR Payment</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#9A9DA5] block">Payment Terms</span>
                        <span className="text-[#F7F7F5]">Cash on Delivery</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. SHIPPING & DELIVERY */}
                <div className="p-4 sm:p-5 bg-[#17191F] border border-white/[0.08] space-y-2 text-xs rounded-[10px]">
                  <h4 className="font-bold uppercase tracking-wider text-[#F7F7F5] border-b border-white/[0.08] pb-2.5">
                    04 Shipping &amp; Delivery
                  </h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9A9DA5]">Standard Shipping</span>
                    <span className="font-mono font-bold text-[#F7F7F5]">
                      {shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}
                    </span>
                  </div>
                </div>

                {/* 5. DISCOUNT (IF APPLIED) */}
                {appliedCoupon && (
                  <div className="p-4 sm:p-5 bg-[#17191F] border border-white/[0.08] space-y-2 text-xs rounded-[10px]">
                    <h4 className="font-bold uppercase tracking-wider text-[#F7F7F5] border-b border-white/[0.08] pb-2.5">
                      05 Coupon Discount
                    </h4>
                    <div className="flex justify-between items-center text-xs text-emerald-400 font-semibold">
                      <span>Coupon ({appliedCoupon.code})</span>
                      <span className="font-mono">-{formatPrice(couponDiscount)}</span>
                    </div>
                  </div>
                )}

                {/* 6. FINAL TOTAL SUMMARY & CTA */}
                <div className="p-4 sm:p-6 rounded-[12px] bg-[#0D0E12] border border-[#F5C518]/40 space-y-5">
                  <h4 className="text-[12px] font-bold uppercase tracking-[0.14em] text-white border-b border-white/[0.08] pb-2.5">
                    Final Order Total
                  </h4>

                  <OrderTotals
                    subtotal={cartSubtotal}
                    discount={couponDiscount}
                    discountCode={appliedCoupon?.code}
                    shipping={shippingFee}
                    codFee={codFee}
                    total={grandTotal}
                    totalLabel="Total Amount"
                  />

                  {/* FINAL PLACE ORDER CTA */}
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="ff-btn ff-btn-gold w-full h-14 text-[13px] disabled:opacity-50 disabled:pointer-events-none"
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

                  <p className="text-[10px] text-center text-[#9A9DA5]">
                    By clicking Place Order, your order will be confirmed and created in our system.
                  </p>
                </div>
              </div>
            ) : (
              /* FORM FLOW (SECTIONS 1, 2, 3) */
              <>
                {/* SECTION 1: CONTACT INFORMATION */}
                <section className="space-y-4 rounded-[14px] border border-white/[0.08] bg-[#111318] p-5 sm:p-6">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#F7F7F5] flex items-center">
                      <span className="flex flex-col"><span className="ff-eyebrow">Step 01</span><span className="mt-1.5 text-[17px] font-bold normal-case tracking-normal text-white">Contact information</span></span>
                    </h3>
                    {isMobileVerified && (
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/25 flex items-center">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                      </span>
                    )}
                  </div>

                  {isMobileVerified ? (
                    <div className="p-4 rounded-[10px] bg-[#17191F] border border-white/[0.08] space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-[#F7F7F5] block">
                            {formData.fullName || "Customer"}
                          </span>
                          <span className="text-[#9A9DA5] font-mono block">{formData.phone}</span>
                          {formData.email && <span className="text-[#9A9DA5] block text-[11px]">{formData.email}</span>}
                        </div>
                        <button
                          onClick={() => setIsMobileVerified(false)}
                          className="text-[11px] text-[#9A9DA5] hover:text-white underline uppercase tracking-wider font-medium"
                        >
                          Change Number
                        </button>
                      </div>
                    </div>
                  ) : !isOtpSent ? (
                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-semibold uppercase text-[#9A9DA5] text-[11px]">
                            Mobile Phone Number *
                          </label>
                          <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+91 98765 43210"
                            className="w-full h-12 px-4 bg-[#0D0E12] border border-white/[0.08] text-xs text-[#F7F7F5] focus:border-[#F5C518]/60 focus:outline-none font-mono rounded-[8px] placeholder:text-[#6E717A] transition-colors"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-semibold uppercase text-[#9A9DA5] text-[11px]">
                            Email Address (Optional)
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="collector@domain.com"
                            className="w-full h-12 px-4 bg-[#0D0E12] border border-white/[0.08] text-xs text-[#F7F7F5] focus:border-[#F5C518]/60 focus:outline-none rounded-[8px] placeholder:text-[#6E717A] transition-colors"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleIdentifyCustomer}
                        disabled={isIdentifying}
                        className="w-full min-h-[44px] px-6 py-3 bg-[#F5C518] text-[#08090B] text-xs font-semibold uppercase tracking-widest hover:bg-[#FFD43B] disabled:opacity-50 transition-colors flex items-center justify-center rounded-[6px]"
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
                    <div className="p-5 rounded-[10px] bg-[#17191F] border border-white/[0.08] space-y-4 text-xs">
                      <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
                        <div>
                          <h4 className="font-semibold uppercase tracking-wider text-[#F7F7F5]">
                            Verify OTP Sent to {formData.phone}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsOtpSent(false)}
                          className="text-[#9A9DA5] hover:text-white underline uppercase tracking-wider text-[10px]"
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
<section className="space-y-4 rounded-[14px] border border-white/[0.08] bg-[#111318] p-5 sm:p-6">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#F7F7F5] flex items-center">
                      <span className="flex flex-col"><span className="ff-eyebrow">Step 02</span><span className="mt-1.5 text-[17px] font-bold normal-case tracking-normal text-white">Delivery address</span></span>
                    </h3>
                  </div>

                  {/* Saved Address Cards */}
                  {savedAddresses.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-[11px] font-semibold uppercase text-[#9A9DA5] block">
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
                              className={`p-3.5 rounded-[10px] border cursor-pointer text-xs space-y-1.5 transition-all duration-200 ${
                                isSelected
                                  ? "border-[#F5C518]/70 bg-[#F5C518]/[0.06] shadow-[0_0_0_1px_rgba(245,197,24,0.25)]"
                                  : "border-white/[0.1] bg-[#0D0E12] hover:border-white/30"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-[#F7F7F5]">{addr.fullName}</span>
                                {isSelected && (
                                  <span className="w-2 h-2 rounded-full bg-[#F5C518]"></span>
                                )}
                              </div>
                              <p className="text-[#9A9DA5] text-[11px] leading-tight">
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
                          className={`min-h-[44px] p-3.5 rounded-[10px] border border-dashed text-center flex items-center justify-center cursor-pointer text-xs font-semibold uppercase tracking-wider text-[#9A9DA5] hover:text-white hover:border-white/30 transition-colors duration-200 ${
                            selectedAddressId === "new" ? "border-[#F5C518]/70 bg-[#F5C518]/[0.06] text-[#F5C518]" : "border-white/[0.08]"
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
                      <label className="font-semibold uppercase text-[#9A9DA5] text-[11px]">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="e.g. Ren Amamiya"
                        className="w-full h-12 px-4 bg-[#0D0E12] border border-white/[0.08] text-[#F7F7F5] focus:border-[#F5C518]/60 focus:outline-none rounded-[8px] placeholder:text-[#6E717A] transition-colors"
                      />
                      {fieldErrors.fullName && (
                        <p className="text-[11px] text-rose-300">{fieldErrors.fullName}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold uppercase text-[#9A9DA5] text-[11px]">
                        Street Address (Flat / House No. / Building / Street) *
                      </label>
                      <input
                        type="text"
                        name="streetAddress"
                        value={formData.streetAddress}
                        onChange={handleInputChange}
                        placeholder="e.g. 42 Collector's Enclave, Station Road"
                        className="w-full h-12 px-4 bg-[#0D0E12] border border-white/[0.08] text-[#F7F7F5] focus:border-[#F5C518]/60 focus:outline-none rounded-[8px] placeholder:text-[#6E717A] transition-colors"
                      />
                      {fieldErrors.streetAddress && (
                        <p className="text-[11px] text-rose-300">{fieldErrors.streetAddress}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-semibold uppercase text-[#9A9DA5] text-[11px]">
                          Apartment / Suite / Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          name="apartment"
                          value={formData.apartment}
                          onChange={handleInputChange}
                          placeholder="Near City Circle"
                          className="w-full h-12 px-4 bg-[#0D0E12] border border-white/[0.08] text-[#F7F7F5] focus:border-[#F5C518]/60 focus:outline-none rounded-[8px] placeholder:text-[#6E717A] transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold uppercase text-[#9A9DA5] text-[11px]">
                          City *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Bikaner"
                          className="w-full h-12 px-4 bg-[#0D0E12] border border-white/[0.08] text-[#F7F7F5] focus:border-[#F5C518]/60 focus:outline-none rounded-[8px] placeholder:text-[#6E717A] transition-colors"
                        />
                        {fieldErrors.city && (
                          <p className="text-[11px] text-rose-300">{fieldErrors.city}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="font-semibold uppercase text-[#9A9DA5] text-[11px]">
                          State *
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="Rajasthan"
                          className="w-full h-12 px-4 bg-[#0D0E12] border border-white/[0.08] text-[#F7F7F5] focus:border-[#F5C518]/60 focus:outline-none rounded-[8px] placeholder:text-[#6E717A] transition-colors"
                        />
                        {fieldErrors.state && (
                          <p className="text-[11px] text-rose-300">{fieldErrors.state}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold uppercase text-[#9A9DA5] text-[11px]">
                          PIN Code (6 Digits) *
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          maxLength={6}
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          placeholder="334001"
                          className="w-full h-12 px-4 bg-[#0D0E12] border border-white/[0.08] font-mono text-[#F7F7F5] focus:border-[#F5C518]/60 focus:outline-none rounded-[8px] placeholder:text-[#6E717A] transition-colors"
                        />
                        {fieldErrors.postalCode && (
                          <p className="text-[11px] text-rose-300">{fieldErrors.postalCode}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold uppercase text-[#9A9DA5] text-[11px]">
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          readOnly
                          className="w-full h-12 px-4 rounded-[8px] bg-white/[0.03] border border-white/[0.08] text-[#9A9DA5] cursor-not-allowed focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* SECTION 3: PAYMENT METHOD */}
<section className="space-y-4 rounded-[14px] border border-white/[0.08] bg-[#111318] p-5 sm:p-6">
                  <div className="border-b border-white/[0.08] pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#F7F7F5] flex items-center">
                      <span className="flex flex-col"><span className="ff-eyebrow">Step 03</span><span className="mt-1.5 text-[17px] font-bold normal-case tracking-normal text-white">Payment method</span></span>
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* UPI Option */}
                    <label
                      onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: "UPI" }))}
                      className={`flex items-start space-x-3 p-4 rounded-[10px] border cursor-pointer transition-all duration-200 ${
                        formData.paymentMethod === "UPI" ? "border-[#F5C518]/70 bg-[#F5C518]/[0.06] shadow-[0_0_0_1px_rgba(245,197,24,0.25)]" : "border-white/[0.1] bg-[#0D0E12] hover:border-white/30"
                      }`}
                    >
                      <QrCode className="w-5 h-5 text-[#F5C518] shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#F7F7F5] block">UPI / Online Payment (Instant QR Code)</span>
                        <span className="text-[#9A9DA5] text-[11px]">
                          Scan using Google Pay, PhonePe, Paytm, BHIM, or any UPI banking app.
                        </span>
                      </div>
                    </label>

                    {/* COD Option */}
                    <label
                      onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: "COD" }))}
                      className={`flex items-start space-x-3 p-4 rounded-[10px] border cursor-pointer transition-all duration-200 ${
                        formData.paymentMethod === "COD" ? "border-[#F5C518]/70 bg-[#F5C518]/[0.06] shadow-[0_0_0_1px_rgba(245,197,24,0.25)]" : "border-white/[0.1] bg-[#0D0E12] hover:border-white/30"
                      }`}
                    >
                      <Banknote className="w-5 h-5 text-[#F5C518] shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#F7F7F5] block">Cash on Delivery (COD)</span>
                        <span className="text-[#9A9DA5] text-[11px]">
                          Pay cash upon physical arrival at your doorstep.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* UPI Sub-Section (Responsive Dynamic QR & UPI ID Display) */}
                  {formData.paymentMethod === "UPI" && (
                    <div className="p-4 sm:p-6 rounded-[10px] bg-[#0D0E12] border border-white/[0.08] space-y-5 text-center text-xs">
                      <h4 className="font-bold uppercase tracking-wider text-[#F7F7F5]">
                        SCAN & PAY VIA UPI ({formatPrice(grandTotal)})
                      </h4>

                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="relative w-44 h-44 max-w-full bg-[#FFFFFF] rounded-[10px] border-2 border-[#F5C518]/60 p-2 flex items-center justify-center mx-auto shadow-[0_0_30px_-8px_rgba(245,197,24,0.4)]">
                          {(upiSettings.upiQrUrl || contextUpiQrUrl) ? (
                            <Image
                              src={upiSettings.upiQrUrl || contextUpiQrUrl}
                              alt="FictionFigure UPI QR Code"
                              width={176}
                              height={176}
                              className="object-contain max-w-full h-auto"
                              unoptimized
                            />
                          ) : (
                            <div className="text-center space-y-2 text-[#9A9DA5]">
                              <QrCode className="w-12 h-12 mx-auto text-[#08090B]" />
                              <p className="text-[10px] uppercase font-mono">Scan QR via GPay / PhonePe / Paytm</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 max-w-full overflow-hidden">
                          <span className="text-[11px] text-[#9A9DA5] block">Official UPI ID:</span>
                          <span className="font-mono font-bold text-xs sm:text-sm text-[#F7F7F5] bg-[#111318] px-3 py-1.5 rounded-[6px] border border-white/[0.08] inline-block truncate max-w-full">
                            {upiSettings.upiId || contextUpiId || "fictionfigure@upi"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* Mobile Coupon Section (Visible on Mobile) */}
                <div className="lg:hidden rounded-[14px] border border-white/[0.08] bg-[#111318] p-5">
                  <CouponComponent />
                </div>

                {/* CONTINUE TO REVIEW STEP CTA */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleProceedToReview}
                    className="ff-btn ff-btn-gold w-full h-14 text-[13px]"
                  >
                    <span>REVIEW ORDER — {formatPrice(grandTotal)}</span>
                  </button>

                  <p className="text-[10px] text-center text-[#9A9DA5] mt-3">
                    You will have a final opportunity to review your address and items before the order is placed.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* RIGHT COLUMN (~40% / 5 cols): Desktop Order Summary Sidebar */}
          <aside className="hidden lg:block lg:col-span-5 space-y-6 sticky top-24">
            <div className="rounded-[14px] border border-white/[0.08] bg-[#111318] p-6 space-y-6">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#F7F7F5] border-b border-white/[0.08] pb-3">
                Order Summary ({cart.length})
              </h3>

              {/* Product Items List */}
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.variantId} className="flex space-x-3 items-center text-xs">
                    <div className="relative w-14 h-14 bg-[#0D0E12] shrink-0 border border-white/[0.08] rounded-md overflow-hidden p-0.5">
                      {item.image && <Image src={item.image} alt={item.title} fill className="object-contain p-0.5" />}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h5 className="font-semibold text-[#F7F7F5] truncate">{item.title}</h5>
                      {item.variantTitle && (
                        <p className="text-[10px] font-medium text-[#9A9DA5]">
                          Variant: <strong className="font-mono text-[#F7F7F5]">{item.variantTitle}</strong>
                        </p>
                      )}
                      <div className="text-[10px] text-[#9A9DA5] flex items-center space-x-2">
                        <span>Qty: {item.quantity}</span>
                        <span>•</span>
                        <span className="font-mono">{formatPrice(item.price)} each</span>
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-[#F7F7F5]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Desktop Coupon Code Entry Box */}
              <div className="pt-4 border-t border-white/[0.08]">
                <CouponComponent />
              </div>

              {/* Authoritative Price Breakdown Table */}
              <div className="pt-4 border-t border-white/[0.08]">
                <OrderTotals
                  subtotal={cartSubtotal}
                  discount={couponDiscount}
                  discountCode={appliedCoupon?.code}
                  shipping={shippingFee}
                  codFee={codFee}
                  total={grandTotal}
                  totalLabel="Total Amount"
                  freeShippingThreshold={configThreshold}
                />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
