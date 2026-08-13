"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { normalizeIndianPhone } from "@/lib/phone";
import { API_BASE } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});

  const [showForgot, setShowForgot] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setFieldErrors({});

    // Client-side field validations
    const errors: { identifier?: string; password?: string } = {};

    const isEmailInput = identifier.trim().includes("@");
    const normPhone = isEmailInput ? null : normalizeIndianPhone(identifier);

    if (!identifier.trim()) {
      errors.identifier = "Mobile number";
    } else if (!isEmailInput && !normPhone) {
      errors.identifier = "Enter a valid 10-digit mobile number";
    }

    if (!password) {
      errors.password = "Password is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: normPhone || identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Incorrect mobile number or password.");
      }

      if (data.token) {
        localStorage.setItem("fictionfigure_token", data.token);
      }

      if (data.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/account");
      }
    } catch (err: any) {
      setServerError(err.message || "Incorrect mobile number or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setForgotMessage("");

    const normPhone = normalizeIndianPhone(identifier);
    if (!normPhone) {
      setFieldErrors({ identifier: "Enter a valid 10-digit mobile number." });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/check-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normPhone }),
      });

      const data = await res.json();
      if (res.ok && data.registered) {
        setForgotMessage("Account verified. Contact support or use register flow for password reset.");
      } else {
        setServerError(data.error || "No account found with this mobile number.");
      }
    } catch (err) {
      setServerError("Failed to initiate password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4 sm:p-6 text-[#111111]">
      <div className="w-full max-w-[460px] bg-white border border-[#E5E5E2] p-8 shadow-xs space-y-6">
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
            WELCOME BACK
          </h2>
          <p className="text-xs text-[#6B6B6B]">
            Sign in to continue to your collection.
          </p>
        </div>

        <div className="border-b border-[#E5E5E2]"></div>

        {/* Server Alert Message */}
        {serverError && (
          <div className="p-3.5 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {forgotMessage && (
          <div className="p-3.5 bg-[#2E6B44]/10 border border-[#2E6B44] text-[#2E6B44] text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{forgotMessage}</span>
          </div>
        )}

        {!showForgot ? (
          <form onSubmit={handleLogin} className="space-y-5 text-xs" noValidate>
            {/* Mobile Number / Email Field */}
            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wider text-[#6B6B6B] block">
                MOBILE NUMBER *
              </label>
              <div className="flex bg-[#F7F7F5] border border-[#E5E5E2] focus-within:border-[#111111] transition-colors">
                {!identifier.includes("@") && (
                  <span className="p-3 font-mono font-semibold text-[#6B6B6B] border-r border-[#E5E5E2] select-none">
                    +91
                  </span>
                )}
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (fieldErrors.identifier) setFieldErrors({ ...fieldErrors, identifier: undefined });
                  }}
                  placeholder="98765 43210"
                  className="w-full p-3 bg-transparent text-[#111111] font-mono focus:outline-none"
                />
              </div>
              {fieldErrors.identifier && (
                <p className="text-[11px] text-[#A83232] font-medium">{fieldErrors.identifier}</p>
              )}
            </div>

            {/* Password Field with Eye Toggle Icon */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-semibold uppercase tracking-wider text-[#6B6B6B]">
                  PASSWORD *
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-[11px] text-[#6B6B6B] hover:text-[#111111] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                  }}
                  placeholder="••••••••••••"
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
              {fieldErrors.password && (
                <p className="text-[11px] text-[#A83232] font-medium">{fieldErrors.password}</p>
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
                  <span>SIGNING IN...</span>
                </div>
              ) : (
                <>
                  <span>SIGN IN</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wider text-[#6B6B6B]">
                REGISTERED MOBILE NUMBER *
              </label>
              <div className="flex bg-[#F7F7F5] border border-[#E5E5E2] focus-within:border-[#111111] transition-colors">
                <span className="p-3 font-mono font-semibold text-[#6B6B6B] border-r border-[#E5E5E2] select-none">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full p-3 bg-transparent text-[#111111] font-mono focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#111111] text-white font-semibold uppercase tracking-wider hover:bg-black disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>VERIFY ACCOUNT</span>}
            </button>

            <button
              type="button"
              onClick={() => setShowForgot(false)}
              className="w-full text-center text-xs text-[#6B6B6B] hover:text-[#111111] hover:underline"
            >
              Back to Sign In
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-[#E5E5E2] text-center text-xs text-[#6B6B6B]">
          Don't have an account?{" "}
          <Link href="/register" className="font-semibold text-[#111111] hover:underline ml-1">
            Register →
          </Link>
        </div>
      </div>
    </div>
  );
}
