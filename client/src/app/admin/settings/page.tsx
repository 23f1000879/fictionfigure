"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Save, Loader2, RefreshCw, CheckCircle2, AlertCircle, Upload, Eye } from "lucide-react";
import { API_BASE } from "@/lib/api";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  price: number;
  images: { url: string }[];
}

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

    // Homepage Hero Defaults
    homepage_hero_enabled: "true",
    homepage_hero_image_url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80",
    homepage_hero_eyebrow: "CURATED COLLECTOR GALLERY",
    homepage_hero_title: "Figures worth collecting.",
    homepage_hero_title_accent: "Stories worth keeping.",
    homepage_hero_description: "Curated figures, statues, and collectible pieces for people who never stopped loving the characters that shaped them.",
    homepage_hero_primary_label: "SHOP COLLECTION",
    homepage_hero_primary_url: "/shop",
    homepage_hero_secondary_label: "EXPLORE NEW ARRIVALS",
    homepage_hero_secondary_url: "/shop?sortBy=newest",
    homepage_hero_featured_product_id: "",
  });

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
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
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (e) {
      console.error("Error fetching settings:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${API_BASE}/admin/uploads/product-image`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload image.");

      if (data.url) {
        setSettings((prev) => ({ ...prev, homepage_hero_image_url: data.url }));
        setMessage("Hero image uploaded to Cloudinary successfully.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

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

      setMessage(
        sectionName === "Homepage Hero"
          ? "Homepage hero updated successfully."
          : `${sectionName} saved successfully.`
      );
    } catch (err: any) {
      setError(err.message || "Unable to save settings.");
    } finally {
      setSavingSection(null);
    }
  };

  const selectedFeaturedProduct = products.find(
    (p) => p.id === settings.homepage_hero_featured_product_id
  );

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
          <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
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
          {/* SECTION 1: HOMEPAGE HERO CMS */}
          <div className="bg-white border border-[#E5E5E2] p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-3">
              <div>
                <h3 className="font-semibold uppercase tracking-wider text-[#111111] text-sm">
                  1. HOMEPAGE HERO CMS
                </h3>
                <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                  Manage the main hero banner, text content, action buttons, and featured masterpiece overlay.
                </p>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer bg-[#F7F7F5] px-3 py-1.5 border border-[#E5E5E2]">
                <input
                  type="checkbox"
                  checked={settings.homepage_hero_enabled !== "false"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homepage_hero_enabled: e.target.checked ? "true" : "false",
                    })
                  }
                  className="rounded text-[#111111] focus:ring-0"
                />
                <span className="font-semibold uppercase text-[11px] text-[#111111]">
                  Enable Hero
                </span>
              </label>
            </div>

            {/* Hero Image & Upload */}
            <div className="space-y-3">
              <label className="font-semibold uppercase text-[#6B6B6B] block">Hero Image</label>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative w-full sm:w-48 h-32 bg-[#F7F7F5] border border-[#E5E5E2] overflow-hidden shrink-0">
                  {settings.homepage_hero_image_url ? (
                    <Image
                      src={settings.homepage_hero_image_url}
                      alt="Hero Preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-[#6B6B6B]">
                      No Image Selected
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1 w-full">
                  <input
                    type="url"
                    value={settings.homepage_hero_image_url || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, homepage_hero_image_url: e.target.value })
                    }
                    placeholder="https://res.cloudinary.com/..."
                    className="w-full p-2.5 bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-[11px] focus:border-[#111111] focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-2 bg-white border border-[#E5E5E2] hover:border-[#111111] text-[#111111] font-semibold uppercase text-[10px] tracking-wider cursor-pointer inline-flex items-center">
                      {uploadingImage ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      <span>Upload Image to Cloudinary</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-[#6B6B6B]">
                      HTTPS Cloudinary images recommended
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1 sm:col-span-1">
                <label className="font-semibold uppercase text-[#6B6B6B]">Eyebrow Text</label>
                <input
                  type="text"
                  value={settings.homepage_hero_eyebrow || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, homepage_hero_eyebrow: e.target.value })
                  }
                  placeholder="CURATED COLLECTOR GALLERY"
                  className="w-full p-2.5 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-1">
                <label className="font-semibold uppercase text-[#6B6B6B]">Main Heading</label>
                <input
                  type="text"
                  value={settings.homepage_hero_title || ""}
                  onChange={(e) => setSettings({ ...settings, homepage_hero_title: e.target.value })}
                  placeholder="Figures worth collecting."
                  className="w-full p-2.5 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-1">
                <label className="font-semibold uppercase text-[#6B6B6B]">Accent Heading</label>
                <input
                  type="text"
                  value={settings.homepage_hero_title_accent || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, homepage_hero_title_accent: e.target.value })
                  }
                  placeholder="Stories worth keeping."
                  className="w-full p-2.5 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">Description Paragraph</label>
              <textarea
                rows={3}
                value={settings.homepage_hero_description || ""}
                onChange={(e) =>
                  setSettings({ ...settings, homepage_hero_description: e.target.value })
                }
                placeholder="Curated figures, statues, and collectible pieces..."
                className="w-full p-2.5 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none leading-relaxed"
              />
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-[#F7F7F5] border border-[#E5E5E2] space-y-2">
                <span className="font-semibold uppercase text-[#111111] text-[11px] block">
                  Primary Action Button
                </span>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[#6B6B6B]">Button Label</label>
                  <input
                    type="text"
                    value={settings.homepage_hero_primary_label || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, homepage_hero_primary_label: e.target.value })
                    }
                    placeholder="SHOP COLLECTION"
                    className="w-full p-2 bg-white border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[#6B6B6B]">Button URL Target</label>
                  <input
                    type="text"
                    value={settings.homepage_hero_primary_url || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, homepage_hero_primary_url: e.target.value })
                    }
                    placeholder="/shop"
                    className="w-full p-2 bg-white border border-[#E5E5E2] font-mono text-[11px] focus:border-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#F7F7F5] border border-[#E5E5E2] space-y-2">
                <span className="font-semibold uppercase text-[#111111] text-[11px] block">
                  Secondary Action Button
                </span>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[#6B6B6B]">Button Label</label>
                  <input
                    type="text"
                    value={settings.homepage_hero_secondary_label || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, homepage_hero_secondary_label: e.target.value })
                    }
                    placeholder="EXPLORE NEW ARRIVALS"
                    className="w-full p-2 bg-white border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[#6B6B6B]">Button URL Target</label>
                  <input
                    type="text"
                    value={settings.homepage_hero_secondary_url || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, homepage_hero_secondary_url: e.target.value })
                    }
                    placeholder="/shop?sortBy=newest"
                    className="w-full p-2 bg-white border border-[#E5E5E2] font-mono text-[11px] focus:border-[#111111] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Featured Masterpiece Product Selector */}
            <div className="space-y-2 pt-2 border-t border-[#E5E5E2]">
              <label className="font-semibold uppercase text-[#6B6B6B] block">
                Featured Product Overlay
              </label>
              <select
                value={settings.homepage_hero_featured_product_id || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    homepage_hero_featured_product_id: e.target.value,
                  })
                }
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none font-medium"
              >
                <option value="">-- No Featured Product Overlay --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (SKU: {p.sku} | ₹{p.price.toLocaleString("en-IN")})
                  </option>
                ))}
              </select>

              {/* Selected Featured Product Preview */}
              {selectedFeaturedProduct && (
                <div className="p-3 bg-[#F7F7F5] border border-[#E5E5E2] flex items-center space-x-3 mt-2">
                  <div className="relative w-12 h-12 bg-white border border-[#E5E5E2] overflow-hidden shrink-0">
                    {selectedFeaturedProduct.images[0]?.url ? (
                      <Image
                        src={selectedFeaturedProduct.images[0].url}
                        alt={selectedFeaturedProduct.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Eye className="w-5 h-5 text-[#6B6B6B] m-auto" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">
                      Featured Masterpiece Overlay
                    </span>
                    <h5 className="font-semibold text-[#111111] truncate text-xs">
                      {selectedFeaturedProduct.name}
                    </h5>
                    <span className="text-[10px] font-mono text-[#6B6B6B]">
                      SKU: {selectedFeaturedProduct.sku} • ₹
                      {selectedFeaturedProduct.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() =>
                  handleSaveSection("Homepage Hero", [
                    "homepage_hero_enabled",
                    "homepage_hero_image_url",
                    "homepage_hero_eyebrow",
                    "homepage_hero_title",
                    "homepage_hero_title_accent",
                    "homepage_hero_description",
                    "homepage_hero_primary_label",
                    "homepage_hero_primary_url",
                    "homepage_hero_secondary_label",
                    "homepage_hero_secondary_url",
                    "homepage_hero_featured_product_id",
                  ])
                }
                disabled={savingSection === "Homepage Hero"}
                className="px-6 py-3 bg-[#111111] text-white font-semibold uppercase tracking-wider hover:bg-black disabled:opacity-50 flex items-center text-xs"
              >
                {savingSection === "Homepage Hero" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                <span>SAVE HOMEPAGE HERO</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: STORE INFORMATION */}
          <div className="bg-white border border-[#E5E5E2] p-6 space-y-4">
            <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2">
              2. STORE INFORMATION
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

          {/* SECTION 3: TOP ANNOUNCEMENTS */}
          <div className="bg-white border border-[#E5E5E2] p-6 space-y-4">
            <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2">
              3. TOP ANNOUNCEMENT BANNER
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

            <div className="flex justify-end pt-2">
              <button
                onClick={() =>
                  handleSaveSection("Top Announcement", ["hero_announcement"])
                }
                disabled={savingSection === "Top Announcement"}
                className="px-4 py-2.5 bg-[#111111] text-white font-semibold uppercase tracking-wider hover:bg-black disabled:opacity-50 flex items-center"
              >
                {savingSection === "Top Announcement" ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                <span>SAVE CHANGES</span>
              </button>
            </div>
          </div>

          {/* SECTION 4: COMMERCE & TAX */}
          <div className="bg-white border border-[#E5E5E2] p-6 space-y-4">
            <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2">
              4. COMMERCE & TAXATION
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
        </div>
      )}
    </div>
  );
}
