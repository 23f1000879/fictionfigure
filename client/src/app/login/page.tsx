"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { normalizeIndianPhone } from "@/lib/phone";
import { API_BASE } from "@/lib/api";
import { AuthShell, AuthHeading } from "@/components/auth/AuthShell";
import { ForgotPasswordFlow } from "@/components/auth/ForgotPasswordFlow";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});

  const [showForgot, setShowForgot] = useState(false);

  // Check if already authenticated on mount
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fictionfigure_token") : null;
    if (token) {
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user) {
            if (data.user.role === "ADMIN") {
              router.replace("/admin");
            } else if (redirectUrl && redirectUrl.startsWith("/")) {
              router.replace(redirectUrl);
            } else {
              router.replace("/account");
            }
          }
        })
        .catch(() => {});
    }
  }, [router, redirectUrl]);

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
      } else if (redirectUrl && redirectUrl.startsWith("/")) {
        router.push(redirectUrl);
      } else {
        router.push("/account");
      }
    } catch (err: any) {
      setServerError(err.message || "Incorrect mobile number or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      {showForgot ? (
        <ForgotPasswordFlow initialPhone={identifier.includes("@") ? "" : identifier} onDone={() => setShowForgot(false)} />
      ) : (
        <>
        <AuthHeading eyebrow="Member sign in" title="Welcome back." text="Sign in to continue to your collection." />


        {/* Server Alert Message */}
        {serverError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

          <form onSubmit={handleLogin} className="space-y-5 text-xs" noValidate>
            {/* Mobile Number / Email Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A9DA5] block">
                MOBILE NUMBER *
              </label>
              <div className="flex overflow-hidden bg-[#17191F] border border-white/[0.08] focus-within:border-[#F5C518]/60 transition-colors rounded-[8px] placeholder:text-[#6E717A] transition-colors">
                {!identifier.includes("@") && (
                  <span className="px-4 flex items-center font-mono font-semibold text-[#9A9DA5] border-r border-white/[0.08] select-none">
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
                  className="w-full h-12 px-3 bg-transparent text-[#F7F7F5] font-mono focus:outline-none"
                />
              </div>
              {fieldErrors.identifier && (
                <p className="text-[11px] text-rose-300 font-medium">{fieldErrors.identifier}</p>
              )}
            </div>

            {/* Password Field with Eye Toggle Icon */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A9DA5]">
                  PASSWORD *
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="min-h-[44px] px-1 text-[12px] text-[#9A9DA5] hover:text-[#F5C518] transition-colors"
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
                  className="w-full h-12 px-4 pr-11 bg-[#17191F] border border-white/[0.08] text-[#F7F7F5] focus:border-[#F5C518]/60 focus:outline-none rounded-[8px] placeholder:text-[#6E717A] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 w-10 h-10 flex items-center justify-center rounded-full text-[#9A9DA5] hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-rose-300 font-medium">{fieldErrors.password}</p>
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

        <div className="pt-4 border-t border-white/[0.08] text-center text-xs text-[#9A9DA5]">
          Don't have an account?{" "}
          <Link href="/register" className="inline-flex items-center min-h-[44px] font-semibold text-[#F7F7F5] hover:underline ml-1">
            Create account →
          </Link>
        </div>
        </>
      )}
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#9A9DA5]">Loading login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
