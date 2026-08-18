"use client";

import React, { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Tag, Plus, Edit2, Trash2, Loader2, AlertCircle, CheckCircle2, Power } from "lucide-react";
import { API_BASE, adminFetch } from "@/lib/api";

export default function AdminDiscountsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);

  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minOrderValue: 0,
    maxDiscountAmount: "",
    maxUsage: 100,
    perCustomerLimit: 1,
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchCoupons = () => {
    setLoading(true);
    adminFetch(`${API_BASE}/admin/coupons`)
      .then((res) => res.json())
      .then((data) => setCoupons(data.coupons || []))
      .catch((err: any) => {
        setErrorMsg(err.message || "Failed to load coupons.");
        setCoupons([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setForm({
      code: "",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderValue: 0,
      maxDiscountAmount: "",
      maxUsage: 100,
      perCustomerLimit: 1,
      isActive: true,
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (c: any) => {
    setEditingCoupon(c);
    setForm({
      code: c.code || "",
      discountType: c.discountType || "PERCENTAGE",
      discountValue: c.discountValue || 0,
      minOrderValue: c.minOrderValue || 0,
      maxDiscountAmount: c.maxDiscountAmount ? String(c.maxDiscountAmount) : "",
      maxUsage: c.maxUsage || 100,
      perCustomerLimit: c.perCustomerLimit || 1,
      isActive: c.isActive ?? true,
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const url = editingCoupon
        ? `${API_BASE}/admin/coupons/${editingCoupon.id}`
        : `${API_BASE}/admin/coupons`;
      const method = editingCoupon ? "PATCH" : "POST";

      const res = await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save coupon");

      setSuccessMsg(editingCoupon ? "Coupon updated successfully" : "Coupon created successfully");
      setIsModalOpen(false);
      fetchCoupons();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (c: any) => {
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await adminFetch(`${API_BASE}/admin/coupons/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update coupon state");

      setSuccessMsg(`Coupon "${c.code}" ${!c.isActive ? "activated" : "deactivated"} successfully.`);
      fetchCoupons();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update coupon");
    }
  };

  const handleDelete = async (c: any) => {
    if (!confirm(`Are you sure you want to delete coupon code "${c.code}"?`)) return;

    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await adminFetch(`${API_BASE}/admin/coupons/${c.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete coupon");

      setSuccessMsg(`Coupon code "${c.code}" deleted.`);
      fetchCoupons();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete coupon");
    }
  };

  return (
    <div className="space-y-6 text-[#111111]">
      <div className="flex justify-between items-end border-b border-[#E5E5E2] pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Promotions Console
          </span>
          <h1 className="text-2xl font-semibold text-[#111111] tracking-tight">
            Discount Codes ({coupons.length})
          </h1>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black transition-colors flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-[#2E6B44]/10 border border-[#2E6B44] text-[#2E6B44] text-xs font-semibold flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-[#6B6B6B]">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Loading discount codes...
        </div>
      ) : coupons.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E5E5E2] space-y-3 text-xs">
          <Tag className="w-8 h-8 text-[#6B6B6B] mx-auto opacity-40" />
          <p className="text-[#6B6B6B]">No active or historical coupon codes found.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5E2] overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F7F5] border-b border-[#E5E5E2] uppercase font-semibold text-[#6B6B6B]">
                <th className="p-4">Coupon Code</th>
                <th className="p-4">Type</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Min Order</th>
                <th className="p-4">Usage</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E2]">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-[#F7F7F5]">
                  <td className="p-4 font-mono font-bold text-sm text-[#111111] flex items-center space-x-2">
                    <Tag className="w-3.5 h-3.5 text-[#2E6B44]" />
                    <span>{c.code}</span>
                  </td>
                  <td className="p-4 uppercase font-semibold text-[#6B6B6B]">{c.discountType}</td>
                  <td className="p-4 font-mono font-semibold text-[#111111]">
                    {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : formatPrice(c.discountValue)}
                  </td>
                  <td className="p-4 font-mono text-[#6B6B6B]">{formatPrice(c.minOrderValue)}</td>
                  <td className="p-4 font-mono font-semibold text-[#111111]">
                    {c.usedCount} / {c.maxUsage}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 ${
                        c.isActive ? "bg-[#2E6B44] text-white" : "bg-[#6B6B6B] text-white"
                      }`}
                    >
                      {c.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleToggleActive(c)}
                      className="px-2.5 py-1.5 border border-[#E5E5E2] hover:border-[#111111] text-[11px] font-semibold uppercase tracking-wider inline-flex items-center"
                      title={c.isActive ? "Deactivate Coupon" : "Activate Coupon"}
                    >
                      <Power className="w-3 h-3 mr-1" />
                      <span>{c.isActive ? "Deactivate" : "Activate"}</span>
                    </button>
                    <button
                      onClick={() => openEditModal(c)}
                      className="px-2.5 py-1.5 border border-[#E5E5E2] hover:border-[#111111] text-[11px] font-semibold uppercase tracking-wider inline-flex items-center"
                    >
                      <Edit2 className="w-3 h-3 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="px-2.5 py-1.5 border border-[#A83232]/30 hover:border-[#A83232] text-[#A83232] text-[11px] font-semibold uppercase tracking-wider inline-flex items-center"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT COUPON MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E5E2] p-6 max-w-lg w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-3">
              <h3 className="font-semibold uppercase tracking-wider text-[#111111]">
                {editingCoupon ? "Edit Coupon Code" : "Create New Coupon Code"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#6B6B6B] hover:text-[#111111]">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold uppercase text-[#6B6B6B]">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. WELCOME10"
                    className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono font-bold focus:border-[#111111] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold uppercase text-[#6B6B6B]">Discount Type *</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold uppercase text-[#6B6B6B]">
                    Discount Value ({form.discountType === "PERCENTAGE" ? "%" : "₹"}) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                    className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold uppercase text-[#6B6B6B]">Minimum Order (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.minOrderValue}
                    onChange={(e) => setForm({ ...form, minOrderValue: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold uppercase text-[#6B6B6B]">Max Discount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxDiscountAmount}
                    onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                    placeholder="Optional cap"
                    className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold uppercase text-[#6B6B6B]">Total Usage Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxUsage}
                    onChange={(e) => setForm({ ...form, maxUsage: Number(e.target.value) })}
                    className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold uppercase text-[#6B6B6B]">Per Customer Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={form.perCustomerLimit}
                    onChange={(e) => setForm({ ...form, perCustomerLimit: Number(e.target.value) })}
                    className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#E5E5E2]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#E5E5E2] font-semibold uppercase text-[#6B6B6B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#111111] text-white font-semibold uppercase hover:bg-black disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Coupon</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
