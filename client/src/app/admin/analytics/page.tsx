"use client";

import React, { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Loader2, TrendingUp, ShoppingBag, Users, AlertTriangle, Tag, Calendar, Package } from "lucide-react";
import { API_BASE, adminFetch } from "@/lib/api";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("all");

  const fetchAnalytics = (selectedPeriod: string) => {
    setLoading(true);
    adminFetch(`${API_BASE}/admin/analytics?period=${selectedPeriod}`)
      .then((res) => res.json())
      .then((resData) => setData(resData))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  return (
    <div className="space-y-8 text-[#111111]">
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
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-[#A83232]" /> Stock Health Alerts
              </span>
              <div className="text-lg font-bold font-mono text-[#111111]">
                {data.lowStockProducts || 0} low stock / {data.outOfStockProducts || 0} out
              </div>
              <span className="text-[10px] text-[#6B6B6B] block">Stock levels monitored live</span>
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
        </>
      )}
    </div>
  );
}
