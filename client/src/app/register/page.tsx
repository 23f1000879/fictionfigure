"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react";
import { normalizeIndianPhone, formatDisplayPhone } from "@/lib/phone";
import { MSG91OTPWidget, MSG91VerificationPayload } from "@/components/auth/MSG91OTPWidget";
import { API_BASE } from "@/lib/api";
import { AuthShell, AuthHeading } from "@/components/auth/AuthShell";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"FORM" | "OTP">("FORM");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Idempotency lock ref to prevent duplicate submission requests
  const registrationSubmittedRef = useRef(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [normalizedPhone, setNormalizedPhone] = useState("");

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }

    const norm = normalizeIndianPhone(form.phone);
    if (!norm) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (form.password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/check-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: norm }),
      });

      const data = await res.json();
      if (!res.ok || data.registered) {
        setError(data.error || "This mobile number is already registered. Please sign in.");
        setIsLoading(false);
        return;
      }

      setNormalizedPhone(norm);
      registrationSubmittedRef.current = false;
      setStep("OTP");
    } catch (err: any) {
      setError(err.message || "Failed to verify mobile number. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerified = async (payload: MSG91VerificationPayload) => {
    // Idempotency guard: prevent duplicate simultaneous registration requests
    if (registrationSubmittedRef.current) {
      console.warn("Registration request already submitted. Ignoring duplicate execution.");
      return;
    }

    registrationSubmittedRef.current = true;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/register-customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: normalizedPhone,
          password: form.password,
          accessToken: payload.accessToken,
          reqId: payload.reqId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        registrationSubmittedRef.current = false; // Reset lock if backend rejected
        throw new Error(data.message || data.error || "Registration failed");
      }

      if (data.token) {
        localStorage.setItem("fictionfigure_token", data.token);
      }

      router.push("/account");
    } catch (err: any) {
      registrationSubmittedRef.current = false; // Reset lock on error for retry
      setError(err.message || "Registration failed. Please try again.");
      setStep("FORM");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      asideEyebrow="Join the collector's club"
      asideTitle="Create your"
      asideAccent="collection."
      asideText="One account for your wishlist, orders, saved addresses and restock alerts."
    >
        {step === "FORM" ? (
          <>
            <AuthHeading
              eyebrow="New collector"
              title="Create your collection"
              text="Create an account to save your collection, wishlist and orders."
            />


            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleInitialSubmit} className="space-y-4 text-xs" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A9DA5] block">
                    FIRST NAME *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="First name"
                    className="w-full h-12 px-4 bg-[#17191F] border border-white/[0.08] text-[#F7F7F5] focus:border-[#F5C518]/60 focus:outline-none rounded-[8px] placeholder:text-[#6E717A] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A9DA5] block">
                    LAST NAME *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Last name"
                    className="w-full h-12 px-4 bg-[#17191F] border border-white/[0.08] text-[#F7F7F5] focus:border-[#F5C518]/60 focus:outline-none rounded-[8px] placeholder:text-[#6E717A] transition-colors"
                  />
                </div>
              </div>

              {/* Mobile Number Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A9DA5] block">
                  MOBILE NUMBER *
                </label>
                <div className="flex overflow-hidden bg-[#17191F] border border-white/[0.08] focus-within:border-[#F5C518]/60 transition-colors rounded-[8px] placeholder:text-[#6E717A] transition-colors">
                  <span className="px-4 flex items-center font-mono font-semibold text-[#9A9DA5] border-r border-white/[0.08] select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="98765 43210"
                    className="w-full h-12 px-3 bg-transparent text-[#F7F7F5] font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A9DA5] block">
                  PASSWORD *
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Password"
                    className="w-full h-12 px-4 pr-11 bg-[#17191F] border border-white/[0.08] text-[#F7F7F5] focus:border-[#F5C518]/60 focus:outline-none rounded-[8px] placeholder:text-[#6E717A] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#9A9DA5] hover:text-white p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#9A9DA5]">Use at least 8 characters.</p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A9DA5] block">
                  CONFIRM PASSWORD *
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    className="w-full h-12 px-4 pr-11 bg-[#17191F] border border-white/[0.08] text-[#F7F7F5] focus:border-[#F5C518]/60 focus:outline-none rounded-[8px] placeholder:text-[#6E717A] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-[#9A9DA5] hover:text-white p-1"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-[11px] text-rose-300 font-medium">Passwords do not match.</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="ff-btn ff-btn-gold w-full h-12 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>CREATING ACCOUNT...</span>
                  </div>
                ) : (
                  <>
                    <span>CREATE ACCOUNT</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-white/[0.08] text-center text-xs text-[#9A9DA5]">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-[#F7F7F5] hover:underline ml-1">
                Sign in →
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2 flex flex-col items-start">
              <button
                onClick={() => setStep("FORM")}
                className="min-h-[44px] text-xs text-[#9A9DA5] hover:text-white flex items-center self-start"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Change details
              </button>
              <p className="ff-eyebrow">One last step</p>
              <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-white">Verify your mobile</h1>
              <p className="text-xs text-[#9A9DA5] leading-relaxed">
                We sent a 6-digit verification code to{" "}
                <strong className="text-[#F7F7F5] font-mono">{formatDisplayPhone(normalizedPhone)}</strong>
              </p>
            </div>

            <div className="border-b border-white/[0.08]"></div>

            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <MSG91OTPWidget
              phone={normalizedPhone}
              onSuccess={handleOTPVerified}
              onError={(msg) => setError(msg)}
            />
          </>
        )}
    </AuthShell>
  );
}
