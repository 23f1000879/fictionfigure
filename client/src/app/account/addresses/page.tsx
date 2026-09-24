"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, ArrowLeft, Loader2, AlertCircle, Plus, Trash2, Edit2, Check, CheckCircle2 } from "lucide-react";
import { API_BASE, safeApiFetch } from "@/lib/api";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AccountTabNav } from "@/components/account/AccountTabNav";

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
        <main className="editorial-container py-16 text-[#111111] min-h-[60vh] flex items-center justify-center">
          <div className="text-center text-xs text-[#6B6B6B] space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#111111]" />
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
              className="px-4 py-2 bg-[#111111] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-[#111111] transition-all flex items-center space-x-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Address</span>
            </button>
          )}
        </div>

        {/* Tab Nav */}
        <AccountTabNav activeTab="addresses" addressCount={addresses.length} />

        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form area */}
        {showForm && (
          <form onSubmit={handleSaveAddress} className="bg-white border border-[#E5E5E2] p-5 sm:p-8 space-y-6 rounded-lg shadow-2xs">
            <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#111111]">
                {editingAddressId ? "Edit Address" : "Add New Delivery Address"}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-[#6B6B6B] hover:text-[#111111] underline uppercase tracking-wider"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Ren Amamiya"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] rounded-md focus:border-[#111111] focus:outline-none"
                />
                {fieldErrors.fullName && <p className="text-[11px] text-[#A83232]">{fieldErrors.fullName}</p>}
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">Street Address *</label>
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleInputChange}
                  placeholder="42 Collector's Enclave, Station Road"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] rounded-md focus:border-[#111111] focus:outline-none"
                />
                {fieldErrors.streetAddress && <p className="text-[11px] text-[#A83232]">{fieldErrors.streetAddress}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">Apartment / Landmark (Optional)</label>
                  <input
                    type="text"
                    name="apartment"
                    value={formData.apartment}
                    onChange={handleInputChange}
                    placeholder="Near City Circle"
                    className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] rounded-md focus:border-[#111111] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Bikaner"
                    className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] rounded-md focus:border-[#111111] focus:outline-none"
                  />
                  {fieldErrors.city && <p className="text-[11px] text-[#A83232]">{fieldErrors.city}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Rajasthan"
                    className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] rounded-md focus:border-[#111111] focus:outline-none"
                  />
                  {fieldErrors.state && <p className="text-[11px] text-[#A83232]">{fieldErrors.state}</p>}
                </div>
                <div className="space-y-1">
                  <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">PIN Code (6 Digits) *</label>
                  <input
                    type="text"
                    name="postalCode"
                    maxLength={6}
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="334001"
                    className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-[#111111] rounded-md focus:border-[#111111] focus:outline-none"
                  />
                  {fieldErrors.postalCode && <p className="text-[11px] text-[#A83232]">{fieldErrors.postalCode}</p>}
                </div>
                <div className="space-y-1">
                  <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    readOnly
                    className="w-full p-3 bg-[#E5E5E2]/50 border border-[#E5E5E2] text-[#6B6B6B] rounded-md cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">Contact Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-[#111111] rounded-md focus:border-[#111111] focus:outline-none"
                />
              </div>

              <label className="flex items-center space-x-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                  className="w-4 h-4 accent-[#111111]"
                />
                <span className="text-xs font-semibold text-[#111111]">Set as default shipping address</span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-[#111111] text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-[#D4AF37] hover:text-[#111111] disabled:opacity-50 transition-all flex items-center"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
                <span>{editingAddressId ? "Save Changes" : "Save Address"}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-3 border border-[#E5E5E2] text-xs font-semibold uppercase tracking-wider text-[#111111] rounded-md hover:border-[#111111]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Addresses List or Empty State */}
        {addresses.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-white border border-[#E5E5E2] space-y-4 text-xs rounded-lg shadow-2xs">
            <MapPin className="w-10 h-10 text-[#6B6B6B] mx-auto opacity-50" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#111111]">NO SAVED ADDRESSES</h3>
              <p className="text-[#6B6B6B] mt-1">Add an address for a faster checkout experience.</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="inline-flex items-center justify-center px-6 py-3 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest rounded-md hover:bg-[#D4AF37] hover:text-[#111111] transition-all"
            >
              <Plus className="w-3.5 h-3.5 mr-2" /> ADD ADDRESS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`bg-white border p-5 space-y-3 text-xs rounded-lg shadow-2xs transition-all ${
                  addr.isDefault ? "border-[#111111] bg-[#F7F7F5]" : "border-[#E5E5E2]"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-[#111111] text-sm">{addr.fullName}</h4>
                    {addr.isDefault && (
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-[#111111] text-[#D4AF37] px-2 py-0.5 rounded-xs">
                        DEFAULT ADDRESS
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleStartEdit(addr)}
                      className="p-1.5 text-[#6B6B6B] hover:text-[#111111]"
                      title="Edit address"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="p-1.5 text-[#6B6B6B] hover:text-[#A83232]"
                      title="Delete address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-[#6B6B6B] leading-relaxed space-y-0.5">
                  <p className="text-[#111111] font-medium">{addr.streetAddress}</p>
                  {addr.apartment && <p>{addr.apartment}</p>}
                  <p>
                    {addr.city}, {addr.state} - {addr.postalCode}
                  </p>
                  <p>{addr.country || "India"}</p>
                  {addr.phone && <p className="font-mono text-[#111111] pt-1">Phone: {addr.phone}</p>}
                </div>

                {!addr.isDefault && (
                  <div className="pt-2 border-t border-[#E5E5E2]">
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[11px] font-semibold text-[#111111] hover:underline uppercase tracking-wider"
                    >
                      Set as Default Address
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
