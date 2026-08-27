"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Edit2, Loader2, Package, ArrowUpRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { API_BASE, adminFetch } from "@/lib/api";

export default function AdminCategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params?.id as string;

  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCategoryDetail = () => {
    if (!categoryId) return;
    setLoading(true);
    adminFetch(`${API_BASE}/admin/categories/${categoryId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.category) setCategory(data.category);
        else setError("Category not found");
      })
      .catch((err: any) => setError(err.message || "Failed to fetch category detail"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategoryDetail();
  }, [categoryId]);

  const handleRemoveProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to remove this product from this category?")) return;

    try {
      const res = await adminFetch(
        `${API_BASE}/admin/categories/${categoryId}/products/${productId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to remove product from category");
      fetchCategoryDetail();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#6B6B6B]">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Loading category details...
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="p-6 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold">
        {error || "Category not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl text-[#111111]">
      <div className="flex items-center space-x-3 border-b border-[#E5E5E2] pb-4">
        <Link href="/admin/categories" className="p-2 border border-[#E5E5E2] hover:border-[#111111]">
          <ArrowLeft className="w-4 h-4 text-[#111111]" />
        </Link>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Category Management
          </span>
          <h1 className="text-xl font-semibold text-[#111111] tracking-tight">
            {category.name} ({category.products?.length || 0} Products)
          </h1>
        </div>
      </div>

      {/* Category Metadata Box */}
      <div className="bg-white border border-[#E5E5E2] p-6 space-y-3 text-xs">
        <h3 className="font-semibold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E2] pb-2">
          Category Overview & Metadata
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-[#6B6B6B] uppercase block text-[10px]">URL Slug</span>
            <span className="font-mono font-semibold text-[#111111]">{category.slug}</span>
          </div>
          <div>
            <span className="text-[#6B6B6B] uppercase block text-[10px]">Description</span>
            <span className="text-[#111111]">{category.description || "No description assigned"}</span>
          </div>
          <div>
            <span className="text-[#6B6B6B] uppercase block text-[10px]">Total Products</span>
            <span className="font-mono font-bold text-[#111111]">{category.products?.length || 0} Products</span>
          </div>
        </div>
      </div>

      {/* Products in Category */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
            Products Assigned to {category.name}
          </h2>
          <Link
            href="/admin/products/new"
            className="px-3 py-1.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black transition-colors flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </Link>
        </div>

        {category.products?.length === 0 ? (
          <div className="p-8 text-center bg-white border border-[#E5E5E2] space-y-2 text-xs">
            <Package className="w-6 h-6 text-[#6B6B6B] mx-auto opacity-40" />
            <p className="text-[#6B6B6B]">No products currently assigned to this category.</p>
          </div>
        ) : (
          <>
          <div className="hidden md:block bg-white border border-[#E5E5E2] overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F7F7F5] border-b border-[#E5E5E2] uppercase font-semibold text-[#6B6B6B]">
                  <th className="p-4">Product Name</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E2]">
                {category.products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-[#F7F7F5]">
                    <td className="p-4 font-semibold text-[#111111]">{p.name}</td>
                    <td className="p-4 font-mono text-[#6B6B6B]">{p.sku}</td>
                    <td className="p-4 font-mono font-semibold text-[#111111]">{formatPrice(p.price)}</td>
                    <td className="p-4 font-mono font-bold text-[#111111]">
                      {p.variants?.[0]?.inventoryCount ?? 0} units
                    </td>
                    <td className="p-4">
                      <span className="bg-[#2E6B44] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="px-2.5 py-1.5 border border-[#E5E5E2] hover:border-[#111111] text-[11px] font-semibold uppercase tracking-wider inline-flex items-center"
                      >
                        <Edit2 className="w-3 h-3 mr-1" /> Edit
                      </Link>
                      <button
                        onClick={() => handleRemoveProduct(p.id)}
                        className="px-2.5 py-1.5 border border-[#A83232]/30 hover:border-[#A83232] text-[#A83232] text-[11px] font-semibold uppercase tracking-wider inline-flex items-center"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="md:hidden space-y-4">
            {category.products.map((p: any) => (
              <div key={p.id} className="bg-white border border-[#E5E5E2] p-4 space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-xs text-[#111111] break-words">{p.name}</h4>
                    <span className="text-[10px] text-[#6B6B6B] block">SKU: <span className="font-mono">{p.sku}</span></span>
                  </div>
                  <span className="bg-[#2E6B44] text-white text-[9px] uppercase font-bold tracking-wider px-2 py-0.5">
                    {p.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 py-2 border-y border-[#F7F7F5] text-[11px]">
                  <div>
                    <span className="text-[#6B6B6B] block text-[9px] uppercase font-semibold">Price</span>
                    <span className="font-mono font-semibold text-[#111111]">{formatPrice(p.price)}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block text-[9px] uppercase font-semibold">Stock</span>
                    <span className="font-mono font-bold text-[#111111]">{p.variants?.[0]?.inventoryCount ?? 0} units</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-1">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="px-2.5 py-1.5 border border-[#E5E5E2] hover:border-[#111111] text-[11px] font-semibold uppercase tracking-wider inline-flex items-center min-h-[38px] sm:min-h-[44px]"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                  </Link>
                  <button
                    onClick={() => handleRemoveProduct(p.id)}
                    className="px-2.5 py-1.5 border border-[#A83232]/30 hover:border-[#A83232] text-[#A83232] text-[11px] font-semibold uppercase tracking-wider inline-flex items-center min-h-[38px] sm:min-h-[44px]"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
