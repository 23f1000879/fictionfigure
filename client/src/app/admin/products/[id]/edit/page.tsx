"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Plus, Trash2, Upload, AlertCircle, Image as ImageIcon } from "lucide-react";
import { ProductImageUploader } from "@/components/admin/ProductImageUploader";
import { API_BASE, adminFetch } from "@/lib/api";
import { VariantFormItem } from "../../new/page";

export default function AdminEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    brand: "",
    categoryId: "",
    price: 0,
    compareAtPrice: 0,
    shortDescription: "",
    description: "",
    stockQuantity: 0,
    material: "",
    scale: "",
    franchise: "",
    whatsIncluded: "",
    images: ["", ""],
  });

  const [productType, setProductType] = useState<"simple" | "variants">("simple");
  const [variants, setVariants] = useState<VariantFormItem[]>([]);
  const [uploadingVariantIdx, setUploadingVariantIdx] = useState<number | null>(null);

  useEffect(() => {
    adminFetch(`${API_BASE}/admin/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (productId) {
      adminFetch(`${API_BASE}/products?limit=100`)
        .then((res) => res.json())
        .then((data) => {
          const found = (data.products || []).find((p: any) => p.id === productId || p.slug === productId);
          if (found) {
            const hasVariantMode = Boolean(
              found.isClothing ||
              (Array.isArray(found.variants) &&
                (found.variants.length > 1 ||
                  (found.variants.length === 1 &&
                    found.variants[0].title !== "Standard Edition" &&
                    found.variants[0].title !== "Standard")))
            );

            setProductType(hasVariantMode ? "variants" : "simple");

            if (Array.isArray(found.variants) && found.variants.length > 0) {
              const mapped = found.variants.map((v: any) => ({
                id: v.id,
                title: v.title || "",
                sku: v.sku || "",
                price: v.price || found.price || 0,
                compareAtPrice: v.compareAtPrice || found.compareAtPrice || 0,
                stock: v.inventoryCount !== undefined ? v.inventoryCount : 0,
                imageUrl: v.imageUrl || "",
                enabled: true,
              }));
              setVariants(mapped);
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
              material: found.material || "",
              scale: found.scale || "",
              franchise: found.franchise || "",
              whatsIncluded: found.whatsIncluded || "",
              images: [
                found.images?.[0]?.url || "",
                found.images?.[1]?.url || "",
              ].filter(Boolean),
            });
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [productId]);

  const handleAddVariant = () => {
    const count = variants.length + 1;
    const defaultSku = `VAR-${count}`;
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
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const isVariantMode = productType === "variants";
      if (isVariantMode && variants.length === 0) {
        throw new Error("Please add at least one product variant or switch to Simple Product mode.");
      }

      if (isVariantMode) {
        for (const v of variants) {
          if (!v.title.trim()) {
            throw new Error("All variants must have a Variant Name.");
          }
          if (!v.sku.trim()) {
            throw new Error("All variants must have a SKU code.");
          }
        }
      }

      const totalStock = isVariantMode
        ? variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0)
        : Number(form.stockQuantity) || 0;

      const validImages = form.images.filter(Boolean);

      const res = await adminFetch(`${API_BASE}/admin/products/${productId}`, {
        method: "PATCH",
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
        throw new Error(data.error || "Failed to update product");
      }

      setMessage("Product and variant configuration saved successfully!");
      setTimeout(() => router.push("/admin/products"), 1200);
    } catch (err: any) {
      setError(err.message || "Failed to save product edits");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-xs font-mono text-[#6B6B6B] flex flex-col items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin mb-3 text-[#111111]" />
        <span>Loading Product Record & Variant Catalog...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-[#111111] pb-16">
      <div className="flex items-center space-x-3 border-b border-[#E5E5E2] pb-4">
        <Link href="/admin/products" className="p-2 border border-[#E5E5E2] hover:border-[#111111]">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Catalog Management
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">
            Edit Collectible Product
          </h1>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-[#2E6B44]/10 border border-[#2E6B44] text-[#2E6B44] text-xs font-semibold uppercase">
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold uppercase">
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
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none font-semibold text-[#111111]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">Product Category *</label>
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
            </div>

            <div className="space-y-1">
              <label className="font-semibold uppercase text-[#6B6B6B]">Brand / Studio *</label>
              <input
                type="text"
                required
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Product Type & Variants */}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white border border-[#E5E5E2] p-4">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B]">Selling Price (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={form.price || ""}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
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
                    Manage custom variants (e.g., Naruto, Sasuke, Sage Mode, Red Edition, 10cm, Set of 3, or S/M/L).
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
                          placeholder="e.g. Naruto, Sasuke, Red Edition"
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
            3. Product Imagery
          </h3>
          <ProductImageUploader
            label="Primary Product Photography Image"
            value={form.images[0] || ""}
            onChange={(url) => setForm((prev) => ({ ...prev, images: [url, prev.images[1] || ""] }))}
            onUploadingChange={setIsImageUploading}
            required
          />
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-[#E5E5E2] flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || isImageUploading}
            className="px-8 py-3 bg-[#111111] hover:bg-[#2A2A2A] text-white font-bold uppercase tracking-wider font-mono text-xs flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSubmitting ? "Saving Changes..." : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
