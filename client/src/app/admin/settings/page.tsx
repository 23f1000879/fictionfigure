"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    store_name: "FictionFigure",
    store_description: "Premium Japanese anime figures & authentic high-end resin statues.",
    support_phone: "+91 97974 94639",
    support_email: "support@fictionfigure.com",
    hero_announcement: "⚡ COMPLIMENTARY EXPRESS SHIPPING ON ORDERS OVER ₹15,000 | AUTHENTIC IMPORTS DIRECT FROM TOKYO",
    hero_title: "MEMBER SANCTUARY CATALOG",
    hero_subtitle: "Curated 1/4 & 1/6 Scale Museum Statues and Collector Figures.",
    free_shipping_min: "15000",
    tax_rate_percentage: "18",
    currency: "INR",
    min_order_amount: "0",
    low_stock_threshold: "5",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/settings`);
      const data = await res.json();
      if (data.settings && Object.keys(data.settings).length > 0) {
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSection = async (sectionName: string, keys: string[]) => {
    setSavingSection(sectionName);
    setMessage("");
    setError("");

    const sectionPayload: Record<string, string> = {};
    for (const key of keys) {
      sectionPayload[key] = settings[key] || "";
    }

    try {
      const res = await fetch(`${API_BASE}/admin/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: sectionName, settings: sectionPayload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to save settings.");

      setMessage(`${sectionName} saved successfully.`);
    } catch (err: any) {
      setError(err.message || "Unable to save settings.");
    } finally {
      setSavingSection(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl text-[#111111]">
      <div className="flex justify-between items-end border-b border-[#E5E5E2] pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Storefront Configuration
          </span>
          <h1 className="text-2xl font-semibold text-[#111111] tracking-tight">
            Production Store Settings
          </h1>
        </div>
        <button
          onClick={fetchSettings}
          className="px-4 py-2 bg-white border border-[#E5E5E2] hover:border-[#111111] text-xs font-semibold uppercase tracking-wider flex items-center"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Settings
        </button>
      </div>

      {message && (
        <div className="p-3 bg-[#2E6B44]/10 border border-[#2E6B44] text-[#2E6B44] text-xs font-semibold flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-xs text-[#6B6B6B]">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" />
          <span>Loading dynamic store configurations...</span>
        </div>
      ) : (
        <div className="space-y-8 text-xs">
          {/* SECTION 1: STORE INFORMATION */}
          <div className="bg-white border border-[#E5E5E2] p-6 space-y-4">
            <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2">
              1. STORE INFORMATION
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B]">Store Name</label>
                <input
                  type="text"
                  value={settings.store_name || ""}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B]">Support Phone</label>
                <input
                  type="text"
                  value={settings.support_phone || ""}
                  onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">Support Email</label>
              <input
                type="email"
                value={settings.support_email || ""}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() =>
                  handleSaveSection("Store Information", ["store_name", "support_phone", "support_email"])
                }
                disabled={savingSection === "Store Information"}
                className="px-4 py-2.5 bg-[#111111] text-white font-semibold uppercase tracking-wider hover:bg-black disabled:opacity-50 flex items-center"
              >
                {savingSection === "Store Information" ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                <span>SAVE CHANGES</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: HOMEPAGE BANNERS & HEADERS */}
          <div className="bg-white border border-[#E5E5E2] p-6 space-y-4">
            <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2">
              2. HOMEPAGE & HERO BANNER
            </h3>

            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">Top Announcement Text</label>
              <input
                type="text"
                value={settings.hero_announcement || ""}
                onChange={(e) => setSettings({ ...settings, hero_announcement: e.target.value })}
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">Homepage Hero Title</label>
              <input
                type="text"
                value={settings.hero_title || ""}
                onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">Homepage Hero Subtitle</label>
              <input
                type="text"
                value={settings.hero_subtitle || ""}
                onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() =>
                  handleSaveSection("Homepage Settings", ["hero_announcement", "hero_title", "hero_subtitle"])
                }
                disabled={savingSection === "Homepage Settings"}
                className="px-4 py-2.5 bg-[#111111] text-white font-semibold uppercase tracking-wider hover:bg-black disabled:opacity-50 flex items-center"
              >
                {savingSection === "Homepage Settings" ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                <span>SAVE CHANGES</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: COMMERCE & TAX */}
          <div className="bg-white border border-[#E5E5E2] p-6 space-y-4">
            <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2">
              3. COMMERCE & TAXATION
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B]">Free Shipping Threshold (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={settings.free_shipping_min || "15000"}
                  onChange={(e) => setSettings({ ...settings, free_shipping_min: e.target.value })}
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B]">GST Tax Rate (0-100%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.tax_rate_percentage || "18"}
                  onChange={(e) => setSettings({ ...settings, tax_rate_percentage: e.target.value })}
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() =>
                  handleSaveSection("Commerce Settings", ["free_shipping_min", "tax_rate_percentage"])
                }
                disabled={savingSection === "Commerce Settings"}
                className="px-4 py-2.5 bg-[#111111] text-white font-semibold uppercase tracking-wider hover:bg-black disabled:opacity-50 flex items-center"
              >
                {savingSection === "Commerce Settings" ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                <span>SAVE CHANGES</span>
              </button>
            </div>
          </div>

          {/* SECTION 4: INVENTORY THRESHOLDS */}
          <div className="bg-white border border-[#E5E5E2] p-6 space-y-4">
            <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2">
              4. INVENTORY RULES
            </h3>

            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">Low Stock Alert Threshold</label>
              <input
                type="number"
                min={0}
                value={settings.low_stock_threshold || "5"}
                onChange={(e) => setSettings({ ...settings, low_stock_threshold: e.target.value })}
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
              />
              <p className="text-[10px] text-[#6B6B6B]">
                Products with stock quantities equal to or below this threshold will be flagged as LOW STOCK across inventory alerts.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() =>
                  handleSaveSection("Inventory Settings", ["low_stock_threshold"])
                }
                disabled={savingSection === "Inventory Settings"}
                className="px-4 py-2.5 bg-[#111111] text-white font-semibold uppercase tracking-wider hover:bg-black disabled:opacity-50 flex items-center"
              >
                {savingSection === "Inventory Settings" ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                <span>SAVE CHANGES</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
