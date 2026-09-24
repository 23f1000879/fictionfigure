"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, ArrowLeft, Loader2, AlertCircle, CheckCircle2, ShieldCheck, Save, LogOut } from "lucide-react";
import { formatDisplayPhone } from "@/lib/phone";
import { API_BASE } from "@/lib/api";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AccountTabNav } from "@/components/account/AccountTabNav";

export default function AccountProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const fetchProfile = async () => {
    const token = localStorage.getItem("fictionfigure_token");
    if (!token) {
      router.push("/login?redirect=/account/profile");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.authenticated && data.user) {
        setUser(data.user);
        setFormData({
          firstName: data.user.firstName || "",
          lastName: data.user.lastName || "",
          email: data.user.email || "",
        });
      } else {
        localStorage.removeItem("fictionfigure_token");
        router.push("/login?redirect=/account/profile");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load customer profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
    if (successMessage) setSuccessMessage("");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("fictionfigure_token");
    if (!token) return;

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");

      setUser((prev: any) => ({ ...prev, ...data.user }));
      setSuccessMessage("Your profile has been updated successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("fictionfigure_token");
    router.push("/login");
  };

  if (loading || !user) {
    return (
      <>
        <Header />
        <SearchModal />
        <CartDrawer />
        <main className="editorial-container py-16 text-[#111111] min-h-[60vh] flex items-center justify-center">
          <div className="text-center text-xs text-[#6B6B6B] space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#111111]" />
            <span>Loading collector profile...</span>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const orderCount = user._count?.orders || user.orders?.length || 0;
  const addressCount = user._count?.addresses || 0;

  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12 text-[#111111] space-y-6 min-h-[70vh] box-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-6">
          <div className="flex items-center space-x-3">
            <Link
              href="/account"
              className="p-2 border border-[#E5E5E2] hover:border-[#111111] min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-[#111111]" />
            </Link>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#6B6B6B] block">
                Collector Sanctuary
              </span>
              <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-[#111111] truncate">
                Customer Profile
              </h1>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-[#E5E5E2] hover:border-[#111111] text-xs font-semibold uppercase tracking-wider text-[#111111] transition-colors flex items-center space-x-2 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Tab Nav */}
        <AccountTabNav activeTab="profile" orderCount={orderCount} addressCount={addressCount} />

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 bg-[#2E6B44]/10 border border-[#2E6B44] text-[#2E6B44] text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Edit Profile Form */}
        <div className="bg-white border border-[#E5E5E2] p-5 sm:p-8 space-y-6 rounded-lg shadow-2xs">
          <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#111111]">
                EDIT PROFILE DETAILS
              </h2>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Update your collector name and email preferences.
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#6B6B6B]">ID: {user.id.slice(0, 8)}...</span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Ren"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] rounded-md focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Amamiya"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] rounded-md focus:border-[#111111] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">
                  Mobile Phone (Verified)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatDisplayPhone(user.phone)}
                    readOnly
                    className="w-full p-3 bg-[#E5E5E2]/50 border border-[#E5E5E2] font-mono text-[#111111] rounded-md cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-3 text-[10px] font-bold text-[#2E6B44] uppercase tracking-wider flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 shrink-0" /> Verified
                  </span>
                </div>
                <p className="text-[10px] text-[#6B6B6B]">
                  Your mobile phone number is verified via OTP authentication and serves as your primary login ID.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="collector@domain.com"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] rounded-md focus:border-[#111111] focus:outline-none"
                />
                <p className="text-[10px] text-[#6B6B6B]">
                  Used for digital invoices and order shipment updates.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E5E2] flex items-center space-x-3">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3.5 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest rounded-md hover:bg-[#D4AF37] hover:text-[#111111] disabled:opacity-50 transition-all flex items-center space-x-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                <span>SAVE PROFILE CHANGES</span>
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
