"use client";

import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Loader2, Smartphone, ShieldCheck, AlertCircle } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

interface UpiPaymentQrProps {
  /** Merchant VPA from store settings (admin controlled). Never a placeholder. */
  upiId: string;
  /** Payee name shown in the UPI app. */
  payeeName: string;
  cartItems: { variantId: string; quantity: number }[];
  couponCode?: string;
  /** Total currently shown on the page; used only to flag a mismatch. */
  displayedTotal: number;
}

/** Builds a standard UPI payment request URI (NPCI deep-link format). */
export function buildUpiUri({ upiId, payeeName, amount }: { upiId: string; payeeName: string; amount: number }) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: `${payeeName} order`,
  });
  return `upi://pay?${params.toString().replace(/\+/g, "%20")}`;
}

/**
 * Amount-specific UPI QR for manual UPI payments.
 * The amount comes from the server's authoritative checkout calculation (same function the
 * order is priced with). Displaying a QR never marks anything as paid: UPI orders stay
 * PENDING until the team verifies the payment.
 */
export function UpiPaymentQr({ upiId, payeeName, cartItems, couponCode, displayedTotal }: UpiPaymentQrProps) {
  const [amount, setAmount] = useState<number | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const cartKey = useMemo(
    () => JSON.stringify(cartItems.map((i) => [i.variantId, i.quantity])) + "|" + (couponCode || ""),
    [cartItems, couponCode]
  );

  // Authoritative total from the backend, refreshed whenever the cart or coupon changes.
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/checkout/calculate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartItems, couponCode: couponCode || undefined, paymentMethod: "UPI" }),
          signal: controller.signal,
        });
        const data = await res.json();
        const total = Number(data?.totals?.totalAmount);
        if (!res.ok || !Number.isFinite(total) || total <= 0) throw new Error("total unavailable");
        setAmount(total);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setAmount(null);
        setStatus("error");
      }
    }, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
    // cartKey captures the relevant cart/coupon changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey]);

  const uri = amount !== null && upiId ? buildUpiUri({ upiId, payeeName, amount }) : "";

  useEffect(() => {
    if (!uri) return;
    let alive = true;
    QRCode.toDataURL(uri, { errorCorrectionLevel: "M", margin: 2, width: 480, color: { dark: "#08090B", light: "#FFFFFF" } })
      .then((url) => {
        if (alive) {
          setQrDataUrl(url);
          setStatus("ready");
        }
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, [uri]);

  if (!upiId) {
    return (
      <div className="p-4 rounded-[10px] bg-rose-500/10 border border-rose-500/30 text-rose-200 text-[13px] flex items-start gap-2 text-left">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>UPI payments are not available right now. Please choose Cash on Delivery or contact support.</span>
      </div>
    );
  }

  return (
    <div
      className="p-4 sm:p-6 rounded-[12px] bg-[#0D0E12] border border-white/[0.08] text-center space-y-5"
      data-upi-uri={status === "ready" ? uri : undefined}
    >
      <div className="space-y-1">
        <p className="ff-eyebrow justify-center">Scan &amp; pay via UPI</p>
        <p className="text-[32px] font-extrabold tracking-tight text-white" aria-live="polite">
          {amount !== null ? formatPrice(amount) : status === "error" ? "—" : "…"}
        </p>
      </div>

      <div className="relative mx-auto w-[min(240px,70vw)] aspect-square rounded-[12px] bg-[#FFFFFF] border-2 border-[#F5C518]/60 p-2 shadow-[0_0_30px_-8px_rgba(245,197,24,0.4)] flex items-center justify-center">
        {status === "ready" && qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt={`UPI payment QR for ${amount !== null ? formatPrice(amount) : "your order"} to ${upiId}`}
            className="w-full h-full"
          />
        ) : status === "error" ? (
          <p className="px-4 text-[12px] text-[#6E717A]">Couldn&apos;t confirm your total. Refresh the page to load the payment QR.</p>
        ) : (
          <Loader2 className="w-6 h-6 text-[#08090B] animate-spin" aria-label="Preparing payment QR" />
        )}
      </div>

      {status === "ready" && (
        <a href={uri} className="ff-btn ff-btn-outline w-full sm:hidden">
          <Smartphone className="w-4 h-4" /> Pay with a UPI app
        </a>
      )}

      <p className="text-[12px] text-[#9A9DA5]">Scan using Google Pay, PhonePe, Paytm, BHIM or any UPI app.</p>

      <dl className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 text-left">
        <div className="rounded-[8px] bg-[#111318] border border-white/[0.08] p-3 min-w-0">
          <dt className="text-[10px] uppercase tracking-[0.14em] text-[#6E717A]">UPI ID</dt>
          <dd className="mt-1 font-mono text-[13px] text-white break-all select-all">{upiId}</dd>
        </div>
        <div className="rounded-[8px] bg-[#111318] border border-white/[0.08] p-3">
          <dt className="text-[10px] uppercase tracking-[0.14em] text-[#6E717A]">Amount</dt>
          <dd className="mt-1 text-[13px] font-bold text-white">{amount !== null ? formatPrice(amount) : "—"}</dd>
        </div>
      </dl>

      {amount !== null && Math.round(amount) !== Math.round(displayedTotal) && (
        <p className="text-[12px] text-[#F5C518]">Your total was updated by our server. Please pay {formatPrice(amount)}.</p>
      )}

      <p className="flex items-start gap-2 text-left text-[12px] text-[#9A9DA5] leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-[#F5C518] shrink-0 mt-0.5" />
        After paying, place your order. UPI payments are checked by our team before your order is confirmed for dispatch.
      </p>
    </div>
  );
}
