"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, Save, Image as ImageIcon } from "lucide-react";

export default function AdminEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    brand: "",
    price: 15000,
    compareAtPrice: 18000,
    shortDescription: "",
    description: "",
    stockQuantity: 10,
    images: ["", ""],
  });

  useEffect(() => {
    if (productId) {
      fetch("http://localhost:5000/api/products?limit=100")
        .then((res) => res.json())
        .then((data) => {
          const found = (data.products || []).find((p: any) => p.id === productId || p.slug === productId);
          if (found) {
            setForm({
              name: found.name || "",
              brand: found.brand || "",
              price: found.price || 0,
              compareAtPrice: found.compareAtPrice || 0,
              shortDescription: found.shortDescription || "",
              description: found.description || "",
              stockQuantity: found.variants?.[0]?.inventoryCount || 10,
              images: [
                found.images?.[0]?.url || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
                found.images?.[1]?.url || "https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80",
              ],
            });
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`http://localhost:5000/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
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

      <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-[#E5E5E2] p-6 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          <div className="space-y-1">
            <label className="font-semibold uppercase text-[#6B6B6B]">Available Inventory Stock *</label>
            <input
              type="number"
              required
              value={form.stockQuantity}
              onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
              className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-[#111111] focus:border-[#111111] focus:outline-none font-bold"
            />
          </div>
        </div>

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
