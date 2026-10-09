"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ShieldAlert, Loader2, LogOut, Menu } from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
      <div className="ff-admin min-h-screen bg-[#F7F7F5] flex flex-col items-center justify-center text-xs text-[#6B6B6B]">
        <Loader2 className="w-6 h-6 animate-spin text-[#111111] mb-2" />
        <span>Authenticating Admin Credentials...</span>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="ff-admin min-h-screen bg-[#F7F7F5] flex items-center justify-center p-6 text-[#111111]">
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
    <div className="ff-admin min-h-screen bg-[#F7F7F5] flex flex-col lg:flex-row text-[#111111] font-sans">
      <AdminSidebar isDrawerOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="lg:hidden bg-[#111111] text-white px-4 py-3.5 flex justify-between items-center z-40 shrink-0">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-1.5 hover:bg-[#1E1E1E] text-white focus:outline-none"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Image
              src="/icon-192.png"
              alt="Fiction Figures"
              width={20}
              height={20}
              className="h-5 w-auto object-contain"
            />
            <span className="font-mono text-xs font-bold tracking-tight">FICTIONFIGURE</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B44] animate-pulse"></span>
            <span className="text-[10px] font-mono text-[#6B6B6B]">ADMIN</span>
          </div>
        </header>

        {/* Top Header */}
        <header className="bg-white border-b border-[#E5E5E2] px-4 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#6B6B6B] min-w-0">
            <span className="hidden sm:inline">Console</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-[#111111] font-semibold truncate">{adminUser?.email || "Admin"}</span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 text-xs shrink-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#2E6B44] animate-pulse"></span>
              <span className="font-mono text-[#111111] font-semibold text-[10px] sm:text-xs">Strict Admin Mode</span>
            </div>

            <button
              onClick={handleLogout}
              className="px-2 py-1 sm:px-3 sm:py-1.5 border border-[#E5E5E2] hover:border-[#111111] font-semibold uppercase text-[9px] sm:text-[10px] tracking-wider flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin Logout</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 lg:p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
