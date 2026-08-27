"use client";

import React, { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Loader2, TrendingUp, ShoppingBag, Users, AlertTriangle, Tag, Calendar, Package } from "lucide-react";
import { API_BASE, adminFetch, safeApiFetch } from "@/lib/api";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("all");

  const [restockAnalytics, setRestockAnalytics] = useState<any>(null);

  const fetchAnalytics = (selectedPeriod: string) => {
    setLoading(true);
    adminFetch(`${API_BASE}/admin/analytics?period=${selectedPeriod}`)
      .then((res) => res.json())
      .then((resData) => setData(resData))
      .catch(() => setData(null))
      .finally(() => setLoading(false));

    const token = typeof window !== "undefined" ? localStorage.getItem("fictionfigure_token") || localStorage.getItem("token") : null;
    if (token) {
      safeApiFetch<{ success: boolean; analytics: any }>(`${API_BASE}/restock-requests/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.success) setRestockAnalytics(res.analytics);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  return (
    <div className="space-y-8 text-[#111111] p-1 sm:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[#E5E5E2] pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Sales & Operational Analytics
          </span>
          <h1 className="text-2xl font-semibold text-[#111111] tracking-tight">
            Store Performance
          </h1>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center space-x-2 bg-white border border-[#E5E5E2] px-3 py-1.5 text-xs">
          <Calendar className="w-4 h-4 text-[#6B6B6B]" />
          <span className="text-[#6B6B6B] uppercase font-semibold">Period:</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-transparent font-semibold text-[#111111] focus:outline-none cursor-pointer"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="this_year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#6B6B6B]">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Calculating database analytics...
        </div>
      ) : !data ? (
        <div className="p-8 text-center bg-white border border-[#E5E5E2] text-xs text-[#6B6B6B]">
          Failed to load analytics data.
        </div>
      ) : (
        <>
          {/* Executive Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white border border-[#E5E5E2] p-5 space-y-1">
              <span className="text-[11px] uppercase font-semibold text-[#6B6B6B] block">Total Revenue</span>
              <span className="text-2xl font-bold font-mono text-[#111111]">{formatPrice(data.totalRevenue || 0)}</span>
              <span className="text-[10px] text-[#6B6B6B] block">From valid completed orders</span>
            </div>

            <div className="bg-white border border-[#E5E5E2] p-5 space-y-1">
              <span className="text-[11px] uppercase font-semibold text-[#6B6B6B] block">Total Orders</span>
              <span className="text-2xl font-bold font-mono text-[#111111]">{data.totalOrders || 0}</span>
              <span className="text-[10px] text-[#6B6B6B] block">{data.pendingOrders || 0} pending fulfillment</span>
            </div>

            <div className="bg-white border border-[#E5E5E2] p-5 space-y-1">
              <span className="text-[11px] uppercase font-semibold text-[#6B6B6B] block">Average Order Value (AOV)</span>
              <span className="text-2xl font-bold font-mono text-[#111111]">{formatPrice(data.averageOrderValue || 0)}</span>
              <span className="text-[10px] text-[#6B6B6B] block">Per order gross average</span>
            </div>

            <div className="bg-white border border-[#E5E5E2] p-5 space-y-1">
              <span className="text-[11px] uppercase font-semibold text-[#6B6B6B] block">Products Sold</span>
              <span className="text-2xl font-bold font-mono text-[#111111]">{data.productsSold || 0} units</span>
              <span className="text-[10px] text-[#6B6B6B] block">Total item quantities</span>
            </div>
          </div>

          {/* Secondary Operational Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white border border-[#E5E5E2] p-5 space-y-1">
              <span className="text-[11px] uppercase font-semibold text-[#6B6B6B] flex items-center">
                <Users className="w-3.5 h-3.5 mr-1" /> Customer Directory
              </span>
              <div className="text-lg font-bold font-mono text-[#111111]">
                {data.totalCustomers || 0} total ({data.newCustomers || 0} new)
              </div>
              <span className="text-[10px] text-[#6B6B6B] block">
                Repeat customer rate: {data.repeatPurchaseRate || 0}%
              </span>
            </div>

            <div className="bg-white border border-[#E5E5E2] p-5 space-y-1">
              <span className="text-[11px] uppercase font-semibold text-[#6B6B6B] flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-[#A83232]" /> Stock Health & Demand Alerts
              </span>
              <div className="text-sm font-bold font-mono text-[#111111]">
                {data.outOfStockProducts || 0} out of stock
              </div>
              <span className="text-[10px] text-[#B86E00] font-semibold block">
                {restockAnalytics?.stockHealth?.outOfStockWithDemand ?? 0} have demand ({restockAnalytics?.stockHealth?.totalUnitsRequested ?? 0} units requested)
              </span>
            </div>

            <div className="bg-white border border-[#E5E5E2] p-5 space-y-1">
              <span className="text-[11px] uppercase font-semibold text-[#6B6B6B] flex items-center">
                <Tag className="w-3.5 h-3.5 mr-1 text-[#2E6B44]" /> Coupon Redemptions
              </span>
              <div className="text-lg font-bold font-mono text-[#111111]">
                {data.couponUsage || 0} redemptions
              </div>
              <span className="text-[10px] text-[#6B6B6B] block">Total promo discount uses</span>
            </div>
          </div>

          {/* Revenue Timeline Chart / Breakdown */}
          <div className="bg-white border border-[#E5E5E2] p-6 space-y-4 text-xs">
            <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" /> Revenue Timeline
            </h3>

            {data.revenueTimeline?.length === 0 ? (
              <div className="p-8 text-center text-[#6B6B6B]">No sales data yet for selected period.</div>
            ) : (
              <div className="space-y-3">
                {data.revenueTimeline.map((item: any) => (
                  <div key={item.date} className="flex justify-between items-center border-b border-[#F7F7F5] pb-2 font-mono">
                    <span className="text-[#6B6B6B]">{item.date}</span>
                    <div className="flex space-x-4">
                      <span className="text-[#6B6B6B]">{item.orders} order(s)</span>
                      <span className="font-bold text-[#111111]">{formatPrice(item.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Selling Products & Category Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Top Products */}
            <div className="bg-white border border-[#E5E5E2] p-6 space-y-4">
              <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2">
                Top Selling Collectibles
              </h3>
              {data.topSellingProducts?.length === 0 ? (
                <p className="text-[#6B6B6B]">No product sales yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.topSellingProducts.map((p: any, idx: number) => (
                    <div key={p.id} className="flex justify-between items-center border-b border-[#F7F7F5] pb-2">
                      <div>
                        <span className="font-bold text-[#111111] block">
                          #{idx + 1} {p.name}
                        </span>
                        <span className="text-[11px] text-[#6B6B6B]">{p.units} units sold</span>
                      </div>
                      <span className="font-mono font-bold text-[#111111]">{formatPrice(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Performance */}
            <div className="bg-white border border-[#E5E5E2] p-6 space-y-4">
              <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2">
                Category Performance
              </h3>
              {data.categoryPerformance?.length === 0 ? (
                <p className="text-[#6B6B6B]">No category sales yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.categoryPerformance.map((c: any) => (
                    <div key={c.name} className="flex justify-between items-center border-b border-[#F7F7F5] pb-2">
                      <div>
                        <span className="font-semibold text-[#111111] block">{c.name}</span>
                        <span className="text-[11px] text-[#6B6B6B]">{c.units} units sold</span>
                      </div>
                      <span className="font-mono font-bold text-[#111111]">{formatPrice(c.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Customer Restock Demand Section */}
          <div className="bg-white border border-[#E5E5E2] p-6 space-y-6 text-xs">
            <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B] block">
                  Inventory Intelligence
                </span>
                <h3 className="font-bold uppercase tracking-wider text-[#111111] text-sm">
                  Customer Restock Demand
                </h3>
              </div>
              <a
                href="/admin/restock-requests"
                className="text-xs font-bold text-[#111111] hover:underline uppercase"
              >
                View Full Restock Console &rarr;
              </a>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#FAF9F6] border border-[#E5E5E2] p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6B6B6B]">Products Requested</span>
                <div className="text-xl font-bold font-mono text-[#111111]">
                  {restockAnalytics?.productsRequested ?? 0}
                </div>
              </div>

              <div className="bg-[#FAF9F6] border border-[#E5E5E2] p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6B6B6B]">Customers Waiting</span>
                <div className="text-xl font-bold font-mono text-[#111111]">
                  {restockAnalytics?.customersWaiting ?? 0}
                </div>
              </div>

              <div className="bg-[#FAF9F6] border border-[#E5E5E2] p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6B6B6B]">Units Requested</span>
                <div className="text-xl font-bold font-mono text-[#B86E00]">
                  {restockAnalytics?.unitsRequested ?? 0}
                </div>
              </div>
            </div>

            {/* Top Restock Demand Table */}
            <div className="space-y-3">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-[#111111]">
                Top Restock Demand Collectibles
              </h4>
              {!restockAnalytics?.topDemandProducts || restockAnalytics.topDemandProducts.length === 0 ? (
                <div className="p-6 bg-[#FAF9F6] text-center text-[#6B6B6B]">
                  No active customer restock demand records found.
                </div>
              ) : (
                <>
                <div className="hidden md:block border border-[#E5E5E2] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF9F6] border-b border-[#E5E5E2] uppercase text-[10px] font-bold text-[#6B6B6B]">
                      <tr>
                        <th className="px-4 py-3">Rank & Product</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3 text-center">Customers</th>
                        <th className="px-4 py-3 text-center">Units Requested</th>
                        <th className="px-4 py-3 text-right">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E2]">
                      {restockAnalytics.topDemandProducts.map((p: any, idx: number) => (
                        <tr key={p.id} className="hover:bg-[#FAF9F6]">
                          <td className="px-4 py-3 font-semibold text-[#111111]">
                            #{idx + 1} {p.name}
                          </td>
                          <td className="px-4 py-3 font-mono text-[#6B6B6B]">{p.sku}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-[#111111]">
                            {p.uniqueCustomers}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-[#B86E00]">
                            {p.totalRequestedUnits}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                                p.priority === "HIGH"
                                  ? "bg-[#A83232] text-white"
                                  : p.priority === "MEDIUM"
                                  ? "bg-[#B86E00] text-white"
                                  : "bg-[#F7F7F5] border border-[#E5E5E2] text-[#6B6B6B]"
                              }`}
                            >
                              {p.priority} DEMAND
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {restockAnalytics.topDemandProducts.map((p: any, idx: number) => (
                    <div key={p.id} className="bg-white border border-[#E5E5E2] p-4 space-y-3 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-xs text-[#111111] block">
                            #{idx + 1} {p.name}
                          </span>
                          <span className="text-[10px] text-[#6B6B6B] block">SKU: <span className="font-mono">{p.sku}</span></span>
                        </div>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                            p.priority === "HIGH"
                              ? "bg-[#A83232] text-white"
                              : p.priority === "MEDIUM"
                              ? "bg-[#B86E00] text-white"
                              : "bg-[#F7F7F5] border border-[#E5E5E2] text-[#6B6B6B]"
                          }`}
                        >
                          {p.priority} DEMAND
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 py-2 border-y border-[#F7F7F5] text-[11px]">
                        <div>
                          <span className="text-[#6B6B6B] block text-[9px] uppercase font-semibold">Customers</span>
                          <span className="font-mono font-bold text-[#111111]">{p.uniqueCustomers}</span>
                        </div>
                        <div>
                          <span className="text-[#6B6B6B] block text-[9px] uppercase font-semibold">Units Requested</span>
                          <span className="font-mono font-bold text-[#B86E00]">{p.totalRequestedUnits}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
