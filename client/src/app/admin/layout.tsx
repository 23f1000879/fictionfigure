"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ShieldAlert, Loader2, LogOut } from "lucide-react";

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

    fetch("http://localhost:5000/api/auth/me", {
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
      <div className="min-h-screen bg-[#F7F7F5] flex flex-col items-center justify-center text-xs text-[#6B6B6B]">
        <Loader2 className="w-6 h-6 animate-spin text-[#111111] mb-2" />
        <span>Authenticating Admin Credentials...</span>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-6 text-[#111111]">
        <div className="bg-white border border-[#E5E5E2] p-8 max-w-md text-center space-y-4 shadow-xl">
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

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex text-[#111111] font-sans">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-[#E5E5E2] px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#6B6B6B]">
            <span>Console</span>
            <span>/</span>
            <span className="text-[#111111] font-semibold">{adminUser?.email || "Admin"}</span>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#2E6B44] animate-pulse"></span>
              <span className="font-mono text-[#111111] font-semibold">Strict Admin Mode</span>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 border border-[#E5E5E2] hover:border-[#111111] font-semibold uppercase text-[10px] tracking-wider flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Admin Logout</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
