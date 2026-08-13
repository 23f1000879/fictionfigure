"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FolderTree, Plus, Edit2, Trash2, ArrowUpRight, Loader2, AlertCircle, CheckCircle2, Package } from "lucide-react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchCategories = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/admin/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm({ name: "", slug: "", description: "", imageUrl: "" });
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name || "",
      slug: cat.slug || "",
      description: cat.description || "",
      imageUrl: cat.imageUrl || "",
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const autoSlug = val.toLowerCase().trim().replace(/[^\w ]+/g, "").replace(/ +/g, "-");
    setForm((prev) => ({
      ...prev,
      name: val,
      slug: editingCategory ? prev.slug : autoSlug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      const url = editingCategory
        ? `http://localhost:5000/api/admin/categories/${editingCategory.id}`
        : "http://localhost:5000/api/admin/categories";
      const method = editingCategory ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save category");

      setSuccessMsg(editingCategory ? "Category updated successfully" : "Category created successfully");
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || "Something went wrong saving category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cat: any, action: string = "UNASSIGN") => {
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/categories/${cat.id}?action=${action}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (!res.ok) {
        if (data.error === "CATEGORY_HAS_PRODUCTS") {
          setDeleteTarget(cat);
          return;
        }
        throw new Error(data.message || data.error || "Failed to delete category");
      }

      setSuccessMsg("Category deleted successfully");
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || "Failed to delete category");
    }
  };

  return (
    <div className="space-y-6 text-[#111111]">
      <div className="flex justify-between items-end border-b border-[#E5E5E2] pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Catalog Management
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">
            Categories ({categories.length})
          </h1>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black transition-colors flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Create Category</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-[#2E6B44]/10 border border-[#2E6B44] text-[#2E6B44] text-xs font-semibold flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-[#6B6B6B]">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E5E5E2] space-y-3 text-xs">
          <FolderTree className="w-8 h-8 text-[#6B6B6B] mx-auto opacity-40" />
          <p className="text-[#6B6B6B]">No categories found in store database.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5E2] overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F7F5] border-b border-[#E5E5E2] uppercase font-semibold text-[#6B6B6B]">
                <th className="p-4">Category</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Product Count</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E2]">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-[#F7F7F5]">
                  <td className="p-4">
                    <span className="font-semibold text-[#111111] block">{c.name}</span>
                    <span className="text-[11px] text-[#6B6B6B] block truncate max-w-xs">{c.description || "No description"}</span>
                  </td>
                  <td className="p-4 font-mono text-[#6B6B6B]">{c.slug}</td>
                  <td className="p-4 font-mono font-bold text-[#111111]">
                    {c._count?.products || 0} products
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Link
                      href={`/admin/categories/${c.id}`}
                      className="px-2.5 py-1.5 border border-[#E5E5E2] hover:border-[#111111] text-[11px] font-semibold uppercase tracking-wider inline-flex items-center"
                    >
                      Detail <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Link>
                    <button
                      onClick={() => openEditModal(c)}
                      className="px-2.5 py-1.5 border border-[#E5E5E2] hover:border-[#111111] text-[11px] font-semibold uppercase tracking-wider inline-flex items-center"
                    >
                      <Edit2 className="w-3 h-3 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="px-2.5 py-1.5 border border-[#A83232]/30 hover:border-[#A83232] text-[#A83232] text-[11px] font-semibold uppercase tracking-wider inline-flex items-center"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E5E2] p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-[#E5E5E2] pb-3">
              <h3 className="font-semibold uppercase tracking-wider text-[#111111]">
                {editingCategory ? "Edit Category" : "Create New Category"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#6B6B6B] hover:text-[#111111]">
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B]">Category Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Scale Figures"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B]">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="scale-figures"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B]">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Authentic scale collectibles and figures..."
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-[#6B6B6B]">Image URL (Optional)</label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-3 bg-[#F7F7F5] border border-[#E5E5E2] font-mono text-xs focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#E5E5E2]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#E5E5E2] font-semibold uppercase tracking-wider text-[#6B6B6B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#111111] text-white font-semibold uppercase tracking-wider hover:bg-black disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Category</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION & PRODUCT RE-ASSIGNMENT MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E5E2] p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex items-center space-x-2 text-[#A83232] font-bold uppercase tracking-wider">
              <AlertCircle className="w-5 h-5" />
              <span>Category Contains Products</span>
            </div>

            <p className="text-[#111111] leading-relaxed">
              This category <strong>"{deleteTarget.name}"</strong> contains <strong>{deleteTarget._count?.products || 0} product(s)</strong>. Choose what should happen to these products before deleting:
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleDelete(deleteTarget, "UNASSIGN")}
                className="w-full p-3 text-left border border-[#E5E5E2] hover:border-[#111111] bg-[#F7F7F5] font-semibold block"
              >
                1. Move products to alternative active category & delete
              </button>

              <button
                onClick={() => setDeleteTarget(null)}
                className="w-full p-3 text-left border border-[#E5E5E2] hover:border-[#111111] text-[#6B6B6B] block"
              >
                2. Cancel deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
