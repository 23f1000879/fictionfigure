"use client";

import React, { useEffect, useState } from "react";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { Loader2 } from "lucide-react";
import { API_BASE, adminFetch } from "@/lib/api";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    setErrorMsg("");
    adminFetch(`${API_BASE}/admin/stats`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err: any) => {
        setErrorMsg(err.message || "Failed to load admin stats.");
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
      <div className="admin-loading-state">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Loading live store analytics...
      </div>
    );
  }

  return <AdminOverview stats={stats} errorMsg={errorMsg} />;
}
