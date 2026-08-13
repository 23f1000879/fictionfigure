"use client";

import React, { useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils";
import { Boxes, Plus, Minus, AlertTriangle, RefreshCw, Loader2, CheckCircle2 } from "lucide-react";

export default function AdminInventoryPage() {
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionVariant, setActionVariant] = useState<any>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(5);
  const [reason, setReason] = useState<string>("Restock");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/admin/inventory");
      const data = await res.json();
      setInventoryList(data.inventory || []);
    } catch (e) {
      console.error(e);
      setInventoryList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openAdjustModal = (item: any, delta: number) => {
    setActionVariant(item);
    setAdjustmentQty(delta);
    setReason(delta > 0 ? "Restock" : "Manual correction");
  };

  const handleConfirmAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionVariant) return;

    setIsSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: actionVariant.variantId,
          changeQuantity: adjustmentQty,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to adjust stock");

      setMessage(`Stock for SKU ${actionVariant.sku} updated to ${data.newQuantity} units (${reason}).`);
      setActionVariant(null);
      fetchInventory();
    } catch (err: any) {
      alert(err.message || "Failed to update inventory");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-[#111111]">
      <div className="flex justify-between items-end border-b border-[#E5E5E2] pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Stock Operations
          </span>
          <h1 className="text-2xl font-semibold text-[#111111] tracking-tight">
            Inventory Auditor ({inventoryList.length} Variants)
          </h1>
        </div>
        <button
          onClick={fetchInventory}
          className="px-4 py-2 bg-white border border-[#E5E5E2] hover:border-[#111111] text-xs font-semibold uppercase tracking-wider flex items-center"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Audit
        </button>
      </div>

      {message && (
        <div className="p-3 bg-[#2E6B44]/10 border border-[#2E6B44] text-[#2E6B44] text-xs font-semibold flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          <span>{message}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-[#6B6B6B]">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Auditing stock levels...
        </div>
      ) : inventoryList.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E5E5E2] space-y-2 text-xs">
          <Boxes className="w-6 h-6 text-[#6B6B6B] mx-auto opacity-40" />
          <p className="text-[#6B6B6B]">No inventory variants found in system database.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5E2] overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F7F5] border-b border-[#E5E5E2] uppercase font-semibold text-[#6B6B6B]">
                <th className="p-4">SKU</th>
                <th className="p-4">Product Name & Category</th>
                <th className="p-4">Current Stock</th>
                <th className="p-4">Stock Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E2]">
              {inventoryList.map((item) => (
                <tr key={item.variantId} className="hover:bg-[#F7F7F5]">
                  <td className="p-4 font-mono font-semibold text-[#111111]">{item.sku}</td>
                  <td className="p-4">
                    <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">
                      {item.categoryName}
                    </span>
                    <h4 className="font-semibold text-[#111111]">{item.productName}</h4>
                  </td>
                  <td className="p-4 font-mono font-bold text-sm text-[#111111]">
                    {item.currentStock} units
                  </td>
                  <td className="p-4">
                    {item.stockStatus === "OUT_OF_STOCK" ? (
                      <span className="bg-[#A83232] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 inline-flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Out of Stock
                      </span>
                    ) : item.stockStatus === "LOW_STOCK" ? (
                      <span className="bg-[#B86E00] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 inline-flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Low Stock ({item.currentStock})
                      </span>
                    ) : (
                      <span className="bg-[#2E6B44] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => openAdjustModal(item, -1)}
                      className="px-2.5 py-1 bg-[#F7F7F5] border border-[#E5E5E2] hover:border-[#111111] font-mono text-xs font-semibold text-[#111111]"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => openAdjustModal(item, 5)}
                      className="px-3 py-1 bg-[#111111] text-white hover:bg-black font-mono text-xs font-semibold"
                    >
                      +5 Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      {actionVariant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E5E2] p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-3">
              <h3 className="font-semibold uppercase tracking-wider text-[#111111]">
                Adjust Stock — {actionVariant.sku}
              </h3>
              <button onClick={() => setActionVariant(null)} className="text-[#6B6B6B] hover:text-[#111111]">
                ✕
              </button>
            </div>

            <p className="text-[#6B6B6B]">
              Current stock for <strong>"{actionVariant.productName}"</strong>:{" "}
              <strong className="text-[#111111]">{actionVariant.currentStock} units</strong>
            </p>

            <form onSubmit={handleConfirmAdjustment} className="space-y-4">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B]">
                  Quantity Adjustment (positive or negative) *
                </label>
                <input
                  type="number"
                  required
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono font-bold focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B]">Adjustment Reason *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
                >
                  <option value="Restock">Restock</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Manual correction">Manual correction</option>
                  <option value="Returned">Returned</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#E5E5E2]">
                <button
                  type="button"
                  onClick={() => setActionVariant(null)}
                  className="px-4 py-2 border border-[#E5E5E2] font-semibold uppercase text-[#6B6B6B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#111111] text-white font-semibold uppercase hover:bg-black disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm Stock Adjustment</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
