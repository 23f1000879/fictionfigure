"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, Save, LogOut, ShieldCheck } from "lucide-react";
import { formatDisplayPhone } from "@/lib/phone";
import { API_BASE } from "@/lib/api";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AccountShell } from "@/components/account/AccountShell";

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
        <main className="editorial-container py-16 text-[#F7F7F5] min-h-[60vh] flex items-center justify-center">
          <div className="text-center text-xs text-[#9A9DA5] space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#F7F7F5]" />
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
      <AccountShell>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-6">
          <div className="flex items-center space-x-3 min-w-0">
            <Link
              href="/account"
              className="p-2 border border-white/[0.08] hover:border-white/30 rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#F7F7F5]" />
            </Link>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9A9DA5] block truncate">
                Collector Sanctuary
              </span>
              <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-[#F7F7F5] truncate">
                Customer Profile
              </h1>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-white/[0.08] hover:border-white/30 text-xs font-semibold uppercase tracking-wider text-[#F7F7F5] rounded-lg transition-colors flex items-center space-x-2 shrink-0 min-h-[40px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

        {/* Tab Nav */}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-semibold rounded-lg flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-semibold rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Edit Profile Form Card */}
        <div className="bg-[#111318] border border-white/[0.08] p-6 sm:p-8 space-y-6 rounded-2xl shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.08] pb-4 gap-2">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#F7F7F5]">
                EDIT PROFILE DETAILS
              </h2>
              <p className="text-xs text-[#9A9DA5] mt-0.5">
                Update your collector profile name and communication preferences.
              </p>
            </div>
            <span className="text-[11px] font-medium text-emerald-400 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 shrink-0" />
              Verified Mobile Authentication Identity
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1.5">
                <label className="font-bold uppercase text-[#9A9DA5] text-[10px] tracking-wider block">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First Name"
                  className="w-full p-3.5 bg-[#17191F] border border-white/[0.08] text-[#F7F7F5] rounded-lg focus:border-[#F5C518]/60 focus:outline-none focus:ring-1 focus:ring-[#F5C518]/40 text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase text-[#9A9DA5] text-[10px] tracking-wider block">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                  className="w-full p-3.5 bg-[#17191F] border border-white/[0.08] text-[#F7F7F5] rounded-lg focus:border-[#F5C518]/60 focus:outline-none focus:ring-1 focus:ring-[#F5C518]/40 text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1.5">
                <label className="font-bold uppercase text-[#9A9DA5] text-[10px] tracking-wider block">
                  Mobile Phone (Verified)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatDisplayPhone(user.phone)}
                    readOnly
                    className="w-full p-3.5 bg-white/[0.06] border border-white/[0.08] font-mono text-[#F7F7F5] rounded-lg cursor-not-allowed text-xs font-semibold"
                  />
                  <span className="absolute right-3.5 top-3.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 shrink-0" /> Verified
                  </span>
                </div>
                <p className="text-[10px] text-[#9A9DA5]">
                  Your verified mobile number is used as your primary login identity across Fiction Figures.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase text-[#9A9DA5] text-[10px] tracking-wider block">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="collector@domain.com"
                  className="w-full p-3.5 bg-[#17191F] border border-white/[0.08] text-[#F7F7F5] rounded-lg focus:border-[#F5C518]/60 focus:outline-none focus:ring-1 focus:ring-[#F5C518]/40 text-xs font-medium"
                />
                <p className="text-[10px] text-[#9A9DA5]">
                  Used for order receipts, tracking notifications, and restock alerts.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex items-center">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#F5C518] text-[#08090B] text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#FFD43B] disabled:opacity-50 transition-all flex items-center justify-center space-x-2 min-h-[44px]"
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
      </AccountShell>
      <Footer />
    </>
  );
}
