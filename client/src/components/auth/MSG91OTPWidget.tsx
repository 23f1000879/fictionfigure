"use client";

import React, { useEffect, useState, useRef } from "react";
import { Loader2, ShieldCheck, RefreshCw, ArrowRight, AlertCircle } from "lucide-react";

export interface MSG91VerificationPayload {
  accessToken: string;
  reqId?: string;
}

interface MSG91OTPWidgetProps {
  phone: string; // E.164 formatted phone (+91XXXXXXXXXX)
  onSuccess: (payload: MSG91VerificationPayload) => void;
  onError: (errorMsg: string) => void;
}

export function MSG91OTPWidget({ phone, onSuccess, onError }: MSG91OTPWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [resendTimer, setResendTimer] = useState(38);
  const [resendAttempts, setResendAttempts] = useState(2);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [msgSent, setMsgSent] = useState(false);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || "36686b683157313235353939";
  const tokenAuth = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || "";

  // Refs for tracking initialization, dispatch, and reqId
  const reqIdRef = useRef<string | null>(null);
  const sdkInitializedRef = useRef(false);
  const otpDispatchedRef = useRef(false);

  // 38-second resend cooldown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-focus first box when widget loads
  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 100);
    }
  }, [loading]);

  useEffect(() => {
    if (sdkInitializedRef.current) return;
    sdkInitializedRef.current = true;

    const cleanPhone = phone.replace("+", "");

    const configuration = {
      widgetId,
      tokenAuth,
      identifier: cleanPhone,
      exposeMethods: "true",
      success: (data: any) => {
        console.log("MSG91 widget initialized");
        const reqId = data?.reqId || data?.req_id || data?.requestId;
        if (reqId) reqIdRef.current = reqId;
      },
      failure: (error: any) => {
        console.error("MSG91 widget initialization failed");
        onError(typeof error === "string" ? error : error?.message || "MSG91 OTP Verification failed.");
      },
    };

    const loadOtpScript = (urls: string[]) => {
      let i = 0;
      function attempt() {
        if (i >= urls.length) {
          setLoading(false);
          console.error("Failed to load MSG91 OTP script");
          return;
        }

        const script = document.createElement("script");
        script.src = urls[i];
        script.async = true;
        script.onload = () => {
          setLoading(false);
          console.log("MSG91 Web SDK Loaded");

          // Initialize Web SDK
          if (typeof (window as any).initSendOTP === "function") {
            (window as any).initSendOTP(configuration);
          }

          // Trigger sendOtp exactly ONCE for this session
          if (!otpDispatchedRef.current) {
            otpDispatchedRef.current = true;
            if (typeof (window as any).sendOtp === "function") {
              console.log("Dispatching MSG91 OTP to phone");
              (window as any).sendOtp(
                cleanPhone,
                (res: any) => {
                  setMsgSent(true);
                  console.log("MSG91 OTP dispatched successfully");
                  const reqId = res?.reqId || res?.req_id || res?.requestId || (typeof res === "string" ? res : null);
                  if (reqId) {
                    reqIdRef.current = reqId;
                  }
                },
                (err: any) => {
                  console.error("MSG91 OTP dispatch failed");
                  onError(err?.message || "Failed to dispatch SMS OTP. Please try again.");
                }
              );
            } else {
              setMsgSent(true);
            }
          }
        };
        script.onerror = () => {
          i++;
          attempt();
        };
        document.head.appendChild(script);
      }
      attempt();
    };

    loadOtpScript([
      "https://verify.msg91.com/otp-provider.js",
      "https://verify.phone91.com/otp-provider.js",
    ]);
  }, [phone, widgetId, tokenAuth, onSuccess, onError]);

  // Handle Individual Box Input with Auto-Advance
  const handleDigitChange = (index: number, value: string) => {
    const numericVal = value.replace(/\D/g, "");
    const newDigits = [...otpDigits];

    if (numericVal.length > 0) {
      newDigits[index] = numericVal[numericVal.length - 1];
      setOtpDigits(newDigits);

      // Auto-advance focus
      if (index < 5) {
        inputRefs[index + 1].current?.focus();
      }
    } else {
      newDigits[index] = "";
      setOtpDigits(newDigits);
    }
  };

  // Handle Backspace Navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  // Handle Paste Event across all 6 boxes
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newDigits = ["", "", "", "", "", ""];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setOtpDigits(newDigits);

    const nextFocusIndex = Math.min(pastedData.length, 5);
    inputRefs[nextFocusIndex].current?.focus();
  };

  const handleManualVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpDigits.join("");

    if (cleanCode.length !== 6) {
      onError("Please enter the complete 6-digit OTP code.");
      return;
    }

    setVerifying(true);

    // Invoke MSG91 verifyOtp using positional arguments:
    // window.verifyOtp(otp, successCallback, failureCallback, reqId)
    if (typeof (window as any).verifyOtp === "function") {
      try {
        console.log("Executing MSG91 OTP verification...");
        (window as any).verifyOtp(
          cleanCode,
          (data: any) => {
            setVerifying(false);
            console.log("MSG91 OTP verification succeeded");
            const accessToken =
              typeof data === "string"
                ? data
                : data?.message || data?.token || data?.["access-token"] || data?.response;
            const resReqId = data?.reqId || data?.req_id || reqIdRef.current || undefined;

            if (accessToken) {
              onSuccess({ accessToken, reqId: resReqId });
            } else {
              onError("MSG91 access token missing in verification response.");
            }
          },
          (err: any) => {
            setVerifying(false);
            console.error("MSG91 OTP verification failed");
            const rawMsg = (err?.message || "").toLowerCase();
            if (rawMsg.includes("invalid") || rawMsg.includes("7053")) {
              onError("That code doesn't match. Please check the SMS and try again.");
            } else if (rawMsg.includes("expire")) {
              onError("Your code has expired. Please request a new one.");
            } else {
              onError(err?.message || "That code doesn't match. Please check the SMS and try again.");
            }
          },
          reqIdRef.current
        );
        return;
      } catch (err) {
        setVerifying(false);
        console.error("MSG91 verifyOtp invocation exception");
      }
    }

    setVerifying(false);
    onError("MSG91 verifyOtp method unavailable. Please complete verification.");
  };

  const handleResend = () => {
    if (resendTimer > 0 || resendAttempts <= 0) return;
    setResendAttempts((prev) => prev - 1);
    setResendTimer(38);
    setOtpDigits(["", "", "", "", "", ""]);
    inputRefs[0].current?.focus();

    if (typeof (window as any).retryOtp === "function") {
      try {
        console.log("Resending MSG91 OTP...");
        (window as any).retryOtp(
          null,
          (res: any) => {
            setMsgSent(true);
            console.log("MSG91 OTP resend succeeded");
            const newReqId = res?.reqId || res?.req_id || res?.requestId;
            if (newReqId) {
              reqIdRef.current = newReqId;
            }
          },
          (err: any) => {
            console.error("MSG91 OTP resend failed");
            onError(err?.message || "Failed to resend OTP.");
          },
          reqIdRef.current
        );
      } catch (e) {
        console.warn("MSG91 retryOtp exception");
      }
    }
  };

  const fullCodeLength = otpDigits.join("").length;

  return (
    <div className="space-y-6 text-[#111111]">
      <div id="msg91-otp-container" className="w-full"></div>

      {loading ? (
        <div className="p-8 text-center text-xs text-[#6B6B6B]">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Initializing MSG91 OTP Gateway...
        </div>
      ) : (
        <form onSubmit={handleManualVerifySubmit} className="space-y-6">
          {/* Segmented 6 OTP Digit Boxes */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] block text-center">
              ENTER 6-DIGIT VERIFICATION CODE
            </label>

            <div className="flex justify-between items-center gap-2 sm:gap-2.5">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  required
                  maxLength={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className="w-11 h-13 sm:w-13 sm:h-14 bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-center text-xl font-bold text-[#111111] focus:border-[#111111] focus:bg-white focus:outline-none transition-all rounded-none"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={verifying || fullCodeLength !== 6}
            className="w-full py-4 bg-[#111111] text-white font-semibold text-xs uppercase tracking-widest hover:bg-black disabled:opacity-40 transition-colors flex items-center justify-center space-x-2"
          >
            {verifying ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>VERIFYING...</span>
              </div>
            ) : (
              <>
                <span>VERIFY MOBILE</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Resend Controls & Timer */}
      <div className="flex justify-between items-center text-xs text-[#6B6B6B] pt-4 border-t border-[#E5E5E2]">
        <span>Didn't receive the code?</span>
        {resendTimer > 0 ? (
          <span className="font-mono text-[#6B6B6B]">
            Resend available in <strong className="text-[#111111]">{resendTimer}s</strong>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendAttempts <= 0}
            className="font-semibold text-[#111111] hover:underline disabled:opacity-40 uppercase tracking-wider text-[11px] flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            <span>RESEND SMS</span>
          </button>
        )}
      </div>
    </div>
  );
}
