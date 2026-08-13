"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react";
import { normalizeIndianPhone, formatDisplayPhone } from "@/lib/phone";
import { MSG91OTPWidget, MSG91VerificationPayload } from "@/components/auth/MSG91OTPWidget";

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
      const res = await fetch("http://localhost:5000/api/auth/check-phone", {
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
      const res = await fetch("http://localhost:5000/api/auth/register-customer", {
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
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4 sm:p-6 text-[#111111]">
      <div className="w-full max-w-[460px] bg-white border border-[#E5E5E2] p-8 shadow-xs space-y-6">
        {step === "FORM" ? (
          <>
            {/* Header Branding */}
            <div className="text-center space-y-2 flex flex-col items-center">
              <Link href="/" className="inline-block hover:opacity-85 transition-opacity mb-1">
                <Image
                  src="/fictionfigure-icon.svg"
                  alt="FictionFigure Emblem"
                  width={44}
                  height={44}
                  priority
                  className="h-11 w-auto mx-auto object-contain"
                />
              </Link>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#111111]">
                CREATE YOUR COLLECTOR ACCOUNT
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Create an account to save your collection, wishlist and orders.
              </p>
            </div>

            <div className="border-b border-[#E5E5E2]"></div>

            {error && (
              <div className="p-3.5 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleInitialSubmit} className="space-y-4 text-xs" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold uppercase tracking-wider text-[#6B6B6B] block">
                    FIRST NAME *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="First name"
                    className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold uppercase tracking-wider text-[#6B6B6B] block">
                    LAST NAME *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Last name"
                    className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              {/* Mobile Number Field */}
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-[#6B6B6B] block">
                  MOBILE NUMBER *
                </label>
                <div className="flex bg-[#F7F7F5] border border-[#E5E5E2] focus-within:border-[#111111] transition-colors">
                  <span className="p-3 font-mono font-semibold text-[#6B6B6B] border-r border-[#E5E5E2] select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="98765 43210"
                    className="w-full p-3 bg-transparent text-[#111111] font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-[#6B6B6B] block">
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
                    className="w-full p-3 pr-10 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#6B6B6B] hover:text-[#111111] p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#6B6B6B]">Use at least 8 characters.</p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-[#6B6B6B] block">
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
                    className="w-full p-3 pr-10 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-[#6B6B6B] hover:text-[#111111] p-1"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-[11px] text-[#A83232] font-medium">Passwords do not match.</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#111111] text-white font-semibold uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
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

            <div className="pt-4 border-t border-[#E5E5E2] text-center text-xs text-[#6B6B6B]">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-[#111111] hover:underline ml-1">
                Sign in →
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="text-center space-y-2 flex flex-col items-center">
              <button
                onClick={() => setStep("FORM")}
                className="text-xs text-[#6B6B6B] hover:text-[#111111] flex items-center mb-1 self-start"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Change details
              </button>
              <Link href="/" className="inline-block hover:opacity-85 transition-opacity mb-1">
                <Image
                  src="/fictionfigure-icon.svg"
                  alt="FictionFigure Emblem"
                  width={44}
                  height={44}
                  priority
                  className="h-11 w-auto mx-auto object-contain"
                />
              </Link>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#111111]">
                VERIFY YOUR MOBILE
              </h2>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                We sent a 6-digit verification code to{" "}
                <strong className="text-[#111111] font-mono">{formatDisplayPhone(normalizedPhone)}</strong>
              </p>
            </div>

            <div className="border-b border-[#E5E5E2]"></div>

            {error && (
              <div className="p-3.5 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center space-x-2">
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
      </div>
    </div>
  );
}
