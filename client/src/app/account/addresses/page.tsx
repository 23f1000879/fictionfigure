"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, ArrowLeft, Loader2, AlertCircle, Plus, Trash2, Edit2, CheckCircle2 } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AccountShell } from "@/components/account/AccountShell";

export default function AccountAddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    streetAddress: "",
    apartment: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    phone: "",
    isDefault: false,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fetchAddresses = async () => {
    const token = localStorage.getItem("fictionfigure_token");
    if (!token) {
      router.push("/login?redirect=/account/addresses");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/checkout/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setAddresses(data.addresses || []);
      } else {
        throw new Error(data.error || "Failed to load saved addresses.");
      }
    } catch (err: any) {
      if (err.status === 401) {
        localStorage.removeItem("fictionfigure_token");
        router.push("/login?redirect=/account/addresses");
        return;
      }
      setError(err.message || "Failed to load saved addresses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) errors.fullName = "Full name is required.";
    if (!formData.streetAddress.trim()) errors.streetAddress = "Street address is required.";
    if (!formData.city.trim()) errors.city = "City is required.";
    if (!formData.state.trim()) errors.state = "State is required.";
    if (!formData.postalCode.trim()) {
      errors.postalCode = "6-digit PIN code is required.";
    } else if (!/^\d{6}$/.test(formData.postalCode.trim())) {
      errors.postalCode = "Please enter a valid 6-digit Indian PIN code (e.g. 334001).";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      streetAddress: "",
      apartment: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      phone: "",
      isDefault: false,
    });
    setEditingAddressId(null);
    setShowForm(false);
    setFieldErrors({});
  };

  const handleStartEdit = (addr: any) => {
    setFormData({
      fullName: addr.fullName,
      streetAddress: addr.streetAddress,
      apartment: addr.apartment || "",
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country || "India",
      phone: addr.phone || "",
      isDefault: addr.isDefault,
    });
    setEditingAddressId(addr.id);
    setShowForm(true);
    setFieldErrors({});
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token = localStorage.getItem("fictionfigure_token");
    if (!token) return;

    setIsSubmitting(true);
    setError("");

    try {
      const endpoint = editingAddressId
        ? `${API_BASE}/checkout/addresses/${editingAddressId}`
        : `${API_BASE}/checkout/addresses`;
      const method = editingAddressId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save address.");

      resetForm();
      fetchAddresses();
    } catch (err: any) {
      setError(err.message || "Failed to save address.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this saved address?")) return;

    const token = localStorage.getItem("fictionfigure_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/checkout/addresses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete address.");
      fetchAddresses();
    } catch (err: any) {
      setError(err.message || "Failed to delete address.");
    }
  };

  const handleSetDefault = async (id: string) => {
    const token = localStorage.getItem("fictionfigure_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/checkout/addresses/${id}/default`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to set default address.");
      fetchAddresses();
    } catch (err: any) {
      setError(err.message || "Failed to set default address.");
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <SearchModal />
        <CartDrawer />
        <main className="editorial-container py-16 text-[#F7F7F5] min-h-[60vh] flex items-center justify-center">
          <div className="text-center text-xs text-[#9A9DA5] space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#F7F7F5]" />
            <span>Loading saved addresses...</span>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <SearchModal />
      <CartDrawer />
      <AccountShell>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-6 gap-3">
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
                Saved Addresses ({addresses.length})
              </h1>
            </div>
          </div>

          {!showForm && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#F5C518] text-[#08090B] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#FFD43B] transition-all flex items-center justify-center space-x-1.5 shrink-0 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Address</span>
            </button>
          )}
        </div>

        {/* Tab Nav */}

        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-semibold rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Address Form Card */}
        {showForm && (
          <form onSubmit={handleSaveAddress} className="bg-[#111318] border border-white/[0.08] p-6 sm:p-8 space-y-6 rounded-2xl shadow-2xs">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#F7F7F5]">
                {editingAddressId ? "Edit Saved Address" : "Add New Delivery Destination"}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-[#9A9DA5] hover:text-white underline uppercase tracking-wider font-semibold"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold uppercase text-[#9A9DA5] text-[10px] tracking-wider block">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Full Name"
                  className="w-full p-3.5 bg-[#17191F] border border-white/[0.08] text-[#F7F7F5] rounded-lg focus:border-[#F5C518]/60 focus:outline-none focus:ring-1 focus:ring-[#F5C518]/40 text-xs font-medium"
                />
                {fieldErrors.fullName && <p className="text-[11px] text-rose-300">{fieldErrors.fullName}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase text-[#9A9DA5] text-[10px] tracking-wider block">Street Address *</label>
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleInputChange}
                  placeholder="House / Flat / Building No. & Street"
                  className="w-full p-3.5 bg-[#17191F] border border-white/[0.08] text-[#F7F7F5] rounded-lg focus:border-[#F5C518]/60 focus:outline-none focus:ring-1 focus:ring-[#F5C518]/40 text-xs font-medium"
                />
                {fieldErrors.streetAddress && <p className="text-[11px] text-rose-300">{fieldErrors.streetAddress}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold uppercase text-[#9A9DA5] text-[10px] tracking-wider block">Apartment / Landmark (Optional)</label>
                  <input
                    type="text"
                    name="apartment"
                    value={formData.apartment}
                    onChange={handleInputChange}
                    placeholder="Sector / Landmark"
                    className="w-full p-3.5 bg-[#17191F] border border-white/[0.08] text-[#F7F7F5] rounded-lg focus:border-[#F5C518]/60 focus:outline-none focus:ring-1 focus:ring-[#F5C518]/40 text-xs font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold uppercase text-[#9A9DA5] text-[10px] tracking-wider block">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    className="w-full p-3.5 bg-[#17191F] border border-white/[0.08] text-[#F7F7F5] rounded-lg focus:border-[#F5C518]/60 focus:outline-none focus:ring-1 focus:ring-[#F5C518]/40 text-xs font-medium"
                  />
                  {fieldErrors.city && <p className="text-[11px] text-rose-300">{fieldErrors.city}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold uppercase text-[#9A9DA5] text-[10px] tracking-wider block">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State"
                    className="w-full p-3.5 bg-[#17191F] border border-white/[0.08] text-[#F7F7F5] rounded-lg focus:border-[#F5C518]/60 focus:outline-none focus:ring-1 focus:ring-[#F5C518]/40 text-xs font-medium"
                  />
                  {fieldErrors.state && <p className="text-[11px] text-rose-300">{fieldErrors.state}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold uppercase text-[#9A9DA5] text-[10px] tracking-wider block">PIN Code (6 Digits) *</label>
                  <input
                    type="text"
                    name="postalCode"
                    maxLength={6}
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="334001"
                    className="w-full p-3.5 bg-[#17191F] border border-white/[0.08] font-mono text-[#F7F7F5] rounded-lg focus:border-[#F5C518]/60 focus:outline-none focus:ring-1 focus:ring-[#F5C518]/40 text-xs font-semibold"
                  />
                  {fieldErrors.postalCode && <p className="text-[11px] text-rose-300">{fieldErrors.postalCode}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold uppercase text-[#9A9DA5] text-[10px] tracking-wider block">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    readOnly
                    className="w-full p-3.5 bg-white/[0.06] border border-white/[0.08] text-[#9A9DA5] rounded-lg cursor-not-allowed text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase text-[#9A9DA5] text-[10px] tracking-wider block">Contact Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  className="w-full p-3.5 bg-[#17191F] border border-white/[0.08] font-mono text-[#F7F7F5] rounded-lg focus:border-[#F5C518]/60 focus:outline-none focus:ring-1 focus:ring-[#F5C518]/40 text-xs font-semibold"
                />
              </div>

              <label className="flex items-center space-x-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                  className="w-4 h-4 accent-[#F5C518] rounded-md"
                />
                <span className="text-xs font-semibold text-[#F7F7F5]">Set as default shipping destination</span>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#F5C518] text-[#08090B] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#FFD43B] disabled:opacity-50 transition-all flex items-center justify-center min-h-[44px]"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                <span>{editingAddressId ? "Save Changes" : "Save Address"}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="w-full sm:w-auto px-5 py-3.5 border border-white/[0.08] text-xs font-semibold uppercase tracking-wider text-[#F7F7F5] rounded-lg hover:border-white/30 min-h-[44px] flex items-center justify-center"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Addresses Grid or Empty State */}
        {addresses.length === 0 ? (
          <div className="p-8 sm:p-14 text-center bg-[#111318] border border-white/[0.08] space-y-4 text-xs rounded-2xl shadow-2xs">
            <MapPin className="w-12 h-12 text-[#9A9DA5] mx-auto opacity-40" />
            <div className="space-y-1">
              <h3 className="text-base font-bold uppercase tracking-wider text-[#F7F7F5]">NO SAVED ADDRESSES</h3>
              <p className="text-[#9A9DA5]">Add an address for a faster checkout experience.</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="inline-flex items-center justify-center px-6 py-3.5 bg-[#F5C518] text-[#08090B] text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#FFD43B] transition-all min-h-[44px]"
            >
              <Plus className="w-4 h-4 mr-2" /> ADD ADDRESS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`bg-[#111318] border p-6 space-y-4 text-xs rounded-2xl shadow-2xs transition-all flex flex-col justify-between ${
                  addr.isDefault ? "border-[#F5C518] bg-white/[0.02]" : "border-white/[0.08]"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2 border-b border-white/[0.08] pb-3">
                    <div>
                      <h4 className="font-bold text-[#F7F7F5] text-sm">{addr.fullName}</h4>
                      {addr.isDefault && (
                        <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 px-2.5 py-0.5 rounded-md">
                          DEFAULT ADDRESS
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => handleStartEdit(addr)}
                        className="p-2 border border-white/[0.08] hover:border-white/30 rounded-lg bg-[#111318] text-[#9A9DA5] hover:text-white transition-colors"
                        title="Edit address"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-2 border border-white/[0.08] hover:border-rose-500/50 hover:bg-rose-500/5 rounded-lg text-[#9A9DA5] hover:text-rose-300 transition-colors"
                        title="Delete address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-[#9A9DA5] leading-relaxed space-y-0.5">
                    <p className="text-[#F7F7F5] font-medium">{addr.streetAddress}</p>
                    {addr.apartment && <p>{addr.apartment}</p>}
                    <p>
                      {addr.city}, {addr.state} — {addr.postalCode}
                    </p>
                    <p>{addr.country || "India"}</p>
                    {addr.phone && <p className="font-mono text-[#F7F7F5] pt-1">Phone: {addr.phone}</p>}
                  </div>
                </div>

                {!addr.isDefault && (
                  <div className="pt-3 border-t border-white/[0.08]">
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[11px] font-bold text-[#F7F7F5] hover:underline uppercase tracking-wider"
                    >
                      Set as Default Destination →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </AccountShell>
      <Footer />
    </>
  );
}
