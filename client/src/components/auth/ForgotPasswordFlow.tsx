"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { normalizeIndianPhone, formatDisplayPhone } from "@/lib/phone";
import { API_BASE } from "@/lib/api";
import { MSG91OTPWidget, MSG91VerificationPayload } from "@/components/auth/MSG91OTPWidget";
import { AuthHeading } from "@/components/auth/AuthShell";

const MIN_PASSWORD = 8;

type Step = "PHONE" | "OTP" | "PASSWORD" | "DONE";

const field =
  "w-full h-12 px-4 rounded-[8px] bg-[#17191F] border border-white/[0.08] text-[#F7F7F5] placeholder:text-[#6E717A] focus:border-[#F5C518]/60 focus:outline-none transition-colors";
const label = "text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A9DA5] block";

/**
 * Forgot password: prove ownership of the number with an OTP, then choose a new password.
 * The OTP never signs anyone in; the customer signs in afterwards with the new password.
 */
export function ForgotPasswordFlow({ initialPhone = "", onDone }: { initialPhone?: string; onDone: () => void }) {
  const [step, setStep] = useState<Step>("PHONE");
  const [phone, setPhone] = useState(initialPhone);
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [verification, setVerification] = useState<MSG91VerificationPayload | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [noAccount, setNoAccount] = useState(false);
  const [loading, setLoading] = useState(false);

  const startOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const norm = normalizeIndianPhone(phone);
    if (!norm) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setNormalizedPhone(norm);
    setStep("OTP");
  };

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNoAccount(false);
    if (password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!verification) {
      setStep("OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalizedPhone,
          accessToken: verification.accessToken,
          reqId: verification.reqId,
          newPassword: password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 404) {
        setNoAccount(true);
        throw new Error(data.message || "No account uses this number yet.");
      }
      if (!res.ok) {
        // Verification tokens are single-use; failed attempts restart from OTP.
        if (res.status === 400 || res.status === 401) setVerification(null);
        throw new Error(data.message || data.error || "Password reset failed. Please try again.");
      }
      setStep("DONE");
    } catch (err: any) {
      setError(err.message || "Password reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {step !== "DONE" && (
        <button
          type="button"
          onClick={step === "PHONE" ? onDone : () => setStep(step === "PASSWORD" ? "OTP" : "PHONE")}
          className="min-h-[44px] inline-flex items-center gap-1.5 text-[12px] text-[#9A9DA5] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {step === "PHONE" ? "Back to sign in" : "Back"}
        </button>
      )}

      {step === "PHONE" && (
        <>
          <AuthHeading
            eyebrow="Forgot password"
            title="Reset your password"
            text="We'll send a one-time code to your mobile number to confirm it's you."
          />
          <form onSubmit={startOtp} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="reset-phone" className={label}>
                Mobile number *
              </label>
              <div className="flex h-12 overflow-hidden rounded-[8px] bg-[#17191F] border border-white/[0.08] focus-within:border-[#F5C518]/60 transition-colors">
                <span className="px-4 flex items-center font-mono text-[#9A9DA5] border-r border-white/[0.08] select-none">+91</span>
                <input
                  id="reset-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full px-3 bg-transparent text-[#F7F7F5] font-mono placeholder:text-[#6E717A] focus:outline-none"
                />
              </div>
            </div>
            {error && <ErrorNote text={error} />}
            <button type="submit" className="ff-btn ff-btn-gold w-full h-12">
              Send OTP <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </>
      )}

      {step === "OTP" && (
        <>
          <AuthHeading
            eyebrow="Step 2 of 3"
            title="Enter the code"
            text={`We sent a 6-digit code to ${formatDisplayPhone(normalizedPhone)}.`}
          />
          {error && <ErrorNote text={error} />}
          <MSG91OTPWidget
            phone={normalizedPhone}
            onSuccess={(payload) => {
              setVerification(payload);
              setError("");
              setStep("PASSWORD");
            }}
            onError={(msg) => setError(msg)}
          />
        </>
      )}

      {step === "PASSWORD" && (
        <>
          <AuthHeading eyebrow="Step 3 of 3" title="Choose a new password" text="Use at least 8 characters." />
          <form onSubmit={submitNewPassword} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="new-password" className={label}>
                New password *
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${field} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[#9A9DA5] hover:text-white"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className={label}>
                Confirm new password *
              </label>
              <input
                id="confirm-password"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={field}
              />
              {confirm && password !== confirm && <p className="text-[12px] text-rose-300">Passwords do not match.</p>}
            </div>
            {error && <ErrorNote text={error} />}
            {noAccount && (
              <Link href="/register" className="ff-link-arrow text-[13px]">
                Create an account <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <button type="submit" disabled={loading} className="ff-btn ff-btn-gold w-full h-12 disabled:opacity-50 disabled:pointer-events-none">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Update password <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </>
      )}

      {step === "DONE" && (
        <div className="space-y-5">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <AuthHeading eyebrow="All set" title="Password updated" text="Sign in with your mobile number and your new password." />
          <button type="button" onClick={onDone} className="ff-btn ff-btn-gold w-full h-12">
            Back to sign in <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function ErrorNote({ text }: { text: string }) {
  return (
    <div className="p-3.5 rounded-[8px] bg-rose-500/10 border border-rose-500/40 text-rose-300 text-[13px] flex items-center gap-2">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
