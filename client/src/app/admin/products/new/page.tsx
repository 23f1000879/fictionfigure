"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ProductImageUploader } from "@/components/admin/ProductImageUploader";
import { API_BASE } from "@/lib/api";

export default function AdminNewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    brand: "",
    shortDescription: "",
    description: "",
    price: 0,
    compareAtPrice: 0,
    sku: "",
    stockQuantity: 0,
    material: "",
    scale: "",
    franchise: "",
    images: ["", ""],
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const generatedSlug = val.toLowerCase().replace(/[^\w ]+/g, "").replace(/ +/g, "-");
    const autoSku = val ? `FF-${val.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}` : "";

    setForm((prev) => ({
      ...prev,
      name: val,
      slug: generatedSlug,
      sku: autoSku,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isImageUploading) return;

    setIsSubmitting(true);
    setError("");

    try {
      const validImages = form.images.filter(Boolean);
      if (validImages.length === 0) {
        throw new Error("Please upload or provide at least one Primary Product Image.");
      }

      const res = await fetch(`${API_BASE}/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          images: validImages,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");

      router.push("/admin/products");
    } catch (err: any) {
      setError(err.message || "Something went wrong while creating figure");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-[#111111]">
      <div className="flex items-center space-x-3 border-b border-[#E5E5E2] pb-4">
        <Link href="/admin/products" className="p-2 border border-[#E5E5E2] hover:border-[#111111]">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Catalog Management
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">
            Add New Collectible Product
          </h1>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-[#E5E5E2] p-6 text-xs">
        <div className="space-y-4">
          <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2">
            1. General Product Information
          </h3>

          <div className="space-y-1">
            <label className="font-semibold uppercase text-[#6B6B6B]">Product Title / Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={handleNameChange}
              placeholder="e.g. Shadow Monarch 1/6 Scale Statue"
              className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">URL Slug *</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="shadow-monarch-1-6-scale-statue"
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">Brand / Manufacturer *</label>
              <input
                type="text"
                required
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="e.g. AetherArts Studio"
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold uppercase text-[#6B6B6B]">Short Teaser Description</label>
            <input
              type="text"
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              placeholder="e.g. Limited edition 1/6 scale polystone resin figure with illuminated LED base."
              className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold uppercase text-[#6B6B6B]">Full Detailed Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Provide complete sculpting details, materials, scale specifications..."
              className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-[#E5E5E2]">
          <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2">
            2. Pricing, SKU & Inventory
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">Selling Price (₹) *</label>
              <input
                type="number"
                required
                min={0}
                value={form.price || ""}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                placeholder="0"
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">Compare-at Price (₹)</label>
              <input
                type="number"
                min={0}
                value={form.compareAtPrice || ""}
                onChange={(e) => setForm({ ...form, compareAtPrice: Number(e.target.value) })}
                placeholder="0"
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">Stock Quantity *</label>
              <input
                type="number"
                required
                min={0}
                value={form.stockQuantity || ""}
                onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
                placeholder="0"
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">SKU Code *</label>
              <input
                type="text"
                required
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="e.g. FF-SHADOW-01"
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. PRODUCT IMAGES UPLOAD SECTION */}
        <div className="space-y-6 pt-4 border-t border-[#E5E5E2]">
          <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2">
            3. Product Images
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ProductImageUploader
              label="PRIMARY IMAGE"
              required={true}
              value={form.images[0]}
              onUploadingChange={setIsImageUploading}
              onChange={(url) => {
                const updated = [...form.images];
                updated[0] = url;
                setForm({ ...form, images: updated });
              }}
            />

            <ProductImageUploader
              label="SECONDARY VIEW IMAGE"
              required={false}
              value={form.images[1]}
              onUploadingChange={setIsImageUploading}
              onChange={(url) => {
                const updated = [...form.images];
                updated[1] = url;
                setForm({ ...form, images: updated });
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isImageUploading}
          className="w-full py-4 bg-[#111111] text-white font-semibold uppercase tracking-widest hover:bg-black disabled:opacity-40 transition-colors flex items-center justify-center space-x-2"
        >
          {isSubmitting || isImageUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span>Publish Figure to Store Catalog</span>
          )}
        </button>
      </form>
    </div>
  );
}
