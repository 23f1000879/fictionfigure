"use client";

import React, { useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE } from "@/lib/api";
import { AuthShell } from "@/components/auth/AuthShell";
import { PhoneAuthFlow, AuthenticatedUser } from "@/components/auth/PhoneAuthFlow";

/** Only same-site paths are allowed as post-login destinations (blocks //evil.example). */
const safeRedirect = (value: string | null) => (value && value.startsWith("/") && !value.startsWith("//") ? value : null);

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = safeRedirect(searchParams.get("redirect"));

  const routeAfterSignIn = (user: { role?: string } | undefined) => {
    if (user?.role === "ADMIN") router.replace("/admin");
    else if (redirectUrl) router.replace(redirectUrl);
    else router.replace("/account");
  };

  // Already signed in → skip the form
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fictionfigure_token") : null;
    if (!token) return;
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) routeAfterSignIn(data.user);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectUrl]);

  const handleAuthenticated = (token: string, user: AuthenticatedUser) => {
    localStorage.setItem("fictionfigure_token", token);
    routeAfterSignIn(user);
  };

  return (
    <AuthShell>
      <PhoneAuthFlow mode="login" onAuthenticated={handleAuthenticated} />
      <div className="pt-4 border-t border-white/[0.08] text-center text-xs text-[#9A9DA5]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="inline-flex items-center min-h-[44px] font-semibold text-[#F7F7F5] hover:underline ml-1">
          Create account →
        </Link>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#9A9DA5]">Loading sign in…</div>}>
      <LoginForm />
    </Suspense>
  );
}
