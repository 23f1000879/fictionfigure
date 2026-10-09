"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, Plus, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { ProductImageManager } from "@/components/admin/ProductImageManager";
import { API_BASE, adminFetch } from "@/lib/api";

export interface VariantFormItem {
  id?: string;
  title: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  imageUrl?: string;
  enabled?: boolean;
}

export default function AdminNewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  // Synchronous lock: state updates are async, so a fast double click could otherwise submit twice.
  const submitLock = useRef(false);
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
    images: [] as string[],
  });

  const [productType, setProductType] = useState<"simple" | "variants">("simple");
  const [variants, setVariants] = useState<VariantFormItem[]>([]);
  const [uploadingVariantIdx, setUploadingVariantIdx] = useState<number | null>(null);

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

  const handleAddVariant = () => {
    const count = variants.length + 1;
    const defaultSku = form.sku ? `${form.sku}-V${count}` : `VAR-${count}`;
    setVariants((prev) => [
      ...prev,
      {
        title: "",
        sku: defaultSku,
        price: form.price || 0,
        compareAtPrice: form.compareAtPrice || 0,
        stock: 5,
        imageUrl: "",
        enabled: true,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleVariantChange = (index: number, field: keyof VariantFormItem, value: any) => {
    setVariants((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVariantIdx(index);
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
        handleVariantChange(index, "imageUrl", data.url);
      }
    } catch (err: any) {
      setError("Failed to upload variant image.");
    } finally {
      setUploadingVariantIdx(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isImageUploading || submitLock.current) return;

    if (!form.categoryId) {
      setError("A category selection is required to publish a product.");
      return;
    }

    if (productType === "variants" && variants.length === 0) {
      setError("Please add at least one product variant or switch to Simple Product mode.");
      return;
    }

    if (productType === "variants") {
      for (const v of variants) {
        if (!v.title.trim()) {
          setError("All variants must have a Variant Name (e.g., Naruto, Sage Mode, Red Edition, S).");
          return;
        }
        if (!v.sku.trim()) {
          setError("All variants must have a unique SKU code.");
          return;
        }
      }
    }

    const validImages = form.images.filter(Boolean);
    if (validImages.length === 0) {
      setError("Add at least one product image. The first image becomes the cover.");
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);
    setError("");
    setSlugError("");

    try {

      const isVariantMode = productType === "variants";
      const totalStock = isVariantMode
        ? variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0)
        : Number(form.stockQuantity) || 0;

      const res = await adminFetch(`${API_BASE}/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          stockQuantity: totalStock,
          hasVariants: isVariantMode,
          productType,
          variants: isVariantMode ? variants : [],
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
      submitLock.current = false; // stays locked after success while navigating away
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
            <span>A Category is required to publish products, but no categories exist in your database yet.</span>
          </div>
          <Link
            href="/admin/categories"
            className="px-3 py-1.5 bg-[#A83232] text-white text-[11px] font-semibold uppercase tracking-wider"
          >
            Create Category First
          </Link>
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-[#E5E5E2] p-6 text-xs">
        {/* Section 1: General Product Information */}
        <div className="space-y-4">
          <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2 font-mono">
            1. General Product Information
          </h3>

          <div className="space-y-1">
            <label className="font-semibold uppercase text-[#6B6B6B]">Product Title / Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={handleNameChange}
              placeholder="e.g. Naruto Uzumaki Sage Mode Figure"
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
                placeholder="naruto-uzumaki-sage-mode-figure"
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
                <div className="p-3 bg-[#F7F7F5] border border-[#E5E5E2] text-[#6B6B6B]">Loading categories...</div>
              ) : (
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
              )}
            </div>

            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">Brand / Studio *</label>
              <input
                type="text"
                required
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="e.g. Bandai Spirits"
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold uppercase text-[#6B6B6B]">Short Description</label>
            <input
              type="text"
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              placeholder="e.g. Highly detailed scale statue of Naruto Uzumaki with interchangeable heads."
              className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
            />
          </div>
        </div>

        {/* Section 2: Product Type & Variant System */}
        <div className="space-y-4 pt-4 border-t border-[#E5E5E2]">
          <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2 font-mono">
            2. Product Type & Variants
          </h3>

          <div className="space-y-2 bg-[#F7F7F5] border border-[#E5E5E2] p-4">
            <label className="font-semibold uppercase text-[#6B6B6B] block">Product Type Selection *</label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => {
                  if (productType === "variants" && variants.length > 0) {
                    if (!window.confirm("Switching to Simple Product mode will disable variant breakdown. Continue?")) return;
                  }
                  setProductType("simple");
                }}
                className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border transition-all ${
                  productType === "simple"
                    ? "bg-[#111111] text-white border-[#111111]"
                    : "bg-white text-[#6B6B6B] border-[#E5E5E2] hover:border-[#111111]"
                }`}
              >
                Simple Product
              </button>

              <button
                type="button"
                onClick={() => {
                  setProductType("variants");
                  if (variants.length === 0) handleAddVariant();
                }}
                className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border transition-all ${
                  productType === "variants"
                    ? "bg-[#111111] text-white border-[#111111]"
                    : "bg-white text-[#6B6B6B] border-[#E5E5E2] hover:border-[#111111]"
                }`}
              >
                Product With Variants
              </button>
            </div>
          </div>

          {/* Simple Product Fields */}
          {productType === "simple" ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white border border-[#E5E5E2] p-4">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B]">Selling Price (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={form.price || ""}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  placeholder="499"
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
                  placeholder="699"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B]">Master SKU Code *</label>
                <input
                  type="text"
                  required
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="FF-NARUTO-01"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B]">Inventory Quantity *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={form.stockQuantity}
                  onChange={(e) => setForm({ ...form, stockQuantity: Math.max(0, Number(e.target.value) || 0) })}
                  placeholder="10"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
                />
              </div>
            </div>
          ) : (
            /* Generic Product Variant Builder */
            <div className="space-y-4 bg-white border border-[#E5E5E2] p-5">
              <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-3">
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-[#111111] text-xs font-mono">
                    Product Variant Configuration
                  </h4>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                    Define custom variants (e.g. Naruto, Sasuke, Sage Mode, Red Edition, 10cm, Set of 3, or S/M/L) with individual pricing, SKUs, and stock.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="px-4 py-2 bg-[#111111] hover:bg-[#2A2A2A] text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Variant</span>
                </button>
              </div>

              <div className="space-y-4">
                {variants.map((variant, idx) => (
                  <div key={idx} className="p-4 border border-[#E5E5E2] bg-[#FAFAFA] space-y-3 relative">
                    <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-2">
                      <span className="text-xs font-mono font-bold text-[#111111]">
                        VARIANT #{idx + 1}
                      </span>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="text-[#A83232] hover:text-[#852727] text-xs font-mono font-bold flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-mono font-bold uppercase text-[#6B6B6B] block">
                          Variant Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={variant.title}
                          onChange={(e) => handleVariantChange(idx, "title", e.target.value)}
                          placeholder="e.g. Naruto, Sasuke, Sage Mode, Red Edition"
                          className="w-full p-2.5 bg-white border border-[#E5E5E2] font-mono text-xs focus:border-[#111111] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold uppercase text-[#6B6B6B] block">
                          SKU *
                        </label>
                        <input
                          type="text"
                          required
                          value={variant.sku}
                          onChange={(e) => handleVariantChange(idx, "sku", e.target.value)}
                          placeholder="NAR-SAGE-01"
                          className="w-full p-2.5 bg-white border border-[#E5E5E2] font-mono text-xs focus:border-[#111111] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold uppercase text-[#6B6B6B] block">
                          Selling Price (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={variant.price || ""}
                          onChange={(e) => handleVariantChange(idx, "price", Number(e.target.value))}
                          placeholder="499"
                          className="w-full p-2.5 bg-white border border-[#E5E5E2] font-mono text-xs focus:border-[#111111] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold uppercase text-[#6B6B6B] block">
                          Stock Quantity *
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={variant.stock}
                          onChange={(e) => handleVariantChange(idx, "stock", Math.max(0, Number(e.target.value) || 0))}
                          placeholder="10"
                          className="w-full p-2.5 bg-white border border-[#E5E5E2] font-mono text-xs focus:border-[#111111] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 pt-2 border-t border-[#E5E5E2]">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#6B6B6B]">Variant Image:</span>
                      {variant.imageUrl ? (
                        <div className="flex items-center space-x-2">
                          <img src={variant.imageUrl} alt="Variant preview" className="w-8 h-8 object-cover border" />
                          <button
                            type="button"
                            onClick={() => handleVariantChange(idx, "imageUrl", "")}
                            className="text-[10px] font-mono text-[#A83232] underline"
                          >
                            Remove Image
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer text-[11px] font-mono text-[#111111] underline hover:text-[#D4AF37] flex items-center space-x-1">
                          <Upload className="w-3 h-3" />
                          <span>{uploadingVariantIdx === idx ? "Uploading..." : "Upload Variant Image"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleVariantImageUpload(e, idx)}
                            disabled={uploadingVariantIdx === idx}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#E5E5E2] flex items-center justify-between text-xs font-mono">
                <span>Total Calculated Stock: <strong className="text-base text-[#111111]">{variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0)}</strong> units</span>
                <span>{variants.length} Active Variant(s)</span>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Product Photography */}
        <div className="space-y-4 pt-4 border-t border-[#E5E5E2]">
          <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2 font-mono">
            3. Product Images
          </h3>
          <ProductImageManager
            value={form.images}
            onChange={(urls) => setForm((prev) => ({ ...prev, images: urls }))}
            onBusyChange={setIsImageUploading}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-[#E5E5E2] flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || isImageUploading}
            className="px-8 py-3 bg-[#111111] hover:bg-[#2A2A2A] text-white font-bold uppercase tracking-wider font-mono text-xs flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{isSubmitting ? "Publishing Product..." : "Publish Product"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
