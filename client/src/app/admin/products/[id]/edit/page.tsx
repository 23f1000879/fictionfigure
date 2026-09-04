"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, Save, Image as ImageIcon, Bell } from "lucide-react";
import { API_BASE, adminFetch } from "@/lib/api";

export default function AdminEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    brand: "",
    categoryId: "",
    price: 15000,
    compareAtPrice: 18000,
    shortDescription: "",
    description: "",
    stockQuantity: 10,
    images: ["", ""],
  });

  useEffect(() => {
    adminFetch(`${API_BASE}/admin/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  const [restockDemand, setRestockDemand] = useState<any>(null);

  const [isClothing, setIsClothing] = useState(false);
  const [sizeConfig, setSizeConfig] = useState([
    { size: "S", enabled: true, stock: 0 },
    { size: "M", enabled: true, stock: 0 },
    { size: "L", enabled: true, stock: 0 },
    { size: "XL", enabled: true, stock: 0 },
    { size: "XXL", enabled: true, stock: 0 },
  ]);
  const [customSizeInput, setCustomSizeInput] = useState("");

  const handleAddCustomSize = () => {
    const val = customSizeInput.trim().toUpperCase();
    if (!val) return;
    if (sizeConfig.some((s) => s.size === val)) return;
    setSizeConfig((prev) => [...prev, { size: val, enabled: true, stock: 0 }]);
    setCustomSizeInput("");
  };

  useEffect(() => {
    if (productId) {
      adminFetch(`${API_BASE}/products?limit=100`)
        .then((res) => res.json())
        .then((data) => {
          const found = (data.products || []).find((p: any) => p.id === productId || p.slug === productId);
          if (found) {
            const clothingDetected = Boolean(found.isClothing || found.variants?.some((v: any) => v.title !== "Standard Edition" && v.title !== "Standard"));
            setIsClothing(clothingDetected);

            if (Array.isArray(found.variants) && found.variants.length > 0) {
              const defaultSizes = ["S", "M", "L", "XL", "XXL"];
              const variantMap = new Map(found.variants.map((v: any) => [v.title, v.inventoryCount || 0]));

              const mergedConfig = defaultSizes.map((s) => ({
                size: s,
                enabled: variantMap.has(s) ? (variantMap.get(s) as number) > 0 : true,
                stock: (variantMap.get(s) as number) || 0,
              }));

              // Add non-standard custom size variants if present
              for (const v of found.variants) {
                if (v.title !== "Standard Edition" && v.title !== "Standard" && !defaultSizes.includes(v.title)) {
                  mergedConfig.push({
                    size: v.title,
                    enabled: (v.inventoryCount || 0) > 0,
                    stock: v.inventoryCount || 0,
                  });
                }
              }

              setSizeConfig(mergedConfig);
            }

            setForm({
              name: found.name || "",
              brand: found.brand || "",
              categoryId: found.categoryId || found.category?.id || "",
              price: found.price || 0,
              compareAtPrice: found.compareAtPrice || 0,
              shortDescription: found.shortDescription || "",
              description: found.description || "",
              stockQuantity: found.variants?.[0]?.inventoryCount || 0,
              images: [
                found.images?.[0]?.url || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
                found.images?.[1]?.url || "https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80",
              ],
            });
          }
        })
        .finally(() => setIsLoading(false));

      // Fetch Restock Demand Summary for this product
      const token = typeof window !== "undefined" ? localStorage.getItem("fictionfigure_token") || localStorage.getItem("token") : null;
      if (token) {
        adminFetch(`${API_BASE}/restock-requests/admin/product/${productId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.product) {
              setRestockDemand(data.product);
            }
          })
          .catch(() => {});
      }
    }
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const activeSizeVariants = isClothing
        ? sizeConfig
            .filter((s) => s.enabled)
            .map((s) => ({ size: s.size, stock: Math.max(0, Number(s.stock) || 0) }))
        : [];

      const totalStock = isClothing
        ? activeSizeVariants.reduce((acc, curr) => acc + curr.stock, 0)
        : Number(form.stockQuantity) || 0;

      const res = await adminFetch(`${API_BASE}/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          stockQuantity: totalStock,
          isClothing,
          sizeVariants: activeSizeVariants,
          images: form.images.filter(Boolean),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update product");

      setMessage("Product details, stock, and images updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-[#6B6B6B]">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Loading figure details...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center space-x-3 border-b border-[#E5E5E2] pb-4">
        <Link href="/admin/products" className="p-2 border border-[#E5E5E2] hover:border-[#111111]">
          <ArrowLeft className="w-4 h-4 text-[#111111]" />
        </Link>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Catalog Management
          </span>
          <h1 className="text-xl font-semibold text-[#111111] tracking-tight">
            Edit Collectible Figure & Inventory
          </h1>
        </div>
      </div>

      {error && <div className="p-4 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold">{error}</div>}
      {message && <div className="p-4 bg-[#2E6B44]/10 border border-[#2E6B44] text-[#2E6B44] text-xs font-semibold">{message}</div>}

      {/* Restock Demand Intelligence Banner */}
      {restockDemand && (
        <div className="bg-[#FFF8E1] border border-[#FFE082] p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B86E00] flex items-center">
              <Bell className="w-4 h-4 mr-1.5" /> RESTOCK DEMAND INTELLIGENCE
            </span>
            <Link
              href="/admin/restock-requests"
              className="text-xs font-bold text-[#111111] hover:underline"
            >
              Manage All Demands &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#6B6B6B] text-[10px] uppercase font-bold block">Customers Requesting</span>
              <span className="font-mono text-base font-bold text-[#111111]">{restockDemand.uniqueCustomers}</span>
            </div>
            <div>
              <span className="text-[#6B6B6B] text-[10px] uppercase font-bold block">Units Requested</span>
              <span className="font-mono text-base font-bold text-[#B86E00]">{restockDemand.totalRequestedUnits}</span>
            </div>
            <div>
              <span className="text-[#6B6B6B] text-[10px] uppercase font-bold block">Pending Requests</span>
              <span className="font-mono text-base font-bold text-[#111111]">{restockDemand.pendingRequestsCount}</span>
            </div>
            <div>
              <span className="text-[#6B6B6B] text-[10px] uppercase font-bold block">Fulfilled Requests</span>
              <span className="font-mono text-base font-bold text-[#2E6B44]">{restockDemand.fulfilledRequestsCount}</span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-[#E5E5E2] p-6 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="font-semibold uppercase text-[#6B6B6B]">Product Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold uppercase text-[#6B6B6B]">Product Category *</label>
            {categories.length > 0 ? (
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-semibold text-[#111111] focus:border-[#111111] focus:outline-none"
              >
                <option value="">Select Category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.slug})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#6B6B6B]">
                Unassigned / Default
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="font-semibold uppercase text-[#6B6B6B]">Brand / Studio *</label>
            <input
              type="text"
              required
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2 bg-[#F7F7F5] border border-[#E5E5E2] p-4">
          <label className="font-semibold uppercase text-[#6B6B6B] block">Product Type Selection *</label>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setIsClothing(false)}
              className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border transition-all ${
                !isClothing
                  ? "bg-[#111111] text-white border-[#111111]"
                  : "bg-white text-[#6B6B6B] border-[#E5E5E2] hover:border-[#111111]"
              }`}
            >
              Standard Product
            </button>

            <button
              type="button"
              onClick={() => setIsClothing(true)}
              className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border transition-all ${
                isClothing
                  ? "bg-[#111111] text-white border-[#111111]"
                  : "bg-white text-[#6B6B6B] border-[#E5E5E2] hover:border-[#111111]"
              }`}
            >
              Clothing / Size Variants
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-semibold uppercase text-[#6B6B6B]">Selling Price (₹) *</label>
            <input
              type="number"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-[#111111] focus:border-[#111111] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold uppercase text-[#6B6B6B]">Compare-at Price (₹)</label>
            <input
              type="number"
              value={form.compareAtPrice || ""}
              onChange={(e) => setForm({ ...form, compareAtPrice: Number(e.target.value) })}
              className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-[#111111] focus:border-[#111111] focus:outline-none"
            />
          </div>
        </div>

        {/* Conditional Inventory Configuration */}
        {isClothing ? (
          <div className="space-y-4 bg-white border border-[#E5E5E2] p-5">
            <div>
              <h4 className="font-bold uppercase tracking-wider text-[#111111] text-xs">
                Clothing Size Inventory Breakdown
              </h4>
              <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                Configure available sizes and stock per size variant. Total stock will be automatically calculated.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {sizeConfig.map((item, idx) => (
                <div
                  key={item.size}
                  className={`p-3 border space-y-2 transition-all ${
                    item.enabled ? "bg-white border-[#111111]" : "bg-[#F7F7F5] border-[#E5E5E2] opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="font-bold font-mono text-sm text-[#111111] flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) => {
                          const updated = [...sizeConfig];
                          updated[idx].enabled = e.target.checked;
                          setSizeConfig(updated);
                        }}
                        className="accent-[#111111]"
                      />
                      <span>{item.size}</span>
                    </label>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-semibold text-[#6B6B6B] block">Stock</span>
                    <input
                      type="number"
                      min={0}
                      disabled={!item.enabled}
                      value={item.stock}
                      onChange={(e) => {
                        const updated = [...sizeConfig];
                        updated[idx].stock = Math.max(0, Number(e.target.value) || 0);
                        setSizeConfig(updated);
                      }}
                      className="w-full p-2 bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-xs focus:border-[#111111] focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Size Addition */}
            <div className="pt-3 border-t border-[#E5E5E2] flex items-center space-x-3">
              <input
                type="text"
                value={customSizeInput}
                onChange={(e) => setCustomSizeInput(e.target.value)}
                placeholder="Custom size label (e.g. 3XL)"
                className="p-2 border border-[#E5E5E2] font-mono text-xs uppercase focus:border-[#111111] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomSize}
                className="px-4 py-2 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black"
              >
                + Add Size
              </button>
            </div>

            <div className="pt-2 text-xs font-mono font-semibold text-[#111111]">
              Total Calculated Stock:{" "}
              <span className="text-base font-bold">
                {sizeConfig.filter((s) => s.enabled).reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0)}
              </span>{" "}
              units
            </div>
          </div>
        ) : (
          <div className="space-y-1 sm:w-1/3">
            <label className="font-semibold uppercase text-[#6B6B6B]">Available Inventory Stock *</label>
            <input
              type="number"
              required
              value={form.stockQuantity}
              onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
              className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-[#111111] focus:border-[#111111] focus:outline-none font-bold"
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="font-semibold uppercase text-[#6B6B6B]">Short Description</label>
          <input
            type="text"
            required
            value={form.shortDescription}
            onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
            className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold uppercase text-[#6B6B6B]">Full Story & Specs</label>
          <textarea
            rows={4}
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#111111] focus:border-[#111111] focus:outline-none"
          />
        </div>

        {/* Image URLs Section */}
        <div className="space-y-4 pt-4 border-t border-[#E5E5E2]">
          <h3 className="font-semibold uppercase text-[#111111] flex items-center">
            <ImageIcon className="w-4 h-4 mr-1.5" /> Product Images
          </h3>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-[#6B6B6B]">Primary Image URL *</label>
              <input
                type="url"
                required
                value={form.images[0] || ""}
                onChange={(e) => {
                  const updated = [...form.images];
                  updated[0] = e.target.value;
                  setForm({ ...form, images: updated });
                }}
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-[11px] text-[#111111] focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-[#6B6B6B]">Secondary / Gallery Image URL</label>
              <input
                type="url"
                value={form.images[1] || ""}
                onChange={(e) => {
                  const updated = [...form.images];
                  updated[1] = e.target.value;
                  setForm({ ...form, images: updated });
                }}
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-[11px] text-[#111111] focus:border-[#111111] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E5E5E2] flex justify-end space-x-3">
          <Link
            href="/admin/products"
            className="px-6 py-3 border border-[#E5E5E2] text-[#6B6B6B] hover:text-[#111111] font-semibold uppercase tracking-wider"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-[#111111] text-white font-semibold uppercase tracking-wider hover:bg-black disabled:opacity-50 transition-colors flex items-center"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            <span>Update Product & Inventory</span>
          </button>
        </div>
      </form>
    </div>
  );
}
