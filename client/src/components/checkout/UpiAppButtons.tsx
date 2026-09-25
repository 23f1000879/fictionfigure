"use client";

import React, { useEffect, useState } from "react";
import { Check, Copy, Smartphone } from "lucide-react";

/**
 * App-specific UPI payment links for phones.
 *
 * A bare `upi://pay` link opens whichever app the phone treats as the default UPI handler
 * (often WhatsApp). Instead each button targets one app:
 *  - Android: an `intent://` link pinned to the app's package, so only that app can open it.
 *  - iOS: the app's own URL scheme.
 * "Other UPI app" keeps the generic link for anything else (Android shows an app chooser).
 */

interface UpiApp {
  id: string;
  name: string;
  androidPackage: string;
  /** iOS URL scheme prefix; omitted when the app has no documented iOS pay scheme. */
  iosPrefix?: string;
  tint: string;
}

const APPS: UpiApp[] = [
  { id: "phonepe", name: "PhonePe", androidPackage: "com.phonepe.app", iosPrefix: "phonepe://pay", tint: "#5F259F" },
  { id: "gpay", name: "Google Pay", androidPackage: "com.google.android.apps.nbu.paisa.user", iosPrefix: "tez://upi/pay", tint: "#1A73E8" },
  { id: "paytm", name: "Paytm", androidPackage: "net.one97.paytm", iosPrefix: "paytmmp://pay", tint: "#00BAF2" },
  { id: "bhim", name: "BHIM", androidPackage: "in.org.npci.upiapp", tint: "#F47920" },
];

type Platform = "android" | "ios" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  return "other";
}

export function appPaymentHref(app: UpiApp, query: string, platform: Platform): string | null {
  if (platform === "android") return `intent://pay?${query}#Intent;scheme=upi;package=${app.androidPackage};end`;
  if (platform === "ios") return app.iosPrefix ? `${app.iosPrefix}?${query}` : null;
  return null;
}

interface UpiAppButtonsProps {
  /** The full `upi://pay?...` URI (amount, payee, currency already encoded). */
  upiUri: string;
  upiId: string;
}

export function UpiAppButtons({ upiUri, upiId }: UpiAppButtonsProps) {
  const [platform, setPlatform] = useState<Platform>("other");
  const [copied, setCopied] = useState(false);
  useEffect(() => setPlatform(detectPlatform()), []);

  const query = upiUri.split("?")[1] || "";
  const apps = APPS.map((app) => ({ app, href: appPaymentHref(app, query, platform) })).filter((a) => a.href);

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable: the ID is still shown in full below */
    }
  };

  return (
    <div className="sm:hidden space-y-3 text-left" data-upi-apps>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A9DA5] text-center">Pay with your UPI app</p>

      {apps.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {apps.map(({ app, href }) => (
            <a
              key={app.id}
              href={href!}
              data-upi-app={app.id}
              className="flex items-center gap-2.5 h-12 px-3 rounded-[8px] bg-[#111318] border border-white/[0.1] text-[13px] font-semibold text-white active:scale-[0.98] hover:border-white/25 transition-colors"
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white shrink-0"
                style={{ background: app.tint }}
                aria-hidden
              >
                {app.name.charAt(0)}
              </span>
              <span className="truncate">{app.name}</span>
            </a>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <a
          href={upiUri}
          data-upi-app="other"
          className="flex items-center justify-center gap-2 h-12 px-3 rounded-[8px] border border-white/[0.1] text-[12px] font-semibold text-[#F7F7F5] hover:border-white/25 transition-colors"
        >
          <Smartphone className="w-4 h-4" /> Other UPI app
        </a>
        <button
          type="button"
          onClick={copyUpiId}
          className="flex items-center justify-center gap-2 h-12 px-3 rounded-[8px] border border-white/[0.1] text-[12px] font-semibold text-[#F7F7F5] hover:border-white/25 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied" : "Copy UPI ID"}
        </button>
      </div>

      <p className="text-[11px] text-[#6E717A] text-center leading-relaxed">
        If an app declines the payment, scan the QR above from inside that app, or pay to the UPI ID manually.
      </p>
    </div>
  );
}
