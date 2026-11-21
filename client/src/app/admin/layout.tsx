"use client";

import React, { useEffect, useState } from "react";
import "./admin.css";
import { useRouter } from "next/navigation";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { ShieldAlert, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("fictionfigure_token");

    if (!token) {
      setIsAuthorized(false);
      router.push("/login");
      return;
    }

    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user && data.user.role === "ADMIN") {
          setIsAuthorized(true);
          setAdminUser(data.user);
        } else {
          setIsAuthorized(false);
          localStorage.removeItem("fictionfigure_token");
          router.push("/login");
        }
      })
      .catch(() => {
        setIsAuthorized(false);
        router.push("/login");
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("fictionfigure_token");
    router.push("/login");
  };

  if (isAuthorized === null) {
    return (
      <div className="ff-admin admin-auth-state">
        <Loader2 className="w-6 h-6 animate-spin text-[#111111] mb-2" />
        <span>Authenticating Admin Credentials...</span>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="ff-admin admin-auth-state">
        <div className="admin-auth-card">
          <ShieldAlert className="w-12 h-12 text-[#A83232] mx-auto" />
          <h2 className="text-lg font-bold uppercase tracking-wider text-[#111111]">Access Restricted</h2>
          <p className="text-xs text-[#6B6B6B]">
            This portal requires administrator privileges. Please sign in with an verified admin account.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full py-3 bg-[#111111] text-white font-semibold text-xs uppercase tracking-wider"
          >
            Go to Admin Sign In
          </button>
        </div>
      </div>
    );
  }

  return <AdminWorkspace email={adminUser?.email} onLogout={handleLogout}>{children}</AdminWorkspace>;
}
