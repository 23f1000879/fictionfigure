"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { normalizeIndianPhone, formatDisplayPhone } from "@/lib/phone";
import { API_BASE } from "@/lib/api";
import { MSG91OTPWidget, MSG91VerificationPayload } from "@/components/auth/MSG91OTPWidget";
import { ForgotPasswordFlow } from "@/components/auth/ForgotPasswordFlow";

export interface AuthenticatedUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string;
  role?: string;
  phoneVerified?: boolean;
}

type Step = "PHONE" | "PASSWORD" | "ACTIVATE" | "NEW" | "OTP" | "CREATE" | "FORGOT";

interface PhoneAuthFlowProps {
  /** login: account page sign-in. checkout: inline customer identification. */
  mode: "login" | "checkout";
  onAuthenticated: (token: string, user: AuthenticatedUser) => void;
  initialPhone?: string;
}

const MIN_PASSWORD = 8;
const field =
  "w-full h-12 px-4 rounded-[8px] bg-[#17191F] border border-white/[0.08] text-[#F7F7F5] placeholder:text-[#6E717A] focus:border-[#F5C518]/60 focus:outline-none transition-colors";
const labelCls = "text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A9DA5] block";

/**
 * Server-driven phone authentication.
 *   PASSWORD  → phone + password (no OTP is ever sent)
 *   ACTIVATE  → existing account without a password: OTP (on explicit click) → create password
 *   NEW       → OTP → create account with a password
 * Verification is bound to one number: changing the number discards every verification artefact.
 */
export function PhoneAuthFlow({ mode, onAuthenticated, initialPhone = "" }: PhoneAuthFlowProps) {
  const [step, setStep] = useState<Step>("PHONE");
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [identifier, setIdentifier] = useState(""); // normalized phone (or email for staff sign-in)
  const [accountState, setAccountState] = useState<"PASSWORD" | "ACTIVATE" | "NEW" | null>(null);
  const [setupToken, setSetupToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [names, setNames] = useState({ firstName: "", lastName: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const verifyInFlight = useRef(false);

  const isEmail = identifier.includes("@");
  const displayIdentifier = isEmail ? identifier : formatDisplayPhone(identifier);

  /** Back to the number step; nothing verified for the previous number survives. */
  const resetToPhone = () => {
    setStep("PHONE");
    setIdentifier("");
    setAccountState(null);
    setSetupToken("");
    setPassword("");
    setConfirm("");
    setError("");
    setNotice("");
    verifyInFlight.current = false;
  };

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const raw = phoneInput.trim();

    // Staff accounts may sign in with email + password (no lookup, no OTP).
    if (mode === "login" && raw.includes("@")) {
      setIdentifier(raw.toLowerCase());
      setStep("PASSWORD");
      return;
    }

    const norm = normalizeIndianPhone(raw);
    if (!norm) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/phone-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: norm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.state) throw new Error(data.error || "Could not check this number. Please try again.");
      setIdentifier(norm);
      setAccountState(data.state);
      setSetupToken("");
      setStep(data.state === "PASSWORD" ? "PASSWORD" : data.state === "ACTIVATE" ? "ACTIVATE" : "NEW");
    } catch (err: any) {
      setError(err.message || "Could not check this number. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) throw new Error(data.error || "Incorrect mobile number or password.");
      setPassword("");
      onAuthenticated(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Incorrect mobile number or password.");
    } finally {
      setLoading(false);
    }
  };

  // MSG91 reported success in the browser → the server must independently accept the token
  // (verifyAccessToken + number binding) before we move on.
  const handleOtpSuccess = async (payload: MSG91VerificationPayload) => {
    if (verifyInFlight.current) return;
    verifyInFlight.current = true;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/checkout/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: identifier, accessToken: payload.accessToken, reqId: payload.reqId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || "We couldn't confirm this verification. Please request a new code.");

      if (data.status === "LOGIN_REQUIRED") {
        setAccountState("PASSWORD");
        setNotice("This number already has a password. Sign in with it to continue.");
        setStep("PASSWORD");
        return;
      }
      if ((data.status === "PASSWORD_SETUP_REQUIRED" || data.status === "NEW_ACCOUNT") && data.setupToken) {
        setSetupToken(data.setupToken);
        setNames({ firstName: data.firstName || "", lastName: data.lastName || "" });
        setStep("CREATE");
        return;
      }
      throw new Error("Verification could not be completed. Please try again.");
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      verifyInFlight.current = false;
      setLoading(false);
    }
  };

  const createPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (accountState === "NEW" && (!names.firstName.trim() || !names.lastName.trim())) {
      setError("Please enter your first and last name.");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/checkout/auth/complete-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setupToken, password, firstName: names.firstName, lastName: names.lastName }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setSetupToken("");
        setAccountState("PASSWORD");
        setNotice("This number already has a password. Sign in with it to continue.");
        setStep("PASSWORD");
        return;
      }
      if (res.status === 401) {
        setSetupToken("");
        setStep(accountState === "NEW" ? "NEW" : "ACTIVATE");
        throw new Error("Your verification expired. Please verify your number again.");
      }
      if (!res.ok || !data.token) throw new Error(data.message || data.error || "Could not save your password.");
      setPassword("");
      setConfirm("");
      setSetupToken("");
      onAuthenticated(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Could not save your password.");
    } finally {
      setLoading(false);
    }
  };

  const heading = (eyebrow: string, title: string, text?: string) => (
    <div className="space-y-1.5">
      <p className="ff-eyebrow">{eyebrow}</p>
      <h2
        className={`font-extrabold tracking-[-0.02em] text-white ${
          mode === "login" ? "text-[28px] sm:text-[30px] leading-[1.1]" : "text-[19px] leading-snug"
        }`}
      >
        {title}
      </h2>
      {text && <p className="text-[13px] text-[#9A9DA5] leading-relaxed">{text}</p>}
    </div>
  );

  const identityRow = (
    <div className="flex items-center justify-between gap-3 h-12 px-4 rounded-[8px] bg-[#0D0E12] border border-white/[0.08]">
      <span className="font-mono text-[14px] text-white truncate">{isEmail ? identifier : `+91 ${displayIdentifier.replace(/^\+91\s?/, "")}`}</span>
      <button type="button" onClick={resetToPhone} className="min-h-[44px] px-1 text-[12px] font-semibold text-[#9A9DA5] hover:text-[#F5C518] shrink-0">
        Change
      </button>
    </div>
  );

  const errorBox = error ? (
    <div role="alert" className="p-3.5 rounded-[8px] bg-rose-500/10 border border-rose-500/40 text-rose-200 text-[13px] flex items-start gap-2">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{error}</span>
    </div>
  ) : null;

  const passwordInput = (id: string, value: string, onChange: (v: string) => void, autoComplete: string, placeholder = "") => (
    <div className="relative">
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${field} pr-12`}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full text-[#9A9DA5] hover:text-white"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );

  if (step === "FORGOT") {
    return <ForgotPasswordFlow initialPhone={isEmail ? "" : identifier} onDone={resetToPhone} />;
  }

  return (
    <div className="space-y-5" data-auth-step={step}>
      {step === "PHONE" && (
        <>
          {mode === "login"
            ? heading("Member sign in", "Welcome back.", "Enter your mobile number to continue.")
            : heading("Step 01", "Contact information", "Enter your mobile number. Returning customers sign in with their password.")}
          <form onSubmit={lookup} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor={`${mode}-phone`} className={labelCls}>
                {mode === "login" ? "Mobile number" : "Mobile phone number *"}
              </label>
              <div className="flex h-12 overflow-hidden rounded-[8px] bg-[#17191F] border border-white/[0.08] focus-within:border-[#F5C518]/60 transition-colors">
                {!phoneInput.includes("@") && (
                  <span className="px-4 flex items-center font-mono text-[#9A9DA5] border-r border-white/[0.08] select-none">+91</span>
                )}
                <input
                  id={`${mode}-phone`}
                  type={mode === "login" ? "text" : "tel"}
                  inputMode={phoneInput.includes("@") ? "email" : "tel"}
                  autoComplete="username"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full px-3 bg-transparent text-[#F7F7F5] font-mono placeholder:text-[#6E717A] focus:outline-none"
                />
              </div>
            </div>
            {errorBox}
            <button type="submit" disabled={loading} className="ff-btn ff-btn-gold w-full h-12 disabled:opacity-50 disabled:pointer-events-none">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </>
      )}

      {step === "PASSWORD" && (
        <>
          {heading("Welcome back", "Sign in with your password")}
          {notice && <p className="text-[13px] text-[#F5C518]">{notice}</p>}
          {identityRow}
          <form onSubmit={signIn} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={`${mode}-password`} className={labelCls}>
                  Password
                </label>
                {!isEmail && (
                  <button
                    type="button"
                    onClick={() => setStep("FORGOT")}
                    className="min-h-[44px] px-1 text-[12px] text-[#9A9DA5] hover:text-[#F5C518] transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              {passwordInput(`${mode}-password`, password, setPassword, "current-password", "••••••••••")}
            </div>
            {errorBox}
            <button type="submit" disabled={loading} className="ff-btn ff-btn-gold w-full h-12 disabled:opacity-50 disabled:pointer-events-none">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </>
      )}

      {step === "ACTIVATE" && (
        <>
          {heading(
            "Secure your account",
            "Verify your phone to create a password",
            "This phone number is already registered. Verify your phone to create your account password."
          )}
          {identityRow}
          {errorBox}
          <button type="button" onClick={() => { setError(""); setStep("OTP"); }} className="ff-btn ff-btn-gold w-full h-12">
            <ShieldCheck className="w-4 h-4" /> Verify phone via OTP
          </button>
        </>
      )}

      {step === "NEW" && (
        <>
          {heading(
            "New customer",
            "Verify your phone",
            mode === "login"
              ? "No account uses this number yet. Create one to save your collection, wishlist and orders."
              : "We'll text a one-time code to confirm this number, then you'll create a password."
          )}
          {identityRow}
          {errorBox}
          {mode === "login" ? (
            <Link href={`/register?phone=${encodeURIComponent(identifier.replace(/^\+91/, ""))}`} className="ff-btn ff-btn-gold w-full h-12">
              Create account <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button type="button" onClick={() => { setError(""); setStep("OTP"); }} className="ff-btn ff-btn-gold w-full h-12">
              <Smartphone className="w-4 h-4" /> Verify mobile via OTP
            </button>
          )}
        </>
      )}

      {step === "OTP" && (
        <>
          {heading("Verify your phone", "Enter the code", `We sent a 6-digit code to +91 ${displayIdentifier.replace(/^\+91\s?/, "")}.`)}
          {identityRow}
          {errorBox}
          {loading && (
            <p className="flex items-center gap-2 text-[13px] text-[#9A9DA5]" aria-live="polite">
              <Loader2 className="w-4 h-4 animate-spin text-[#F5C518]" /> Confirming verification…
            </p>
          )}
          {/* keyed by number: a different number always gets a fresh widget and a fresh OTP */}
          <MSG91OTPWidget key={identifier} phone={identifier} onSuccess={handleOtpSuccess} onError={(msg) => setError(msg)} />
        </>
      )}

      {step === "CREATE" && (
        <>
          {heading(
            "Number verified",
            accountState === "NEW" ? "Create your account" : "Create your password",
            accountState === "NEW" ? "Add your name and choose a password (at least 8 characters)." : "Choose a password (at least 8 characters). You'll use it to sign in from now on."
          )}
          {identityRow}
          <form onSubmit={createPassword} className="space-y-4" noValidate>
            {accountState === "NEW" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  autoComplete="given-name"
                  placeholder="First name"
                  aria-label="First name"
                  value={names.firstName}
                  onChange={(e) => setNames({ ...names, firstName: e.target.value })}
                  className={field}
                />
                <input
                  type="text"
                  autoComplete="family-name"
                  placeholder="Last name"
                  aria-label="Last name"
                  value={names.lastName}
                  onChange={(e) => setNames({ ...names, lastName: e.target.value })}
                  className={field}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor={`${mode}-new-password`} className={labelCls}>
                Create password
              </label>
              {passwordInput(`${mode}-new-password`, password, setPassword, "new-password")}
            </div>
            <div className="space-y-1.5">
              <label htmlFor={`${mode}-confirm-password`} className={labelCls}>
                Confirm password
              </label>
              {passwordInput(`${mode}-confirm-password`, confirm, setConfirm, "new-password")}
              {confirm && password !== confirm && <p className="text-[12px] text-rose-300">Passwords do not match.</p>}
            </div>
            {errorBox}
            <button type="submit" disabled={loading} className="ff-btn ff-btn-gold w-full h-12 disabled:opacity-50 disabled:pointer-events-none">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create password <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
