"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Boxes, Plus, Minus, AlertTriangle, RefreshCw, Loader2, CheckCircle2, AlertCircle, Bell, Eye, X } from "lucide-react";
import { API_BASE, adminFetch, safeApiFetch } from "@/lib/api";

export default function AdminInventoryPage() {
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [demandMap, setDemandMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [actionVariant, setActionVariant] = useState<any>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(5);
  const [reason, setReason] = useState<string>("Restock");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Customer Demand Detail Modal State
  const [selectedDemandProduct, setSelectedDemandProduct] = useState<any>(null);
  const [demandModalOpen, setDemandModalOpen] = useState(false);
  const [loadingDemandDetail, setLoadingDemandDetail] = useState(false);

  const fetchInventoryAndDemand = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("fictionfigure_token") || localStorage.getItem("token") : null;

      const [invRes, demandRes] = await Promise.all([
        adminFetch(`${API_BASE}/admin/inventory`),
        token
          ? safeApiFetch<{ success: boolean; products: any[] }>(`${API_BASE}/restock-requests/admin/list?status=PENDING`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          : Promise.resolve({ success: false, products: [] }),
      ]);

      const invData = await invRes.json();
      setInventoryList(invData.inventory || []);

      if (demandRes.success && Array.isArray(demandRes.products)) {
        const dMap: Record<string, any> = {};
        demandRes.products.forEach((p) => {
          dMap[p.productId] = p;
        });
        setDemandMap(dMap);
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to load inventory operations.");
      setInventoryList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryAndDemand();
  }, []);

  const openAdjustModal = (item: any, delta: number) => {
    setActionVariant(item);
    setAdjustmentQty(delta);
    setReason(delta > 0 ? "Restock" : "Manual correction");
  };

  const openDemandModal = async (productId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fictionfigure_token") || localStorage.getItem("token") : null;
    if (!token) return;

    setDemandModalOpen(true);
    setLoadingDemandDetail(true);

    try {
      const data = await safeApiFetch<{ success: boolean; product: any; requests: any[] }>(
        `${API_BASE}/restock-requests/admin/product/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setSelectedDemandProduct(data);
      }
    } catch (err) {
      console.error("Error fetching demand detail:", err);
    } finally {
      setLoadingDemandDetail(false);
    }
  };

  const handleConfirmAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionVariant) return;

    setIsSubmitting(true);
    setMessage("");
    setErrorMsg("");

    try {
      const res = await adminFetch(`${API_BASE}/admin/inventory`, {
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
      fetchInventoryAndDemand();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update inventory.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFulfillDemandInModal = async (productId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fictionfigure_token") || localStorage.getItem("token") : null;
    if (!token) return;

    if (!confirm("Are you sure you want to mark all pending restock requests for this product as FULFILLED?")) {
      return;
    }

    try {
      const data = await safeApiFetch<{ success: boolean; message: string }>(
        `${API_BASE}/restock-requests/admin/fulfill/${productId}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setMessage(data.message);
        setDemandModalOpen(false);
        fetchInventoryAndDemand();
      }
    } catch (err: any) {
      alert(err.message || "Failed to fulfill requests.");
    }
  };

  return (
    <div className="space-y-6 text-[#111111] max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex justify-between items-end border-b border-[#E5E5E2] pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Stock Operations & Restock Intelligence
          </span>
          <h1 className="text-2xl font-semibold text-[#111111] tracking-tight">
            Inventory Auditor ({inventoryList.length} Variants)
          </h1>
        </div>
        <button
          onClick={fetchInventoryAndDemand}
          className="px-4 py-2 bg-white border border-[#E5E5E2] hover:border-[#111111] text-xs font-semibold uppercase tracking-wider flex items-center"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Audit
        </button>
      </div>

      {message && (
        <div className="p-3 bg-[#2E6B44]/10 border border-[#2E6B44] text-[#2E6B44] text-xs font-semibold flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-[#6B6B6B]">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Auditing stock levels & restock demand...
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
                <th className="p-4">Customer Restock Demand</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E2]">
              {inventoryList.map((item) => {
                const demand = demandMap[item.productId];
                const hasDemand = demand && demand.totalRequestedUnits > 0;
                const uniqueCustomers = demand?.uniqueCustomers || 0;
                const totalUnits = demand?.totalRequestedUnits || 0;

                let priority: "HIGH DEMAND" | "MEDIUM DEMAND" | "LOW DEMAND" = "LOW DEMAND";
                if (uniqueCustomers >= 10 || totalUnits >= 20) priority = "HIGH DEMAND";
                else if (uniqueCustomers >= 5 || totalUnits >= 10) priority = "MEDIUM DEMAND";

                return (
                  <tr key={item.variantId} className="hover:bg-[#F7F7F5] transition-colors">
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

                    {/* Customer Demand Column */}
                    <td className="p-4">
                      {hasDemand ? (
                        <div className="space-y-1">
                          <div className="font-mono text-xs font-bold text-[#B86E00] flex items-center">
                            <Bell className="w-3.5 h-3.5 mr-1 text-[#B86E00]" />
                            {uniqueCustomers} customers · {totalUnits} units
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${
                                priority === "HIGH DEMAND"
                                  ? "bg-[#A83232] text-white"
                                  : priority === "MEDIUM DEMAND"
                                  ? "bg-[#B86E00] text-white"
                                  : "bg-[#F7F7F5] border border-[#E5E5E2] text-[#6B6B6B]"
                              }`}
                            >
                              {priority}
                            </span>
                            <button
                              onClick={() => openDemandModal(item.productId)}
                              className="text-[10px] font-bold text-[#111111] hover:underline uppercase"
                            >
                              View Demand
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#6B6B6B]">NO CUSTOMER DEMAND</span>
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
                );
              })}
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

            {demandMap[actionVariant.productId] && (
              <div className="p-3 bg-[#FFF8E1] border border-[#FFE082] text-xs font-semibold text-[#B86E00]">
                {demandMap[actionVariant.productId].uniqueCustomers} customers have requested {demandMap[actionVariant.productId].totalRequestedUnits} units of this product.
              </div>
            )}

            <form onSubmit={handleConfirmAdjustment} className="space-y-4">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B]">
                  Quantity Adjustment (positive or negative) *
                </label>
                <input
                  type="number"
                  required
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] font-mono font-bold focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B]">Reason *</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionVariant(null)}
                  className="px-4 py-2 border border-[#E5E5E2] font-semibold text-[#6B6B6B] hover:text-[#111111]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#111111] text-white font-semibold uppercase tracking-wider hover:bg-black disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Save Stock Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEMAND DETAIL MODAL */}
      {demandModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E2] w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-[#E5E5E2] flex justify-between items-center bg-[#FAF9F6]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B] block">
                  Inventory Restock Intelligence
                </span>
                <h2 className="text-lg font-bold text-[#111111]">
                  {selectedDemandProduct?.product?.name || "Customer Demand Detail"}
                </h2>
              </div>
              <button onClick={() => setDemandModalOpen(false)} className="text-[#6B6B6B] hover:text-[#111111]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {loadingDemandDetail ? (
                <div className="p-8 text-center text-[#6B6B6B]">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Loading customer demand list...
                </div>
              ) : selectedDemandProduct ? (
                <>
                  <div className="grid grid-cols-3 gap-3 p-4 bg-[#FAF9F6] border border-[#E5E5E2]">
                    <div>
                      <span className="text-[10px] text-[#6B6B6B] uppercase font-bold block">Unique Customers</span>
                      <span className="font-mono text-sm font-bold text-[#111111]">
                        {selectedDemandProduct.product.uniqueCustomers}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B6B6B] uppercase font-bold block">Total Requested Units</span>
                      <span className="font-mono text-sm font-bold text-[#B86E00]">
                        {selectedDemandProduct.product.totalRequestedUnits}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B6B6B] uppercase font-bold block">Pending Requests</span>
                      <span className="font-mono text-sm font-bold text-[#111111]">
                        {selectedDemandProduct.product.pendingRequestsCount}
                      </span>
                    </div>
                  </div>

                  <div className="border border-[#E5E5E2] overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF9F6] border-b border-[#E5E5E2] uppercase text-[10px] font-bold text-[#6B6B6B]">
                        <tr>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Phone</th>
                          <th className="px-4 py-3 text-center">Requested Qty</th>
                          <th className="px-4 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E2]">
                        {selectedDemandProduct.requests.map((r: any) => (
                          <tr key={r.id} className="hover:bg-[#FAF9F6]">
                            <td className="px-4 py-3 font-semibold text-[#111111]">{r.userName}</td>
                            <td className="px-4 py-3 font-mono text-[#6B6B6B]">{r.userPhone}</td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-[#111111]">{r.quantity}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="px-2 py-0.5 bg-[#FFF8E1] text-[#B86E00] text-[10px] font-bold uppercase">
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {selectedDemandProduct.product.pendingRequestsCount > 0 && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleFulfillDemandInModal(selectedDemandProduct.product.id)}
                        className="px-4 py-2 bg-[#2E6B44] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#235334]"
                      >
                        Mark Requests Fulfilled
                      </button>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
