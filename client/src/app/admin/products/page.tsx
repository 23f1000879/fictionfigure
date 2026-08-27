"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { Plus, Loader2, ExternalLink, Edit, Copy, Trash2, CheckCircle2, AlertCircle, Package, Bell } from "lucide-react";
import { API_BASE, adminFetch } from "@/lib/api";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const fetchCatalog = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [prodRes, catRes] = await Promise.all([
        adminFetch(`${API_BASE}/admin/products`),
        adminFetch(`${API_BASE}/admin/categories`),
      ]);

      const prodData = await prodRes.json();
      const catData = await catRes.json();

      setProducts(prodData.products || []);
      setCategories(catData.categories || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleDuplicate = async (p: any) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await adminFetch(`${API_BASE}/admin/products/${p.id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to duplicate product");

      setSuccessMsg(`Duplicated "${p.name}" successfully as DRAFT.`);
      fetchCatalog();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to duplicate product");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await adminFetch(`${API_BASE}/admin/products/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete product");

      if (data.archived) {
        setSuccessMsg(`Product has sales history. Status changed to ARCHIVED.`);
      } else {
        setSuccessMsg(`Product deleted successfully.`);
      }

      setDeleteTarget(null);
      fetchCatalog();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete product");
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === "ALL") return true;
    return p.categoryId === selectedCategory;
  });

  return (
    <div className="space-y-6 text-[#111111]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[#E5E5E2] pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Catalog Management
          </span>
          <h1 className="text-2xl font-semibold text-[#111111] tracking-tight">
            Products ({filteredProducts.length})
          </h1>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 bg-white border border-[#E5E5E2] text-xs focus:border-[#111111] focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black transition-colors flex items-center shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add New Figure
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-[#2E6B44]/10 border border-[#2E6B44] text-[#2E6B44] text-xs font-semibold flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-[#6B6B6B]">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Loading catalog...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E5E5E2] space-y-2 text-xs">
          <Package className="w-6 h-6 text-[#6B6B6B] mx-auto opacity-40" />
          <p className="text-[#6B6B6B]">No products found in catalog.</p>
        </div>
      ) : (
        <>
        <div className="hidden md:block bg-white border border-[#E5E5E2] overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F7F5] border-b border-[#E5E5E2] uppercase font-semibold text-[#6B6B6B]">
                <th className="p-4">Product</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E2]">
              {filteredProducts.map((p) => {
                const stock = p.variants?.[0]?.inventoryCount ?? 0;
                let statusBadge = "bg-[#2E6B44] text-white";
                if (p.status === "DRAFT") statusBadge = "bg-[#6B6B6B] text-white";
                else if (p.status === "ARCHIVED") statusBadge = "bg-black text-white";
                else if (stock === 0) statusBadge = "bg-[#A83232] text-white";

                return (
                  <tr key={p.id} className="hover:bg-[#F7F7F5]">
                    <td className="p-4 flex items-center space-x-3">
                      <div className="relative w-10 h-10 bg-[#F0F0ED] shrink-0 border border-[#E5E5E2] overflow-hidden">
                        {p.images?.[0]?.url && <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">{p.brand || "FictionFigure"}</span>
                        <h4 className="font-semibold text-[#111111]">{p.name}</h4>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-[#6B6B6B]">{p.sku}</td>
                    <td className="p-4 text-[#6B6B6B]">{p.category?.name || "Uncategorized"}</td>
                    <td className="p-4 font-mono font-semibold text-[#111111]">{formatPrice(p.price)}</td>
                    <td className="p-4 font-mono font-bold text-[#111111]">{stock} units</td>
                    <td className="p-4">
                      {stock === 0 ? (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#A83232] text-white inline-block">
                            OUT OF STOCK
                          </span>
                          <Link
                            href="/admin/restock-requests"
                            className="text-[10px] font-bold text-[#B86E00] hover:underline flex items-center"
                          >
                            <Bell className="w-3 h-3 mr-1" /> VIEW DEMAND
                          </Link>
                        </div>
                      ) : (
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 ${statusBadge}`}>
                          {p.status}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="px-2 py-1 border border-[#E5E5E2] hover:border-[#111111] text-[#6B6B6B] hover:text-[#111111] inline-flex items-center space-x-1 text-[11px] font-semibold uppercase"
                          title="Edit Product"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => handleDuplicate(p)}
                          className="px-2 py-1 border border-[#E5E5E2] hover:border-[#111111] text-[#6B6B6B] hover:text-[#111111] inline-flex items-center space-x-1 text-[11px] font-semibold uppercase"
                          title="Duplicate Product"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Duplicate</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="px-2 py-1 border border-[#A83232]/30 hover:border-[#A83232] text-[#A83232] inline-flex items-center space-x-1 text-[11px] font-semibold uppercase"
                          title="Delete or Archive Product"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                        <Link
                          href={`/products/${p.slug}`}
                          target="_blank"
                          className="p-1 border border-[#E5E5E2] hover:border-[#111111] text-[#6B6B6B] hover:text-[#111111] inline-block"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Grid/List Card View */}
        <div className="md:hidden space-y-4">
          {filteredProducts.map((p) => {
            const stock = p.variants?.[0]?.inventoryCount ?? 0;
            let statusBadge = "bg-[#2E6B44] text-white";
            if (p.status === "DRAFT") statusBadge = "bg-[#6B6B6B] text-white";
            else if (p.status === "ARCHIVED") statusBadge = "bg-black text-white";
            else if (stock === 0) statusBadge = "bg-[#A83232] text-white";

            return (
              <div key={p.id} className="bg-white border border-[#E5E5E2] p-4 space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="relative w-12 h-12 bg-[#F0F0ED] shrink-0 border border-[#E5E5E2] overflow-hidden">
                    {p.images?.[0]?.url && <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] uppercase font-bold text-[#6B6B6B] block">{p.brand || "FictionFigure"}</span>
                    <h4 className="font-semibold text-xs text-[#111111] break-words">{p.name}</h4>
                    <span className="text-[10px] text-[#6B6B6B] block">SKU: <span className="font-mono">{p.sku}</span></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 py-2 border-y border-[#F7F7F5] text-[11px]">
                  <div>
                    <span className="text-[#6B6B6B] block text-[9px] uppercase font-semibold">Category</span>
                    <span className="text-[#111111]">{p.category?.name || "Uncategorized"}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block text-[9px] uppercase font-semibold">Price</span>
                    <span className="font-mono font-semibold text-[#111111]">{formatPrice(p.price)}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block text-[9px] uppercase font-semibold">Stock</span>
                    <span className="font-mono font-bold text-[#111111]">{stock} units</span>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block text-[9px] uppercase font-semibold">Status</span>
                    {stock === 0 ? (
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-[#A83232] text-white inline-block">
                          OUT OF STOCK
                        </span>
                        <Link
                          href="/admin/restock-requests"
                          className="text-[9px] font-bold text-[#B86E00] hover:underline flex items-center"
                        >
                          <Bell className="w-2.5 h-2.5 mr-1" /> VIEW DEMAND
                        </Link>
                      </div>
                    ) : (
                      <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 ${statusBadge}`}>
                        {p.status}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 justify-end">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="px-2.5 py-1.5 border border-[#E5E5E2] hover:border-[#111111] text-[#6B6B6B] hover:text-[#111111] inline-flex items-center space-x-1 text-[11px] font-semibold uppercase min-h-[38px] sm:min-h-[44px]"
                    title="Edit Product"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Link>
                  <button
                    onClick={() => handleDuplicate(p)}
                    className="px-2.5 py-1.5 border border-[#E5E5E2] hover:border-[#111111] text-[#6B6B6B] hover:text-[#111111] inline-flex items-center space-x-1 text-[11px] font-semibold uppercase min-h-[38px] sm:min-h-[44px]"
                    title="Duplicate Product"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate</span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(p)}
                    className="px-2.5 py-1.5 border border-[#A83232]/30 hover:border-[#A83232] text-[#A83232] inline-flex items-center space-x-1 text-[11px] font-semibold uppercase min-h-[38px] sm:min-h-[44px]"
                    title="Delete Product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                  <Link
                    href={`/products/${p.slug}`}
                    target="_blank"
                    className="p-2 border border-[#E5E5E2] hover:border-[#111111] text-[#6B6B6B] hover:text-[#111111] inline-flex items-center justify-center min-h-[38px] sm:min-h-[44px] w-10"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E5E2] p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex items-center space-x-2 text-[#A83232] font-bold uppercase tracking-wider">
              <AlertCircle className="w-5 h-5" />
              <span>Confirm Product Deletion / Archive</span>
            </div>

            <p className="text-[#111111] leading-relaxed">
              Are you sure you want to remove product <strong>"{deleteTarget.name}"</strong> ({deleteTarget.sku})?
            </p>
            <p className="text-[#6B6B6B] text-[11px]">
              Note: If this product has historical sales or order history, it will be safely <strong>ARCHIVED</strong> to protect reporting integrity instead of permanently deleted.
            </p>

            <div className="flex justify-end space-x-3 pt-3 border-t border-[#E5E5E2]">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-[#E5E5E2] font-semibold uppercase text-[#6B6B6B]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-[#A83232] text-white font-semibold uppercase hover:bg-red-800"
              >
                Confirm Delete / Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
