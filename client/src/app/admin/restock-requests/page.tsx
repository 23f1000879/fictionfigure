"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  Search,
  Filter,
  CheckCircle2,
  Users,
  Box,
  TrendingUp,
  Loader2,
  X,
  Check,
  Phone,
  Mail,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";
import { API_BASE, safeApiFetch } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function AdminRestockRequestsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "ALL" | "FULFILLED">("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("highest_demand");

  // Selected product modal state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productDetailModalOpen, setProductDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [fulfillmentMsg, setFulfillmentMsg] = useState<string | null>(null);

  const fetchSummaryAndDemand = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fictionfigure_token") || localStorage.getItem("token") : null;
    if (!token) return;

    try {
      setLoading(true);
      const [sumRes, listRes] = await Promise.all([
        safeApiFetch<{ success: boolean; summary: any }>(`${API_BASE}/restock-requests/admin/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        safeApiFetch<{ success: boolean; products: any[] }>(
          `${API_BASE}/restock-requests/admin/list?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}&sort=${sortOption}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);

      if (sumRes.success) setSummary(sumRes.summary);
      if (listRes.success && Array.isArray(listRes.products)) setProducts(listRes.products);
    } catch (err) {
      console.error("Failed to load restock demand data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryAndDemand();
  }, [statusFilter, sortOption]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSummaryAndDemand();
  };

  const handleOpenProductDetail = async (productId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fictionfigure_token") || localStorage.getItem("token") : null;
    if (!token) return;

    setProductDetailModalOpen(true);
    setLoadingDetail(true);
    setFulfillmentMsg(null);

    try {
      const data = await safeApiFetch<{ success: boolean; product: any; requests: any[] }>(
        `${API_BASE}/restock-requests/admin/product/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setSelectedProduct(data);
      }
    } catch (err) {
      console.error("Error fetching product restock details:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleFulfillRequests = async (productId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fictionfigure_token") || localStorage.getItem("token") : null;
    if (!token) return;

    if (!confirm("Are you sure you want to mark all PENDING restock requests for this product as FULFILLED?")) {
      return;
    }

    try {
      const data = await safeApiFetch<{ success: boolean; message: string; fulfilledCount: number }>(
        `${API_BASE}/restock-requests/admin/fulfill/${productId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        setFulfillmentMsg(data.message);
        // Refresh product detail and overall list
        handleOpenProductDetail(productId);
        fetchSummaryAndDemand();
      }
    } catch (err: any) {
      alert(err.message || "Failed to fulfill requests.");
    }
  };

  return (
    <div className="p-8 space-[#111111] space-y-8 font-sans max-w-7xl mx-auto">
      {/* Top Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E2] pb-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#6B6B6B] block">
            Inventory & Demand Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
            Restock Demand
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchSummaryAndDemand()}
            className="px-4 py-2 border border-[#E5E5E2] bg-white text-xs font-semibold uppercase tracking-wider hover:border-[#111111] transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* KPI Cards Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Products Requested */}
        <div className="bg-white border border-[#E5E5E2] p-5 space-y-2">
          <div className="flex justify-between items-center text-[#6B6B6B]">
            <span className="text-[10px] font-bold uppercase tracking-widest">Products Requested</span>
            <Box className="w-4 h-4 text-[#111111]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#111111]">
            {summary?.totalProductsRequested ?? 0}
          </div>
          <span className="text-[11px] text-[#6B6B6B] block">Out-of-stock items with active demand</span>
        </div>

        {/* Card 2: Pending Customers */}
        <div className="bg-white border border-[#E5E5E2] p-5 space-y-2">
          <div className="flex justify-between items-center text-[#6B6B6B]">
            <span className="text-[10px] font-bold uppercase tracking-widest">Pending Customers</span>
            <Users className="w-4 h-4 text-[#111111]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#111111]">
            {summary?.totalPendingCustomers ?? 0}
          </div>
          <span className="text-[11px] text-[#6B6B6B] block">Unique customers waiting on restocks</span>
        </div>

        {/* Card 3: Requested Units */}
        <div className="bg-white border border-[#E5E5E2] p-5 space-y-2">
          <div className="flex justify-between items-center text-[#6B6B6B]">
            <span className="text-[10px] font-bold uppercase tracking-widest">Requested Units</span>
            <Bell className="w-4 h-4 text-[#B86E00]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#B86E00]">
            {summary?.totalRequestedUnits ?? 0}
          </div>
          <span className="text-[11px] text-[#6B6B6B] block">Total item quantities requested</span>
        </div>

        {/* Card 4: Top Demand Product */}
        <div className="bg-white border border-[#E5E5E2] p-5 space-y-2">
          <div className="flex justify-between items-center text-[#6B6B6B]">
            <span className="text-[10px] font-bold uppercase tracking-widest">Highest Demand Product</span>
            <TrendingUp className="w-4 h-4 text-[#2E6B44]" />
          </div>
          {summary?.topDemandedProduct ? (
            <div>
              <div className="text-sm font-semibold text-[#111111] truncate">
                {summary.topDemandedProduct.name}
              </div>
              <span className="text-xs font-mono font-bold text-[#2E6B44]">
                {summary.topDemandedProduct.requestedUnits} units requested
              </span>
            </div>
          ) : (
            <span className="text-xs text-[#6B6B6B]">No active restock demand</span>
          )}
        </div>
      </div>

      {/* Filter & Search Bar Controls */}
      <div className="bg-white border border-[#E5E5E2] p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 border-b md:border-b-0 pb-2 md:pb-0 border-[#E5E5E2]">
          {(["PENDING", "ALL", "FULFILLED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusFilter === tab
                  ? "bg-[#111111] text-white"
                  : "text-[#6B6B6B] hover:text-[#111111] hover:bg-[#F7F7F5]"
              }`}
            >
              {tab === "PENDING" ? "Pending Requests" : tab === "ALL" ? "All Demand" : "Fulfilled"}
            </button>
          ))}
        </div>

        {/* Search and Sort controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search product, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#E5E5E2] text-xs focus:outline-none focus:border-[#111111]"
            />
            <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-2.5" />
          </form>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <ArrowUpDown className="w-4 h-4 text-[#6B6B6B]" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-3 py-2 border border-[#E5E5E2] text-xs font-semibold bg-white focus:outline-none focus:border-[#111111]"
            >
              <option value="highest_demand">Sort by Highest Demand</option>
              <option value="most_customers">Sort by Most Customers</option>
              <option value="newest">Sort by Newest Request</option>
              <option value="oldest">Sort by Oldest Request</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Aggregated Product Demand Table */}
      <div className="bg-white border border-[#E5E5E2] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#6B6B6B]">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#111111]" /> Loading Restock Demand List...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Bell className="w-8 h-8 text-[#6B6B6B] mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-[#111111]">NO RESTOCK DEMAND FOUND</h3>
            <p className="text-xs text-[#6B6B6B]">No customers are currently waiting for out-of-stock products.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] border-b border-[#E5E5E2] uppercase text-[10px] font-bold text-[#6B6B6B] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Product Details</th>
                  <th className="px-6 py-4">Stock Status</th>
                  <th className="px-6 py-4 text-center">Unique Customers</th>
                  <th className="px-6 py-4 text-center">Total Requested Units</th>
                  <th className="px-6 py-4 text-center">Pending Requests</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E2]">
                {products.map((item) => (
                  <tr key={item.productId} className="hover:bg-[#FAF9F6] transition-colors">
                    {/* Product Name & SKU */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 relative bg-[#FAF9F6] border border-[#E5E5E2] shrink-0 overflow-hidden">
                          {item.productImage ? (
                            <Image
                              src={item.productImage}
                              alt={item.productName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Box className="w-6 h-6 text-[#6B6B6B] absolute inset-0 m-auto" />
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/admin/products/${item.productId}/edit`}
                            className="font-semibold text-sm text-[#111111] hover:underline block"
                          >
                            {item.productName}
                          </Link>
                          <span className="text-[10px] font-mono text-[#6B6B6B] block">
                            SKU: {item.productSku} | Slug: /{item.productSlug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Stock Status */}
                    <td className="px-6 py-4">
                      {item.currentStock > 0 ? (
                        <span className="px-2.5 py-1 bg-[#E8F5E9] text-[#2E6B44] border border-[#A5D6A7] text-[10px] uppercase font-bold tracking-wider">
                          In Stock ({item.currentStock})
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-[#FFEBEE] text-[#A83232] border border-[#FFCDD2] text-[10px] uppercase font-bold tracking-wider">
                          OUT OF STOCK
                        </span>
                      )}
                    </td>

                    {/* Unique Customers */}
                    <td className="px-6 py-4 text-center font-mono font-bold text-sm text-[#111111]">
                      {item.uniqueCustomers}
                    </td>

                    {/* Total Requested Units */}
                    <td className="px-6 py-4 text-center font-mono font-bold text-base text-[#B86E00]">
                      {item.totalRequestedUnits}
                    </td>

                    {/* Pending Requests */}
                    <td className="px-6 py-4 text-center font-mono text-xs text-[#111111]">
                      {item.pendingRequestsCount} pending
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenProductDetail(item.productId)}
                        className="px-3 py-1.5 bg-[#111111] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-colors"
                      >
                        View Demand
                      </button>

                      {item.pendingRequestsCount > 0 && (
                        <button
                          onClick={() => handleFulfillRequests(item.productId)}
                          className="px-3 py-1.5 bg-[#2E6B44] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#235334] transition-colors"
                        >
                          Fulfill Pending
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Demand Breakdown Modal */}
      {productDetailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E2] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E5E5E2] flex justify-between items-center bg-[#FAF9F6]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B] block">
                  Customer Restock Requests Breakdown
                </span>
                <h2 className="text-lg font-bold text-[#111111]">
                  {selectedProduct?.product?.name || "Product Restock Demand"}
                </h2>
              </div>
              <button
                onClick={() => setProductDetailModalOpen(false)}
                className="p-2 text-[#6B6B6B] hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {loadingDetail ? (
                <div className="p-12 text-center text-[#6B6B6B]">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#111111]" /> Loading Customer Breakdown...
                </div>
              ) : selectedProduct ? (
                <>
                  {fulfillmentMsg && (
                    <div className="p-3 bg-[#E8F5E9] border border-[#2E6B44] text-[#2E6B44] text-xs font-semibold">
                      {fulfillmentMsg}
                    </div>
                  )}

                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#FAF9F6] border border-[#E5E5E2]">
                    <div>
                      <span className="text-[10px] text-[#6B6B6B] uppercase font-bold block">Current Stock</span>
                      <span className="font-mono text-sm font-bold text-[#111111]">
                        {selectedProduct.product.currentStock}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B6B6B] uppercase font-bold block">Unique Customers</span>
                      <span className="font-mono text-sm font-bold text-[#111111]">
                        {selectedProduct.product.uniqueCustomers}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B6B6B] uppercase font-bold block">Total Requested Units</span>
                      <span className="font-mono text-sm font-bold text-[#B86E00]">
                        {selectedProduct.product.totalRequestedUnits}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B6B6B] uppercase font-bold block">Pending Requests</span>
                      <span className="font-mono text-sm font-bold text-[#111111]">
                        {selectedProduct.product.pendingRequestsCount}
                      </span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  {selectedProduct.product.pendingRequestsCount > 0 && (
                    <div className="flex justify-between items-center p-4 bg-[#FFF8E1] border border-[#FFE082]">
                      <div className="text-xs text-[#B86E00] font-semibold">
                        {selectedProduct.product.uniqueCustomers} customers requested {selectedProduct.product.totalRequestedUnits} units of this product.
                      </div>
                      <button
                        onClick={() => handleFulfillRequests(selectedProduct.product.id)}
                        className="px-4 py-2 bg-[#2E6B44] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#235334] transition-colors"
                      >
                        Mark All Pending as Fulfilled
                      </button>
                    </div>
                  )}

                  {/* Customer Requests Table */}
                  <div className="border border-[#E5E5E2] overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF9F6] border-b border-[#E5E5E2] uppercase text-[10px] font-bold text-[#6B6B6B] tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Customer Name</th>
                          <th className="px-4 py-3">Phone / Contact</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3 text-center">Requested Qty</th>
                          <th className="px-4 py-3">Requested At</th>
                          <th className="px-4 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E2]">
                        {selectedProduct.requests.map((r: any) => (
                          <tr key={r.id} className="hover:bg-[#FAF9F6]">
                            <td className="px-4 py-3 font-semibold text-[#111111]">{r.userName}</td>
                            <td className="px-4 py-3 font-mono text-[#6B6B6B]">{r.userPhone}</td>
                            <td className="px-4 py-3 font-mono text-[#6B6B6B]">{r.userEmail}</td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-sm text-[#111111]">
                              {r.quantity}
                            </td>
                            <td className="px-4 py-3 font-mono text-[#6B6B6B]">{formatDate(r.createdAt)}</td>
                            <td className="px-4 py-3 text-right">
                              {r.status === "PENDING" && (
                                <span className="px-2 py-0.5 bg-[#FFF8E1] text-[#B86E00] text-[10px] font-bold uppercase">
                                  PENDING
                                </span>
                              )}
                              {r.status === "FULFILLED" && (
                                <span className="px-2 py-0.5 bg-[#E8F5E9] text-[#2E6B44] text-[10px] font-bold uppercase">
                                  FULFILLED
                                </span>
                              )}
                              {r.status === "CANCELLED" && (
                                <span className="px-2 py-0.5 bg-[#F5F5F5] text-[#757575] text-[10px] font-bold uppercase">
                                  CANCELLED
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E5E5E2] bg-[#FAF9F6] flex justify-end">
              <button
                onClick={() => setProductDetailModalOpen(false)}
                className="px-6 py-2 bg-[#111111] text-white text-xs font-bold uppercase tracking-wider hover:bg-black"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
