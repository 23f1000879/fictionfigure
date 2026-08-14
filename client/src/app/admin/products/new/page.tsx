"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, PlusCircle } from "lucide-react";
import { ProductImageUploader } from "@/components/admin/ProductImageUploader";
import { API_BASE, adminFetch } from "@/lib/api";

export default function AdminNewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [slugError, setSlugError] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    brand: "",
    categoryId: "",
    shortDescription: "",
    description: "",
    price: 0,
    compareAtPrice: 0,
    sku: "",
    stockQuantity: 0,
    material: "",
    scale: "",
    franchise: "",
    whatsIncluded: "",
    images: ["", ""],
  });

  useEffect(() => {
    adminFetch(`${API_BASE}/admin/categories`)
      .then((res) => res.json())
      .then((data) => {
        const catList = data.categories || [];
        setCategories(catList);
        if (catList.length > 0) {
          setForm((prev) => ({ ...prev, categoryId: catList[0].id }));
        }
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const autoSku = val ? `FF-${val.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}` : "";

    setForm((prev) => {
      const generatedSlug = !isSlugManuallyEdited
        ? val.toLowerCase().replace(/[^\w ]+/g, "").replace(/ +/g, "-")
        : prev.slug;
      return {
        ...prev,
        name: val,
        slug: generatedSlug,
        sku: autoSku,
      };
    });
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallyEdited(true);
    setSlugError("");
    setForm((prev) => ({ ...prev, slug: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isImageUploading) return;

    if (!form.categoryId) {
      setError("A category selection is required to publish a product. Please create a category first.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSlugError("");

    try {
      const validImages = form.images.filter(Boolean);
      if (validImages.length === 0) {
        throw new Error("Please upload or provide at least one Primary Product Image.");
      }

      const res = await adminFetch(`${API_BASE}/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          images: validImages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && (data.field === "slug" || data.error?.toLowerCase().includes("slug"))) {
          setSlugError("This URL slug is already in use. Please choose a different slug.");
          throw new Error("A product with this URL slug already exists.");
        }
        throw new Error(data.error || "Failed to create product");
      }

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

      {!loadingCategories && categories.length === 0 && (
        <div className="p-4 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              A Category is required to publish products, but no categories exist in your database yet.
            </span>
          </div>
          <Link
            href="/admin/categories"
            className="px-3 py-1.5 bg-[#A83232] text-white hover:bg-[#852727] text-[11px] font-semibold uppercase tracking-wider flex items-center space-x-1"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1" />
            <span>Create Category First</span>
          </Link>
        </div>
      )}

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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">URL Slug *</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={handleSlugChange}
                placeholder="shadow-monarch-1-6-scale-statue"
                className={`w-full p-3 bg-[#F7F7F5] border ${
                  slugError ? "border-[#A83232]" : "border-[#E5E5E2]"
                } font-mono focus:border-[#111111] focus:outline-none`}
              />
              {slugError && (
                <p className="text-[11px] font-semibold text-[#A83232] mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" /> {slugError}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">Product Category *</label>
              {loadingCategories ? (
                <div className="p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#6B6B6B]">
                  Loading categories...
                </div>
              ) : categories.length > 0 ? (
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none font-semibold text-[#111111]"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.slug})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] font-semibold">
                  No category available. Please create one at /admin/categories.
                </div>
              )}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">Material</label>
              <input
                type="text"
                value={form.material}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
                placeholder="e.g. Polystone Resin & PVC"
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">Scale / Ratio</label>
              <input
                type="text"
                value={form.scale}
                onChange={(e) => setForm({ ...form, scale: e.target.value })}
                placeholder="e.g. 1/6 Scale"
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">Franchise / Series</label>
              <input
                type="text"
                value={form.franchise}
                onChange={(e) => setForm({ ...form, franchise: e.target.value })}
                placeholder="e.g. Solo Leveling"
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold uppercase text-[#6B6B6B]">What's Included (Box Contents)</label>
            <textarea
              rows={3}
              value={form.whatsIncluded}
              onChange={(e) => setForm({ ...form, whatsIncluded: e.target.value })}
              placeholder="List items separated by newlines or commas (e.g., 1x Main Statue Body&#10;1x Custom Base&#10;1x Certificate of Authenticity)"
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
