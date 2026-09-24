"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
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
  ExternalLink,
  ShieldCheck,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  Sliders,
  Type,
  Layout,
  Image as ImageIcon,
  Link as LinkIcon,
  RotateCcw,
} from "lucide-react";
import { API_BASE, adminFetch } from "@/lib/api";
import {
  HomepageCMSConfig,
  DEFAULT_HOMEPAGE_CMS_CONFIG,
  DEFAULT_HOMEPAGE_SECTIONS,
  SAFE_LUCIDE_ICONS,
  HomepageSectionConfig,
  TrustBenefitItem,
  AnnouncementConfigItem,
  HeaderNavItemConfig,
} from "@/types/cms";
import { CarouselSlideItem } from "../settings/page";

interface DBProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  images: { url: string }[];
}

interface DBCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export default function AdminHomepageCMSPage() {
  const [cmsConfig, setCmsConfig] = useState<HomepageCMSConfig>(DEFAULT_HOMEPAGE_CMS_CONFIG);
  const [heroSlides, setHeroSlides] = useState<CarouselSlideItem[]>([]);
  const [dbProducts, setDbProducts] = useState<DBProduct[]>([]);
  const [dbCategories, setDbCategories] = useState<DBCategory[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState<"sections" | "announcements" | "navigation" | "seo" | "hero">("sections");
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>("categories");

  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [productPickerTarget, setProductPickerTarget] = useState<"new_arrivals" | "more_to_collect" | null>(null);

  const [confirmResetModal, setConfirmResetModal] = useState(false);

  // Load initial settings and DB records
  const loadCmsData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Store Settings
      const res = await adminFetch(`${API_BASE}/admin/settings`);
      const settingsRes: {
        success: boolean;
        settings: Record<string, string>;
        products: DBProduct[];
        carouselSlides?: CarouselSlideItem[];
      } = await res.json();

      if (settingsRes.success) {
        if (settingsRes.products) setDbProducts(settingsRes.products);

        // Parse Homepage CMS config JSON
        if (settingsRes.settings?.homepage_cms_config_json) {
          try {
            const parsed = JSON.parse(settingsRes.settings.homepage_cms_config_json);
            if (parsed && typeof parsed === "object") {
              setCmsConfig((prev) => ({
                ...DEFAULT_HOMEPAGE_CMS_CONFIG,
                ...parsed,
                sectionsOrder: parsed.sectionsOrder || DEFAULT_HOMEPAGE_SECTIONS,
              }));
            }
          } catch (e) {}
        }

        // Parse Hero Carousel Slides
        if (settingsRes.settings?.homepage_carousel_slides_json) {
          try {
            const parsedSlides = JSON.parse(settingsRes.settings.homepage_carousel_slides_json);
            if (Array.isArray(parsedSlides)) {
              setHeroSlides(parsedSlides);
            }
          } catch (e) {}
        } else if (settingsRes.carouselSlides && settingsRes.carouselSlides.length > 0) {
          setHeroSlides(settingsRes.carouselSlides);
        }
      }

      // 2. Fetch Categories
      const catRes = await fetch(`${API_BASE}/categories`);
      if (catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData)) {
          setDbCategories(catData);
        } else if (catData.categories) {
          setDbCategories(catData.categories);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load homepage CMS settings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCmsData();
  }, []);

  const updateConfig = (updater: (prev: HomepageCMSConfig) => HomepageCMSConfig) => {
    setCmsConfig(updater);
    setIsDirty(true);
  };

  // Image Upload Handler
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (url: string) => void,
    fieldKey: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldKey);
    setError("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const token = localStorage.getItem("fictionfigure_token");
      const res = await fetch(`${API_BASE}/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        onSuccess(data.url);
        setIsDirty(true);
      } else {
        setError(data.error || "Image upload failed.");
      }
    } catch (err: any) {
      setError(err.message || "Upload request failed.");
    } finally {
      setUploadingField(null);
    }
  };

  // Save All Changes to Backend
  const handleSaveChanges = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const settingsPayload: Record<string, string> = {
        homepage_cms_config_json: JSON.stringify(cmsConfig),
        homepage_carousel_slides_json: JSON.stringify(heroSlides),
      };

      const res = await adminFetch(`${API_BASE}/admin/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "Homepage CMS & Layout Configuration",
          settings: settingsPayload,
        }),
      });

      const resData = await res.json();

      if (resData.success) {
        setMessage("Homepage CMS configuration published successfully!");
        setIsDirty(false);
      } else {
        setError("Failed to save changes.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  // Restore Default Configuration
  const handleRestoreDefaults = () => {
    setCmsConfig(DEFAULT_HOMEPAGE_CMS_CONFIG);
    setIsDirty(true);
    setConfirmResetModal(false);
    setMessage("Homepage configuration reset to default FICTIONFIGURE layout!");
  };

  // Reordering Section Helpers
  const moveSection = (index: number, direction: "up" | "down") => {
    const sections = [...cmsConfig.sectionsOrder];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const temp = sections[index];
    sections[index] = sections[targetIdx];
    sections[targetIdx] = temp;

    sections.forEach((sec, idx) => (sec.sortOrder = idx + 1));
    updateConfig((prev) => ({ ...prev, sectionsOrder: sections }));
  };

  const toggleSectionEnabled = (sectionId: string) => {
    updateConfig((prev) => ({
      ...prev,
      sectionsOrder: prev.sectionsOrder.map((sec) =>
        sec.id === sectionId ? { ...sec, enabled: !sec.enabled } : sec
      ),
    }));
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-xs font-mono text-[#6B6B6B] flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="w-6 h-6 animate-spin mb-3 text-[#111111]" />
        <span>Loading Homepage CMS Engine...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Top Header Controls Bar */}
      <div className="bg-white border border-[#E5E5E2] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sticky top-0 z-30 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#6B6B6B] uppercase block">
              STOREFRONT CMS BUILDER
            </span>
            {isDirty && (
              <span className="px-2 py-0.5 bg-[#B86E00] text-white text-[9px] font-mono font-bold uppercase tracking-wider animate-pulse">
                UNSAVED CHANGES
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#111111] uppercase font-mono mt-0.5">
            HOMEPAGE MANAGEMENT
          </h1>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2.5 border border-[#E5E5E2] hover:border-[#111111] bg-white text-[#111111] text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Storefront</span>
          </Link>

          <button
            onClick={() => setConfirmResetModal(true)}
            className="px-4 py-2.5 border border-[#E5E5E2] hover:border-[#A83232] text-[#A83232] text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSaveChanges}
            disabled={saving}
            className="px-6 py-2.5 bg-[#111111] hover:bg-[#2A2A2A] text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Publishing..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {message && (
        <div className="p-4 bg-[#2E6B44]/10 border border-[#2E6B44]/30 text-[#2E6B44] text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage("")} className="text-xs underline font-mono">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#A83232]/10 border border-[#A83232]/30 text-[#A83232] text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-xs underline font-mono">Dismiss</button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="border-b border-[#E5E5E2] flex items-center space-x-2 overflow-x-auto text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab("sections")}
          className={`px-5 py-3 border-b-2 font-mono transition-colors flex items-center space-x-2 ${
            activeTab === "sections"
              ? "border-[#111111] text-[#111111] bg-white font-bold"
              : "border-transparent text-[#6B6B6B] hover:text-[#111111]"
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>Homepage Sections & Reordering</span>
        </button>

        <button
          onClick={() => setActiveTab("announcements")}
          className={`px-5 py-3 border-b-2 font-mono transition-colors flex items-center space-x-2 ${
            activeTab === "announcements"
              ? "border-[#111111] text-[#111111] bg-white font-bold"
              : "border-transparent text-[#6B6B6B] hover:text-[#111111]"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Announcement Bar</span>
        </button>

        <button
          onClick={() => setActiveTab("navigation")}
          className={`px-5 py-3 border-b-2 font-mono transition-colors flex items-center space-x-2 ${
            activeTab === "navigation"
              ? "border-[#111111] text-[#111111] bg-white font-bold"
              : "border-transparent text-[#6B6B6B] hover:text-[#111111]"
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          <span>Header Navigation</span>
        </button>

        <button
          onClick={() => setActiveTab("seo")}
          className={`px-5 py-3 border-b-2 font-mono transition-colors flex items-center space-x-2 ${
            activeTab === "seo"
              ? "border-[#111111] text-[#111111] bg-white font-bold"
              : "border-transparent text-[#6B6B6B] hover:text-[#111111]"
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Homepage SEO</span>
        </button>
      </div>

      {/* TAB 1: SECTIONS MANAGER & REORDERING */}
      {activeTab === "sections" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E5E2] p-4 text-xs text-[#6B6B6B] flex items-center justify-between font-mono">
            <span>Drag or click arrows to reorder sections. Toggle switches to enable or disable sections on the public homepage.</span>
            <span className="font-bold text-[#111111]">{cmsConfig.sectionsOrder.filter((s) => s.enabled).length} ACTIVE SECTIONS</span>
          </div>

          <div className="space-y-4">
            {cmsConfig.sectionsOrder.map((section, idx) => {
              const isExpanded = expandedSectionId === section.id;
              return (
                <div
                  key={section.id}
                  className={`bg-white border transition-all ${
                    section.enabled ? "border-[#E5E5E2]" : "border-[#E5E5E2] opacity-60 bg-[#FDFDFD]"
                  }`}
                >
                  {/* Section Bar Header */}
                  <div className="p-4 flex items-center justify-between bg-[#FAFAFA] border-b border-[#E5E5E2]">
                    <div className="flex items-center space-x-4">
                      {/* Up/Down buttons */}
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => moveSection(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 text-[#6B6B6B] hover:text-[#111111] disabled:opacity-20"
                          title="Move Section Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveSection(idx, "down")}
                          disabled={idx === cmsConfig.sectionsOrder.length - 1}
                          className="p-1 text-[#6B6B6B] hover:text-[#111111] disabled:opacity-20"
                          title="Move Section Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Title & Index */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold text-[#6B6B6B] bg-[#E5E5E2] px-2 py-0.5">
                            POS {idx + 1}
                          </span>
                          <h3 className="text-sm font-bold uppercase font-mono text-[#111111]">
                            {section.name}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Enable / Disable Toggle */}
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <span className="text-xs font-mono font-bold uppercase text-[#6B6B6B]">
                          {section.enabled ? "ENABLED" : "DISABLED"}
                        </span>
                        <input
                          type="checkbox"
                          checked={section.enabled}
                          onChange={() => toggleSectionEnabled(section.id)}
                          className="w-4 h-4 accent-[#111111] cursor-pointer"
                        />
                      </label>

                      {/* Expand / Collapse Edit */}
                      <button
                        onClick={() => setExpandedSectionId(isExpanded ? null : section.id)}
                        className="px-3 py-1.5 border border-[#E5E5E2] hover:border-[#111111] bg-white text-xs font-bold uppercase tracking-wider font-mono flex items-center space-x-1"
                      >
                        <span>{isExpanded ? "COLLAPSE" : "EDIT SECTION"}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Section Editor Panel */}
                  {isExpanded && (
                    <div className="p-6 space-y-6 bg-white">
                      {/* 1. HERO CAROUSEL EDITOR */}
                      {section.id === "hero" && (
                        <div className="space-y-4">
                          <div className="p-4 bg-[#F7F7F5] border border-[#E5E5E2] flex items-center justify-between">
                            <span className="text-xs font-mono font-bold uppercase text-[#111111]">
                              Phase 2 Locked Hero Slides Management
                            </span>
                            <Link
                              href="/admin/settings#hero"
                              className="text-xs font-mono text-[#111111] underline hover:text-[#D4AF37]"
                            >
                              Manage Hero Slides in Settings
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* 2. SHOP BY CATEGORY EDITOR */}
                      {section.id === "categories" && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                                Section Eyebrow
                              </label>
                              <input
                                type="text"
                                value={cmsConfig.shopByCategory.eyebrow}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateConfig((prev) => ({
                                    ...prev,
                                    shopByCategory: { ...prev.shopByCategory, eyebrow: val },
                                  }));
                                }}
                                className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                                Section Title
                              </label>
                              <input
                                type="text"
                                value={cmsConfig.shopByCategory.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateConfig((prev) => ({
                                    ...prev,
                                    shopByCategory: { ...prev.shopByCategory, title: val },
                                  }));
                                }}
                                className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                              Section Description
                            </label>
                            <textarea
                              rows={2}
                              value={cmsConfig.shopByCategory.description}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateConfig((prev) => ({
                                  ...prev,
                                  shopByCategory: { ...prev.shopByCategory, description: val },
                                }));
                              }}
                              className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                                CTA Button Label
                              </label>
                              <input
                                type="text"
                                value={cmsConfig.shopByCategory.ctaText}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateConfig((prev) => ({
                                    ...prev,
                                    shopByCategory: { ...prev.shopByCategory, ctaText: val },
                                  }));
                                }}
                                className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                                CTA URL Destination
                              </label>
                              <input
                                type="text"
                                value={cmsConfig.shopByCategory.ctaUrl}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateConfig((prev) => ({
                                    ...prev,
                                    shopByCategory: { ...prev.shopByCategory, ctaUrl: val },
                                  }));
                                }}
                                className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3. NEW ARRIVALS EDITOR */}
                      {section.id === "new_arrivals" && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                                Section Eyebrow
                              </label>
                              <input
                                type="text"
                                value={cmsConfig.newArrivals.eyebrow}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateConfig((prev) => ({
                                    ...prev,
                                    newArrivals: { ...prev.newArrivals, eyebrow: val },
                                  }));
                                }}
                                className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                                Section Title
                              </label>
                              <input
                                type="text"
                                value={cmsConfig.newArrivals.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateConfig((prev) => ({
                                    ...prev,
                                    newArrivals: { ...prev.newArrivals, title: val },
                                  }));
                                }}
                                className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                                Selection Mode
                              </label>
                              <select
                                value={cmsConfig.newArrivals.mode}
                                onChange={(e) => {
                                  const val = e.target.value as "automatic" | "manual";
                                  updateConfig((prev) => ({
                                    ...prev,
                                    newArrivals: { ...prev.newArrivals, mode: val },
                                  }));
                                }}
                                className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none bg-white font-mono"
                              >
                                <option value="automatic">AUTOMATIC (Newest Products API)</option>
                                <option value="manual">MANUAL (Select Specific DB Products)</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                                Product Display Count
                              </label>
                              <input
                                type="number"
                                min={4}
                                max={16}
                                value={cmsConfig.newArrivals.limit}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 8;
                                  updateConfig((prev) => ({
                                    ...prev,
                                    newArrivals: { ...prev.newArrivals, limit: val },
                                  }));
                                }}
                                className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 4. FEATURED COLLECTION EDITOR */}
                      {section.id === "featured_collection" && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                                Section Eyebrow
                              </label>
                              <input
                                type="text"
                                value={cmsConfig.featuredCollection.eyebrow}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateConfig((prev) => ({
                                    ...prev,
                                    featuredCollection: { ...prev.featuredCollection, eyebrow: val },
                                  }));
                                }}
                                className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                                Collection Title
                              </label>
                              <input
                                type="text"
                                value={cmsConfig.featuredCollection.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateConfig((prev) => ({
                                    ...prev,
                                    featuredCollection: { ...prev.featuredCollection, title: val },
                                  }));
                                }}
                                className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                              Description
                            </label>
                            <textarea
                              rows={2}
                              value={cmsConfig.featuredCollection.description}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateConfig((prev) => ({
                                  ...prev,
                                  featuredCollection: { ...prev.featuredCollection, description: val },
                                }));
                              }}
                              className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                                Button Label
                              </label>
                              <input
                                type="text"
                                value={cmsConfig.featuredCollection.ctaText}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateConfig((prev) => ({
                                    ...prev,
                                    featuredCollection: { ...prev.featuredCollection, ctaText: val },
                                  }));
                                }}
                                className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                                Target Category
                              </label>
                              <select
                                value={cmsConfig.featuredCollection.ctaDestinationValue}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateConfig((prev) => ({
                                    ...prev,
                                    featuredCollection: { ...prev.featuredCollection, ctaDestinationValue: val },
                                  }));
                                }}
                                className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none bg-white font-mono"
                              >
                                <option value="">-- Select Category --</option>
                                {dbCategories.map((c) => (
                                  <option key={c.id} value={c.slug}>
                                    {c.name} ({c.slug})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 5. MORE TO COLLECT EDITOR */}
                      {section.id === "more_to_collect" && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                                Section Eyebrow
                              </label>
                              <input
                                type="text"
                                value={cmsConfig.moreToCollect.eyebrow}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateConfig((prev) => ({
                                    ...prev,
                                    moreToCollect: { ...prev.moreToCollect, eyebrow: val },
                                  }));
                                }}
                                className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                                Section Title
                              </label>
                              <input
                                type="text"
                                value={cmsConfig.moreToCollect.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateConfig((prev) => ({
                                    ...prev,
                                    moreToCollect: { ...prev.moreToCollect, title: val },
                                  }));
                                }}
                                className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 6. PROMOTIONAL BANNER EDITOR */}
                      {section.id === "promo_banner" && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                                Eyebrow
                              </label>
                              <input
                                type="text"
                                value={cmsConfig.promoBanner.eyebrow}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateConfig((prev) => ({
                                    ...prev,
                                    promoBanner: { ...prev.promoBanner, eyebrow: val },
                                  }));
                                }}
                                className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                                Headline
                              </label>
                              <input
                                type="text"
                                value={cmsConfig.promoBanner.headline}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateConfig((prev) => ({
                                    ...prev,
                                    promoBanner: { ...prev.promoBanner, headline: val },
                                  }));
                                }}
                                className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                              Description
                            </label>
                            <textarea
                              rows={2}
                              value={cmsConfig.promoBanner.description}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateConfig((prev) => ({
                                  ...prev,
                                  promoBanner: { ...prev.promoBanner, description: val },
                                }));
                              }}
                              className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                                Button Label
                              </label>
                              <input
                                type="text"
                                value={cmsConfig.promoBanner.ctaText}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateConfig((prev) => ({
                                    ...prev,
                                    promoBanner: { ...prev.promoBanner, ctaText: val },
                                  }));
                                }}
                                className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                                Alignment
                              </label>
                              <select
                                value={cmsConfig.promoBanner.textAlign}
                                onChange={(e) => {
                                  const val = e.target.value as "left" | "center" | "right";
                                  updateConfig((prev) => ({
                                    ...prev,
                                    promoBanner: { ...prev.promoBanner, textAlign: val },
                                  }));
                                }}
                                className="w-full text-xs p-2.5 border border-[#E5E5E2] focus:border-[#111111] outline-none bg-white font-mono"
                              >
                                <option value="left">LEFT ALIGNED</option>
                                <option value="center">CENTER ALIGNED</option>
                                <option value="right">RIGHT ALIGNED</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 7. TRUST STRIP EDITOR */}
                      {section.id === "trust_strip" && (
                        <div className="space-y-4">
                          <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block">
                            Trust & Service Benefits (Lucide Icon Selector)
                          </label>
                          <div className="space-y-3">
                            {cmsConfig.trustStrip.items.map((item, iIdx) => (
                              <div
                                key={item.id || iIdx}
                                className="p-3 border border-[#E5E5E2] bg-[#FAFAFA] flex flex-col md:flex-row md:items-center justify-between gap-3"
                              >
                                <div className="flex items-center space-x-3">
                                  <select
                                    value={item.icon}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      updateConfig((prev) => ({
                                        ...prev,
                                        trustStrip: {
                                          ...prev.trustStrip,
                                          items: prev.trustStrip.items.map((it, idx) =>
                                            idx === iIdx ? { ...it, icon: val } : it
                                          ),
                                        },
                                      }));
                                    }}
                                    className="text-xs p-2 border border-[#E5E5E2] font-mono bg-white"
                                  >
                                    {SAFE_LUCIDE_ICONS.map((icon) => (
                                      <option key={icon} value={icon}>
                                        {icon}
                                      </option>
                                    ))}
                                  </select>

                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      updateConfig((prev) => ({
                                        ...prev,
                                        trustStrip: {
                                          ...prev.trustStrip,
                                          items: prev.trustStrip.items.map((it, idx) =>
                                            idx === iIdx ? { ...it, title: val } : it
                                          ),
                                        },
                                      }));
                                    }}
                                    placeholder="Title"
                                    className="text-xs p-2 border border-[#E5E5E2] font-mono w-48"
                                  />

                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      updateConfig((prev) => ({
                                        ...prev,
                                        trustStrip: {
                                          ...prev.trustStrip,
                                          items: prev.trustStrip.items.map((it, idx) =>
                                            idx === iIdx ? { ...it, description: val } : it
                                          ),
                                        },
                                      }));
                                    }}
                                    placeholder="Description"
                                    className="text-xs p-2 border border-[#E5E5E2] font-mono flex-1 min-w-[200px]"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ANNOUNCEMENTS */}
      {activeTab === "announcements" && (
        <div className="bg-white border border-[#E5E5E2] p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase font-mono text-[#111111]">
            ANNOUNCEMENT BAR MESSAGES
          </h2>
          <p className="text-xs text-[#6B6B6B]">
            Manage top header announcements displayed across the storefront.
          </p>
          <div className="space-y-3">
            {cmsConfig.announcements.map((item, idx) => (
              <div key={item.id || idx} className="p-3 border border-[#E5E5E2] bg-[#FAFAFA] flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      announcements: prev.announcements.map((a, i) =>
                        i === idx ? { ...a, text: val } : a
                      ),
                    }));
                  }}
                  className="flex-1 text-xs p-2 border border-[#E5E5E2] font-mono"
                />
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={() => {
                      updateConfig((prev) => ({
                        ...prev,
                        announcements: prev.announcements.map((a, i) =>
                          i === idx ? { ...a, enabled: !a.enabled } : a
                        ),
                      }));
                    }}
                  />
                  <span className="text-[10px] font-mono uppercase font-bold">Enabled</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: HEADER NAVIGATION */}
      {activeTab === "navigation" && (
        <div className="bg-white border border-[#E5E5E2] p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase font-mono text-[#111111]">
            HEADER NAVIGATION LINKS
          </h2>
          <div className="space-y-3">
            {cmsConfig.headerNavigation.map((item, idx) => (
              <div key={item.id || idx} className="p-3 border border-[#E5E5E2] bg-[#FAFAFA] flex items-center space-x-3">
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      headerNavigation: prev.headerNavigation.map((n, i) =>
                        i === idx ? { ...n, label: val } : n
                      ),
                    }));
                  }}
                  className="text-xs p-2 border border-[#E5E5E2] font-mono w-40"
                  placeholder="Link Label"
                />
                <input
                  type="text"
                  value={item.destination}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      headerNavigation: prev.headerNavigation.map((n, i) =>
                        i === idx ? { ...n, destination: val } : n
                      ),
                    }));
                  }}
                  className="text-xs p-2 border border-[#E5E5E2] font-mono flex-1"
                  placeholder="Destination URL (e.g. /shop)"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SEO */}
      {activeTab === "seo" && (
        <div className="bg-white border border-[#E5E5E2] p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase font-mono text-[#111111]">
            HOMEPAGE SEO & METADATA
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                Homepage Title
              </label>
              <input
                type="text"
                value={cmsConfig.seo.title}
                onChange={(e) => {
                  const val = e.target.value;
                  updateConfig((prev) => ({
                    ...prev,
                    seo: { ...prev.seo, title: val },
                  }));
                }}
                className="w-full text-xs p-2.5 border border-[#E5E5E2] font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono font-bold uppercase text-[#6B6B6B] block mb-1">
                Meta Description
              </label>
              <textarea
                rows={3}
                value={cmsConfig.seo.metaDescription}
                onChange={(e) => {
                  const val = e.target.value;
                  updateConfig((prev) => ({
                    ...prev,
                    seo: { ...prev.seo, metaDescription: val },
                  }));
                }}
                className="w-full text-xs p-2.5 border border-[#E5E5E2] font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Reset Modal */}
      {confirmResetModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E2] p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold uppercase font-mono text-[#111111]">
              Reset Homepage Configuration?
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              This will restore the FICTIONFIGURE default section layout, eyebrows, and title settings. Database products and categories will remain untouched.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmResetModal(false)}
                className="px-4 py-2 border border-[#E5E5E2] text-xs font-bold uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreDefaults}
                className="px-4 py-2 bg-[#A83232] text-white text-xs font-bold uppercase"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
