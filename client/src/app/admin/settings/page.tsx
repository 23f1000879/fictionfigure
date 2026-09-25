"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Save,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Upload,
  Eye,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Truck,
  Megaphone,
  Store,
  Info,
  QrCode,
  CreditCard,
} from "lucide-react";
import { API_BASE, adminFetch } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  price: number;
  images: { url: string }[];
}

interface AnnouncementItem {
  id: string;
  text: string;
  enabled: boolean;
  sortOrder: number;
}

export interface CarouselSlideItem {
  id: string;
  /** Foreground artwork (contained; also the selector-card thumbnail). */
  image: string;
  /** Full-bleed cinematic hero background. */
  backgroundImage?: string;
  /** CSS object-position focal point for the background, e.g. "70% center". */
  backgroundPosition?: string;
  /** Short selector-card label, e.g. "ONE PIECE". */
  cardLabel?: string;
  /** Selector-card caption, e.g. "Collection". */
  cardCaption?: string;
  secondaryLabel?: string;
  secondaryUrl?: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
  primaryLabel: string;
  primaryUrl: string;
  enabled: boolean;
  sortOrder: number;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    shipping_fee: "100",
    free_shipping_threshold: "500",
    store_name: "FictionFigure",
    store_location: "Bikaner, Rajasthan, India",
    delivery_coverage: "We deliver across India.",
    support_phone: "+91 97974 94639",
    support_email: "support@fictionfigure.com",
    hero_announcement: "WELCOME TO FICTIONFIGURE — COLLECT WHAT YOU LOVE.",
    hero_title: "Figures worth collecting.",
    hero_subtitle: "Curated figures, statues, and collectible pieces for people who never stopped loving the characters that shaped them.",

    // UPI Payment Defaults
    upi_id: "fictionfigure@upi",
    upi_qr_url: "",

    // Homepage Hero Defaults
    homepage_hero_enabled: "true",
    homepage_hero_image_url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80",
    homepage_hero_eyebrow: "CURATED COLLECTOR GALLERY",
    homepage_hero_title: "Figures worth collecting.",
    homepage_hero_title_accent: "Stories worth keeping.",
    homepage_hero_description: "Curated figures, statues, and collectible pieces...",
    homepage_hero_primary_label: "SHOP COLLECTION",
    homepage_hero_primary_url: "/shop",
    homepage_hero_secondary_label: "EXPLORE NEW ARRIVALS",
    homepage_hero_secondary_url: "/shop?sortBy=newest",
    homepage_hero_featured_product_id: "",
  });

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([
    { id: "1", text: "WELCOME TO FICTIONFIGURE — COLLECT WHAT YOU LOVE.", enabled: true, sortOrder: 1 },
    { id: "2", text: "FREE SHIPPING ON ORDERS OF ₹{{FREE_SHIPPING_THRESHOLD}} OR MORE.", enabled: true, sortOrder: 2 },
    { id: "3", text: "SUPPORT: +91 97974 94639", enabled: true, sortOrder: 3 },
  ]);

  const [carouselSlides, setCarouselSlides] = useState<CarouselSlideItem[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingSlideImageId, setUploadingSlideImageId] = useState<string | null>(null);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchSettings = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await adminFetch(`${API_BASE}/admin/settings`);
      const data = await res.json();
      if (data.settings && Object.keys(data.settings).length > 0) {
        setSettings((prev) => ({ ...prev, ...data.settings }));

        if (data.settings.announcements_json) {
          try {
            const parsed = JSON.parse(data.settings.announcements_json);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setAnnouncements(parsed);
            }
          } catch (e) {}
        }

        if (data.settings.homepage_carousel_slides_json) {
          try {
            const parsedSlides = JSON.parse(data.settings.homepage_carousel_slides_json);
            if (Array.isArray(parsedSlides) && parsedSlides.length > 0) {
              setCarouselSlides(parsedSlides);
            }
          } catch (e) {}
        }
      }
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (e: any) {
      setError(e.message || "Error fetching store settings.");
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
      const res = await adminFetch(`${API_BASE}/admin/uploads/product-image`, {
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

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await adminFetch(`${API_BASE}/admin/uploads/product-image`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload QR image.");

      if (data.url) {
        setSettings((prev) => ({ ...prev, upi_qr_url: data.url }));
        setMessage("UPI QR Code uploaded to Cloudinary successfully.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload QR image.");
    } finally {
      setUploadingQr(false);
    }
  };

  const handleSaveSection = async (sectionName: string, keys: string[], customPayload?: Record<string, string>) => {
    setSavingSection(sectionName);
    setMessage("");
    setError("");

    const sectionPayload: Record<string, string> = customPayload || {};
    if (!customPayload) {
      for (const key of keys) {
        sectionPayload[key] = settings[key] || "";
      }
    }

    try {
      const res = await adminFetch(`${API_BASE}/admin/settings`, {
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

  // Announcement Handlers
  const handleAddAnnouncement = () => {
    const newId = String(Date.now());
    const nextOrder = announcements.length + 1;
    setAnnouncements([
      ...announcements,
      { id: newId, text: "NEW ANNOUNCEMENT MESSAGE", enabled: true, sortOrder: nextOrder },
    ]);
  };

  const handleUpdateAnnouncementText = (id: string, text: string) => {
    setAnnouncements(
      announcements.map((a) => (a.id === id ? { ...a, text } : a))
    );
  };

  const handleToggleAnnouncement = (id: string, enabled: boolean) => {
    setAnnouncements(
      announcements.map((a) => (a.id === id ? { ...a, enabled } : a))
    );
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(announcements.filter((a) => a.id !== id));
  };

  const handleMoveAnnouncement = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= announcements.length) return;

    const list = [...announcements];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    // re-assign sortOrder
    const reordered = list.map((item, idx) => ({ ...item, sortOrder: idx + 1 }));
    setAnnouncements(reordered);
  };

  const handleSaveAnnouncements = () => {
    const jsonStr = JSON.stringify(announcements);
    setSettings((prev) => ({ ...prev, announcements_json: jsonStr }));
    handleSaveSection("Announcement Bar", ["announcements_json"], { announcements_json: jsonStr });
  };

  // Carousel Slide Handlers
  const handleAddSlide = () => {
    const newSlide: CarouselSlideItem = {
      id: String(Date.now()),
      image: "",
      backgroundImage: "",
      backgroundPosition: "70% center",
      cardLabel: "",
      cardCaption: "Collection",
      eyebrow: "FEATURED COLLECTION",
      title: "New Promotional Slide",
      titleAccent: "",
      description: "Enter a brief description for this featured collection...",
      primaryLabel: "SHOP COLLECTION",
      primaryUrl: "/shop",
      enabled: true,
      sortOrder: carouselSlides.length + 1,
    };
    setCarouselSlides([...carouselSlides, newSlide]);
  };

  const handleUpdateSlide = (id: string, field: keyof CarouselSlideItem, value: any) => {
    setCarouselSlides(
      carouselSlides.map((slide) => (slide.id === id ? { ...slide, [field]: value } : slide))
    );
  };

  const handleSlideImageUpload = async (
    slideId: string,
    e: React.ChangeEvent<HTMLInputElement>,
    field: "image" | "backgroundImage" = "image"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSlideImageId(`${slideId}:${field}`);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await adminFetch(`${API_BASE}/admin/uploads/product-image`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload slide image.");

      if (data.url) {
        handleUpdateSlide(slideId, field, data.url);
        setMessage(
          field === "backgroundImage"
            ? "Hero background uploaded to Cloudinary. Save the carousel to publish it."
            : "Slide image uploaded to Cloudinary successfully."
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload slide image.");
    } finally {
      setUploadingSlideImageId(null);
    }
  };

  const handleDeleteSlide = (id: string) => {
    setCarouselSlides(carouselSlides.filter((s) => s.id !== id));
  };

  const handleMoveSlide = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= carouselSlides.length) return;

    const list = [...carouselSlides];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const reordered = list.map((item, idx) => ({ ...item, sortOrder: idx + 1 }));
    setCarouselSlides(reordered);
  };

  const handleSaveCarousel = () => {
    const jsonStr = JSON.stringify(carouselSlides);
    setSettings((prev) => ({ ...prev, homepage_carousel_slides_json: jsonStr }));
    handleSaveSection(
      "Homepage Hero Carousel",
      ["homepage_hero_enabled", "homepage_carousel_slides_json"],
      {
        homepage_hero_enabled: settings.homepage_hero_enabled || "true",
        homepage_carousel_slides_json: jsonStr,
      }
    );
  };

  // Shipping Live Preview Math
  const numFee = Math.max(0, parseFloat(settings.shipping_fee || "100") || 0);
  const numThreshold = Math.max(0, parseFloat(settings.free_shipping_threshold || "500") || 0);

  const previewBelowSubtotal = Math.max(1, numThreshold - 100);
  const previewBelowShipping = previewBelowSubtotal >= numThreshold ? 0 : numFee;
  const previewBelowTotal = previewBelowSubtotal + previewBelowShipping;

  const previewAboveSubtotal = numThreshold;
  const previewAboveShipping = 0;
  const previewAboveTotal = previewAboveSubtotal;

  const selectedFeaturedProduct = products.find(
    (p) => p.id === settings.homepage_hero_featured_product_id
  );

  return (
    <div className="space-y-6 max-w-4xl text-[#111111] font-sans pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#E5E5E2] pb-4 gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Storefront Configuration
          </span>
          <h1 className="text-2xl font-semibold text-[#111111] tracking-tight">
            Store Settings Management
          </h1>
        </div>
        <button
          onClick={fetchSettings}
          className="px-4 py-2 bg-white border border-[#E5E5E2] hover:border-[#111111] text-xs font-semibold uppercase tracking-wider flex items-center shrink-0"
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
          {/* SECTION 1: SHIPPING & DELIVERY SETTINGS */}
          <div className="bg-white border border-[#E5E5E2] p-5 sm:p-6 space-y-5">
            <div className="flex items-center space-x-2 border-b border-[#E5E5E2] pb-3">
              <Truck className="w-4 h-4 text-[#111111]" />
              <h3 className="font-semibold uppercase tracking-wider text-[#111111] text-sm">
                1. SHIPPING & DELIVERY SETTINGS
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                  Shipping Fee (₹) *
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={settings.shipping_fee || "100"}
                  onChange={(e) =>
                    setSettings({ ...settings, shipping_fee: e.target.value })
                  }
                  placeholder="100"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-xs focus:border-[#111111] focus:outline-none"
                />
                <p className="text-[10px] text-[#6B6B6B]">
                  Standard delivery charge applied to orders below free-shipping threshold.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                  Free Shipping Threshold (₹) *
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={settings.free_shipping_threshold || "500"}
                  onChange={(e) =>
                    setSettings({ ...settings, free_shipping_threshold: e.target.value })
                  }
                  placeholder="500"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-xs focus:border-[#111111] focus:outline-none"
                />
                <p className="text-[10px] text-[#6B6B6B]">
                  Orders equal to or above this amount receive FREE shipping.
                </p>
              </div>
            </div>

            {/* COD Fee Notice */}
            <div className="p-3 bg-[#F7F7F5] border border-[#E5E5E2] flex items-center space-x-2 text-[11px]">
              <Info className="w-4 h-4 text-[#111111] shrink-0" />
              <div>
                <span className="font-bold text-[#111111] uppercase tracking-wider">COD Handling Fee: REMOVED</span>
                <span className="text-[#6B6B6B] ml-1.5">— Cash on Delivery does not add an additional handling charge.</span>
              </div>
            </div>

            {/* LIVE CHECKOUT PREVIEW BOX */}
            <div className="p-4 bg-[#F7F7F5] border border-[#E5E5E2] space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B] block border-b border-[#E5E5E2] pb-1.5">
                LIVE CHECKOUT CALCULATION PREVIEW
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                {/* Below Threshold Preview */}
                <div className="p-3 bg-white border border-[#E5E5E2] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">Order Below Threshold</span>
                  <div className="flex justify-between text-[#6B6B6B]">
                    <span>Subtotal:</span>
                    <span>{formatPrice(previewBelowSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B6B6B]">
                    <span>Shipping & Delivery:</span>
                    <span>{formatPrice(previewBelowShipping)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B6B6B]">
                    <span>COD Fee:</span>
                    <span>₹0</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#111111] border-t border-[#E5E5E2] pt-1 mt-1">
                    <span>Total Amount:</span>
                    <span>{formatPrice(previewBelowTotal)}</span>
                  </div>
                </div>

                {/* Above Threshold Preview */}
                <div className="p-3 bg-white border border-[#E5E5E2] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#2E6B44] block">Order At / Above Threshold</span>
                  <div className="flex justify-between text-[#6B6B6B]">
                    <span>Subtotal:</span>
                    <span>{formatPrice(previewAboveSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#2E6B44] font-bold">
                    <span>Shipping & Delivery:</span>
                    <span>FREE</span>
                  </div>
                  <div className="flex justify-between text-[#6B6B6B]">
                    <span>COD Fee:</span>
                    <span>₹0</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#111111] border-t border-[#E5E5E2] pt-1 mt-1">
                    <span>Total Amount:</span>
                    <span>{formatPrice(previewAboveTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() =>
                  handleSaveSection("Shipping & Delivery", ["shipping_fee", "free_shipping_threshold"])
                }
                disabled={savingSection === "Shipping & Delivery"}
                className="px-5 py-2.5 bg-[#111111] text-white font-semibold uppercase tracking-wider hover:bg-black disabled:opacity-50 flex items-center"
              >
                {savingSection === "Shipping & Delivery" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                <span>SAVE SHIPPING SETTINGS</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: ANNOUNCEMENT BAR SETTINGS */}
          <div className="bg-white border border-[#E5E5E2] p-5 sm:p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-3">
              <div className="flex items-center space-x-2">
                <Megaphone className="w-4 h-4 text-[#111111]" />
                <h3 className="font-semibold uppercase tracking-wider text-[#111111] text-sm">
                  2. ANNOUNCEMENT BAR SETTINGS
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddAnnouncement}
                className="px-3 py-1.5 bg-[#F7F7F5] border border-[#E5E5E2] hover:border-[#111111] text-[11px] font-semibold uppercase tracking-wider text-[#111111] flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Announcement
              </button>
            </div>

            <p className="text-[11px] text-[#6B6B6B]">
              Configure messages displayed in the top header announcement bar. Multiple active announcements will automatically cycle on the storefront. Use <code className="font-mono text-[#111111] bg-[#F7F7F5] px-1 font-bold">{"{{FREE_SHIPPING_THRESHOLD}}"}</code> to render current dynamic threshold (e.g. ₹{numThreshold}).
            </p>

            <div className="space-y-3">
              {announcements.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3.5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    item.enabled ? "bg-white border-[#E5E5E2]" : "bg-[#F7F7F5] border-[#E5E5E2] opacity-60"
                  }`}
                >
                  <div className="flex items-center space-x-3 w-full sm:w-auto flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => handleToggleAnnouncement(item.id, e.target.checked)}
                      className="rounded text-[#111111] focus:ring-0 shrink-0"
                    />
                    <span className="font-mono text-[11px] text-[#6B6B6B] shrink-0 font-bold">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => handleUpdateAnnouncementText(item.id, e.target.value)}
                      placeholder="Announcement message text..."
                      className="w-full p-2 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none text-xs font-medium"
                    />
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveAnnouncement(idx, "up")}
                      className="p-1.5 border border-[#E5E5E2] hover:border-[#111111] disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5 text-[#111111]" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === announcements.length - 1}
                      onClick={() => handleMoveAnnouncement(idx, "down")}
                      className="p-1.5 border border-[#E5E5E2] hover:border-[#111111] disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-[#111111]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnnouncement(item.id)}
                      className="p-1.5 border border-[#E5E5E2] hover:border-[#A83232] text-[#6B6B6B] hover:text-[#A83232]"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveAnnouncements}
                disabled={savingSection === "Announcement Bar"}
                className="px-5 py-2.5 bg-[#111111] text-white font-semibold uppercase tracking-wider hover:bg-black disabled:opacity-50 flex items-center"
              >
                {savingSection === "Announcement Bar" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                <span>SAVE ANNOUNCEMENTS</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: STORE INFORMATION */}
          <div className="bg-white border border-[#E5E5E2] p-5 sm:p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-[#E5E5E2] pb-3">
              <Store className="w-4 h-4 text-[#111111]" />
              <h3 className="font-semibold uppercase tracking-wider text-[#111111] text-sm">
                3. STORE INFORMATION & COVERAGE
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                  Store Name
                </label>
                <input
                  type="text"
                  value={settings.store_name || "FictionFigure"}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                  Store Location
                </label>
                <input
                  type="text"
                  value={settings.store_location ?? ""}
                  onChange={(e) => setSettings({ ...settings, store_location: e.target.value })}
                  placeholder="e.g. Bikaner, Rajasthan"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                  Delivery Coverage
                </label>
                <input
                  type="text"
                  value={settings.delivery_coverage ?? ""}
                  onChange={(e) => setSettings({ ...settings, delivery_coverage: e.target.value })}
                  placeholder="e.g. Delivering across India"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                  Support Phone
                </label>
                <input
                  type="text"
                  value={settings.support_phone ?? ""}
                  onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                  placeholder="e.g. +91 8952198699"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                  Support Email
                </label>
                <input
                  type="email"
                  value={settings.support_email ?? ""}
                  onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                  placeholder="e.g. support@fictionfigure.in"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                  Support Hours
                </label>
                <input
                  type="text"
                  value={settings.support_hours ?? ""}
                  onChange={(e) => setSettings({ ...settings, support_hours: e.target.value })}
                  placeholder="e.g. Monday - Saturday, 10:00 AM - 7:00 PM"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() =>
                  handleSaveSection("Store Information", [
                    "store_name",
                    "store_location",
                    "delivery_coverage",
                    "support_phone",
                    "support_email",
                    "support_hours",
                  ])
                }
                disabled={savingSection === "Store Information"}
                className="px-5 py-2.5 bg-[#111111] text-white font-semibold uppercase tracking-wider hover:bg-black disabled:opacity-50 flex items-center"
              >
                {savingSection === "Store Information" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Save className="w-4 h-4 mr-1.5" />
                )}
                <span>SAVE STORE INFORMATION</span>
              </button>
            </div>
          </div>

          {/* SECTION 4: HOMEPAGE HERO & CAROUSEL CMS */}
          <div id="hero" className="bg-white border border-[#E5E5E2] p-5 sm:p-6 space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E5E5E2] pb-3 gap-3">
              <div>
                <h3 className="font-semibold uppercase tracking-wider text-[#111111] text-sm">
                  4. HOMEPAGE HERO & COLLECTION CAROUSEL CMS
                </h3>
                <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                  Manage the homepage horizontal collection carousel slides, imagery, titles, and CTA link destinations.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleAddSlide}
                  className="px-3 py-1.5 bg-[#F7F7F5] border border-[#E5E5E2] hover:border-[#111111] text-[11px] font-semibold uppercase tracking-wider text-[#111111] flex items-center"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Carousel Slide
                </button>
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
                    Enable Carousel
                  </span>
                </label>
              </div>
            </div>

            {/* Carousel Slides List */}
            {carouselSlides.length === 0 ? (
              <div className="p-8 text-center bg-[#F7F7F5] border border-[#E5E5E2] space-y-2">
                <p className="text-xs text-[#6B6B6B]">
                  No custom carousel slides saved yet. The storefront is currently using dynamic fallback slides derived from real store assets.
                </p>
                <button
                  type="button"
                  onClick={handleAddSlide}
                  className="px-4 py-2 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black inline-flex items-center"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Create First Slide
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {carouselSlides.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className={`border p-4 sm:p-5 space-y-4 ${
                      slide.enabled ? "bg-white border-[#E5E5E2]" : "bg-[#F7F7F5] border-[#E5E5E2] opacity-70"
                    }`}
                  >
                    {/* Slide Header */}
                    <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={slide.enabled !== false}
                          onChange={(e) => handleUpdateSlide(slide.id, "enabled", e.target.checked)}
                          className="rounded text-[#111111] focus:ring-0"
                        />
                        <span className="font-mono text-xs font-bold text-[#111111] uppercase tracking-wider">
                          Slide #{idx + 1}
                        </span>
                        {slide.title && (
                          <span className="text-xs font-semibold text-[#6B6B6B] truncate max-w-[200px] sm:max-w-[300px]">
                            — {slide.title}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSlide(idx, "up")}
                          className="p-1.5 border border-[#E5E5E2] hover:border-[#111111] disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5 text-[#111111]" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === carouselSlides.length - 1}
                          onClick={() => handleMoveSlide(idx, "down")}
                          className="p-1.5 border border-[#E5E5E2] hover:border-[#111111] disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5 text-[#111111]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlide(slide.id)}
                          className="p-1.5 border border-[#E5E5E2] hover:border-[#A83232] text-[#6B6B6B] hover:text-[#A83232]"
                          title="Delete Slide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Slide Content Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                      {/* Image Thumbnail & Upload Controls */}
                      <div className="md:col-span-1 space-y-2">
                        <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                          Foreground / Card Image
                        </label>
                        <div className="relative aspect-[3/4] w-full border border-[#E5E5E2] bg-[#F7F7F5] overflow-hidden">
                          {slide.image ? (
                            <Image
                              src={slide.image}
                              alt={slide.title || "Slide Preview"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-[10px] text-[#6B6B6B]">
                              <span>No Image Set</span>
                              <span className="text-[9px] text-[#999] mt-1">Upload or Paste URL</span>
                            </div>
                          )}
                          <div className="absolute top-2 left-2 bg-black/70 text-white text-[9px] font-mono px-1.5 py-0.5 uppercase">
                            Preview
                          </div>
                        </div>

                        <label className="w-full px-3 py-2 bg-white border border-[#E5E5E2] hover:border-[#111111] text-[#111111] font-semibold uppercase text-[10px] tracking-wider cursor-pointer inline-flex items-center justify-center">
                          {uploadingSlideImageId === `${slide.id}:image` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                          ) : (
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                          )}
                          <span>Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSlideImageUpload(slide.id, e, "image")}
                            disabled={uploadingSlideImageId === `${slide.id}:image`}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Text & URL Inputs */}
                      <div className="md:col-span-3 space-y-3">
                        <div className="space-y-1">
                          <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                            Image URL (Cloudinary or Direct Web URL)
                          </label>
                          <input
                            type="url"
                            value={slide.image || ""}
                            onChange={(e) => handleUpdateSlide(slide.id, "image", e.target.value)}
                            placeholder="https://res.cloudinary.com/... or https://..."
                            className="w-full p-2.5 bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-[11px] focus:border-[#111111] focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                              Eyebrow / Tag
                            </label>
                            <input
                              type="text"
                              value={slide.eyebrow || ""}
                              onChange={(e) => handleUpdateSlide(slide.id, "eyebrow", e.target.value)}
                              placeholder="e.g. FIGURES"
                              className="w-full p-2 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                              Main Title *
                            </label>
                            <input
                              type="text"
                              value={slide.title || ""}
                              onChange={(e) => handleUpdateSlide(slide.id, "title", e.target.value)}
                              placeholder="e.g. Characters worth collecting."
                              className="w-full p-2 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                              Accent Subtitle
                            </label>
                            <input
                              type="text"
                              value={slide.titleAccent || ""}
                              onChange={(e) => handleUpdateSlide(slide.id, "titleAccent", e.target.value)}
                              placeholder="e.g. Masterwork Statues"
                              className="w-full p-2 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                            Short Description
                          </label>
                          <textarea
                            rows={2}
                            value={slide.description || ""}
                            onChange={(e) => handleUpdateSlide(slide.id, "description", e.target.value)}
                            placeholder="Brief description paragraph..."
                            className="w-full p-2 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none text-xs leading-relaxed"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                              CTA Button Label
                            </label>
                            <input
                              type="text"
                              value={slide.primaryLabel || ""}
                              onChange={(e) => handleUpdateSlide(slide.id, "primaryLabel", e.target.value)}
                              placeholder="SHOP FIGURES"
                              className="w-full p-2 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                              CTA Destination URL / Category
                            </label>
                            <input
                              type="text"
                              value={slide.primaryUrl || ""}
                              onChange={(e) => handleUpdateSlide(slide.id, "primaryUrl", e.target.value)}
                              placeholder="/shop?category=figures"
                              className="w-full p-2 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                              Secondary CTA Label (optional)
                            </label>
                            <input
                              type="text"
                              value={slide.secondaryLabel || ""}
                              onChange={(e) => handleUpdateSlide(slide.id, "secondaryLabel", e.target.value)}
                              placeholder="EXPLORE NEW ARRIVALS"
                              className="w-full p-2 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                              Secondary CTA URL (optional)
                            </label>
                            <input
                              type="text"
                              value={slide.secondaryUrl || ""}
                              onChange={(e) => handleUpdateSlide(slide.id, "secondaryUrl", e.target.value)}
                              placeholder="/shop?sortBy=newest"
                              className="w-full p-2 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                              Selector Card Label
                            </label>
                            <input
                              type="text"
                              value={slide.cardLabel || ""}
                              onChange={(e) => handleUpdateSlide(slide.id, "cardLabel", e.target.value)}
                              placeholder="e.g. ONE PIECE (defaults to Main Title)"
                              className="w-full p-2 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                              Selector Card Caption
                            </label>
                            <input
                              type="text"
                              value={slide.cardCaption || ""}
                              onChange={(e) => handleUpdateSlide(slide.id, "cardCaption", e.target.value)}
                              placeholder="e.g. Collection (defaults to Eyebrow)"
                              className="w-full p-2 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cinematic hero background (full-bleed, separate from the foreground image) */}
                    <div className="border-t border-[#E5E5E2] pt-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="font-semibold uppercase text-[#111111] text-[11px] tracking-wider">
                          Hero Background Image (full-bleed)
                        </label>
                        {!slide.backgroundImage && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FFF8E1] border border-[#FFE082] text-[#B86E00]">
                            Background artwork required
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6B6B6B]">
                        Wide, high-resolution cinematic artwork (at least 1920×1080, landscape). It fills the whole
                        hero behind the text and changes with this slide. Keep the main subject toward the right.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                        <div className="md:col-span-2 space-y-2">
                          <div className="relative aspect-video w-full border border-[#E5E5E2] bg-[#111111] overflow-hidden">
                            {slide.backgroundImage ? (
                              <>
                                <Image
                                  src={slide.backgroundImage}
                                  alt={`${slide.title || "Slide"} background`}
                                  fill
                                  sizes="400px"
                                  className="object-cover"
                                  style={{ objectPosition: slide.backgroundPosition || "70% center" }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-[11px] font-black uppercase leading-tight max-w-[50%]">
                                  {slide.title}
                                </span>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-white/60 uppercase tracking-wider">
                                No background set
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <label className="flex-1 px-3 py-2 bg-white border border-[#E5E5E2] hover:border-[#111111] text-[#111111] font-semibold uppercase text-[10px] tracking-wider cursor-pointer inline-flex items-center justify-center">
                              {uploadingSlideImageId === `${slide.id}:backgroundImage` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                              ) : (
                                <Upload className="w-3.5 h-3.5 mr-1.5" />
                              )}
                              <span>{slide.backgroundImage ? "Change Background" : "Upload Background"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleSlideImageUpload(slide.id, e, "backgroundImage")}
                                disabled={uploadingSlideImageId === `${slide.id}:backgroundImage`}
                                className="hidden"
                              />
                            </label>
                            {slide.backgroundImage && (
                              <button
                                type="button"
                                onClick={() => handleUpdateSlide(slide.id, "backgroundImage", "")}
                                className="px-3 py-2 border border-[#E5E5E2] hover:border-[#A83232] text-[#6B6B6B] hover:text-[#A83232] text-[10px] font-semibold uppercase"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2 space-y-3">
                          <div className="space-y-1">
                            <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                              Background Image URL
                            </label>
                            <input
                              type="url"
                              value={slide.backgroundImage || ""}
                              onChange={(e) => handleUpdateSlide(slide.id, "backgroundImage", e.target.value)}
                              placeholder="https://res.cloudinary.com/..."
                              className="w-full p-2.5 bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-[11px] focus:border-[#111111] focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-semibold uppercase text-[#6B6B6B] text-[11px] block">
                              Background Focal Point
                            </label>
                            <select
                              value={slide.backgroundPosition || "70% center"}
                              onChange={(e) => handleUpdateSlide(slide.id, "backgroundPosition", e.target.value)}
                              className="w-full p-2 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none text-xs"
                            >
                              <option value="70% center">Right-centre (recommended)</option>
                              <option value="right center">Right</option>
                              <option value="center center">Centre</option>
                              <option value="left center">Left</option>
                              <option value="70% top">Right-top</option>
                              <option value="center top">Centre-top</option>
                              <option value="70% bottom">Right-bottom</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-[#E5E5E2]">
              <button
                type="button"
                onClick={handleAddSlide}
                className="px-4 py-2 bg-[#F7F7F5] border border-[#E5E5E2] hover:border-[#111111] text-xs font-semibold uppercase tracking-wider text-[#111111] flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Slide
              </button>

              <button
                type="button"
                onClick={handleSaveCarousel}
                disabled={savingSection === "Homepage Hero Carousel"}
                className="px-5 py-2.5 bg-[#111111] text-white font-semibold uppercase tracking-wider hover:bg-black disabled:opacity-50 flex items-center"
              >
                {savingSection === "Homepage Hero Carousel" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                <span>SAVE HERO CAROUSEL</span>
              </button>
            </div>
          </div>

          {/* 5. UPI PAYMENT SETTINGS */}
          <div className="bg-white border border-[#E5E5E2] p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#F7F7F5] rounded border border-[#E5E5E2]">
                  <CreditCard className="w-5 h-5 text-[#111111]" />
                </div>
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider text-[#111111]">
                    5. UPI PAYMENT SETTINGS
                  </h2>
                  <p className="text-xs text-[#6B6B6B]">
                    Configure UPI ID and QR code image dynamically displayed at customer checkout
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">
                  UPI ID (VPA)
                </label>
                <input
                  type="text"
                  value={settings.upi_id || ""}
                  onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })}
                  placeholder="fictionfigure@upi"
                  className="w-full p-2.5 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none text-xs font-mono"
                />
                <p className="text-[11px] text-[#6B6B6B]">
                  This UPI VPA ID will be shown to customers at checkout for direct UPI payments.
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-semibold uppercase text-[#6B6B6B] text-[11px]">
                  UPI QR CODE IMAGE
                </label>

                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 bg-[#F7F7F5] p-4 border border-[#E5E5E2]">
                  <div className="relative w-36 h-36 border border-[#E5E5E2] bg-white flex items-center justify-center overflow-hidden shrink-0">
                    {settings.upi_qr_url ? (
                      <Image
                        src={settings.upi_qr_url}
                        alt="UPI QR Code Preview"
                        fill
                        className="object-contain p-2"
                        unoptimized
                      />
                    ) : (
                      <div className="text-center p-2 text-[#6B6B6B]">
                        <QrCode className="w-8 h-8 mx-auto text-[#111111] mb-1" />
                        <span className="text-[10px] uppercase block font-mono">No QR Image</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-[#6B6B6B]">
                      Upload a clear QR code image generated from your UPI merchant app (GPay, PhonePe, Paytm).
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <label className="px-4 py-2 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black cursor-pointer flex items-center">
                        {uploadingQr ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        <span>{settings.upi_qr_url ? "CHANGE QR CODE" : "UPLOAD QR CODE"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrUpload}
                          disabled={uploadingQr}
                          className="hidden"
                        />
                      </label>

                      {settings.upi_qr_url && (
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, upi_qr_url: "" })}
                          className="px-4 py-2 bg-white border border-[#E5E5E2] text-[#111111] text-xs font-semibold uppercase tracking-wider hover:bg-[#F7F7F5] flex items-center"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5 text-red-600" />
                          <span>REMOVE QR</span>
                        </button>
                      )}
                    </div>
                    {settings.upi_qr_url && (
                      <p className="text-[11px] text-[#6B6B6B] break-all w-full">
                        URL: {settings.upi_qr_url}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => handleSaveSection("UPI Payment Settings", ["upi_id", "upi_qr_url"])}
                  disabled={savingSection === "UPI Payment Settings"}
                  className="px-5 py-2.5 bg-[#111111] text-white font-semibold uppercase tracking-wider hover:bg-black disabled:opacity-50 flex items-center"
                >
                  {savingSection === "UPI Payment Settings" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  <span>SAVE UPI SETTINGS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
