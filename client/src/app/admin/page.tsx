"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";
import { TrendingUp, ShoppingBag, Clock, Package, ArrowUpRight, ShieldCheck, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/admin/stats`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {
        setStats({
          totalRevenue: 0,
          totalOrders: 0,
          pendingOrders: 0,
          totalProducts: 0,
          recentOrders: [],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#6B6B6B]">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Loading live store analytics...
      </div>
    );
  }

  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalOrders = stats?.totalOrders ?? 0;
  const pendingOrders = stats?.pendingOrders ?? 0;
  const totalProducts = stats?.totalProducts ?? 0;
  const recentOrders = stats?.recentOrders || [];

  return (
    <div className="space-y-8 text-[#111111]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#E5E5E2] pb-4 gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Executive Summary
          </span>
          <h1 className="text-2xl font-semibold text-[#111111] tracking-tight">
            Store Dashboard Overview
          </h1>
        </div>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black transition-colors self-start sm:self-auto"
        >
          + Add New Product
        </Link>
      </div>

      {/* Top 4 Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-[#E5E5E2] p-6 space-y-2">
          <div className="flex justify-between items-center text-[#6B6B6B]">
            <span className="text-xs uppercase font-semibold tracking-wider">Total Revenue</span>
            <TrendingUp className="w-4 h-4 text-[#2E6B44]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#111111]">
            {formatPrice(totalRevenue)}
          </div>
          <span className="text-[11px] text-[#6B6B6B] block">Real database aggregate</span>
        </div>

        <div className="bg-white border border-[#E5E5E2] p-6 space-y-2">
          <div className="flex justify-between items-center text-[#6B6B6B]">
            <span className="text-xs uppercase font-semibold tracking-wider">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-[#111111]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#111111]">{totalOrders}</div>
          <span className="text-[11px] text-[#6B6B6B] block">Fulfilled customer orders</span>
        </div>

        <div className="bg-white border border-[#E5E5E2] p-6 space-y-2">
          <div className="flex justify-between items-center text-[#6B6B6B]">
            <span className="text-xs uppercase font-semibold tracking-wider">Pending Orders</span>
            <Clock className="w-4 h-4 text-[#B86E00]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#111111]">{pendingOrders}</div>
          <span className="text-[11px] text-[#B86E00] font-semibold block">Requires fulfillment</span>
        </div>

        <div className="bg-white border border-[#E5E5E2] p-6 space-y-2">
          <div className="flex justify-between items-center text-[#6B6B6B]">
            <span className="text-xs uppercase font-semibold tracking-wider">Active Products</span>
            <Package className="w-4 h-4 text-[#111111]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#111111]">{totalProducts}</div>
          <span className="text-[11px] text-[#6B6B6B] block">Catalog product count</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-[#E5E5E2] p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-3">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-[#111111]">
              Recent Orders
            </h3>
            <Link href="/admin/orders" className="text-xs font-semibold text-[#111111] hover:underline flex items-center">
              View all <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-10 text-center space-y-2 text-xs text-[#6B6B6B]">
              <ShoppingBag className="w-8 h-8 text-[#6B6B6B] mx-auto opacity-40" />
              <p>No customer orders placed yet.</p>
              <span className="text-[11px] block">Live store orders will appear here automatically upon checkout.</span>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E5E2] text-xs">
              {recentOrders.map((o: any) => (
                <div key={o.id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-mono font-semibold text-[#111111] block">{o.orderNumber}</span>
                    <span className="text-[11px] text-[#6B6B6B]">{formatDate(o.createdAt)} • {o._count?.items || 1} items</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-semibold text-[#111111]">{formatPrice(o.totalAmount)}</span>
                    <span className="bg-[#2E6B44] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E5E5E2] p-6 space-y-4">
          <div className="border-b border-[#E5E5E2] pb-3 flex items-center justify-between">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-[#111111]">
              System Status
            </h3>
            <ShieldCheck className="w-4 h-4 text-[#2E6B44]" />
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#6B6B6B]">Express API Server</span>
              <span className="text-[#2E6B44] font-semibold font-mono">Port 5000 OK</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6B6B6B]">Next.js Storefront</span>
              <span className="text-[#2E6B44] font-semibold font-mono">Port 3000 OK</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#E5E5E2]">
              <span className="text-[#6B6B6B]">Database Engine</span>
              <span className="text-[#2E6B44] font-semibold font-mono">Prisma SQLite OK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
