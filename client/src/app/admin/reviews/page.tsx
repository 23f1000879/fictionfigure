"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, CheckCircle2, AlertCircle, Loader2, Search, Filter, ShieldCheck, Eye, EyeOff, Trash2, Package } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { API_BASE, adminFetch } from "@/lib/api";

export default function AdminReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionMessage, setActionMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const res = await adminFetch(`${API_BASE}/reviews/admin/all`);
      const data = await res.json();

      if (data.reviews) {
        setReviews(data.reviews);
      } else {
        setErrorMessage(data.error || "Failed to load customer reviews.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load reviews.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleStatus = async (reviewId: string, currentStatus: string) => {
    const newStatus = currentStatus === "APPROVED" ? "HIDDEN" : "APPROVED";
    setUpdatingId(reviewId);
    setActionMessage("");
    setErrorMessage("");

    try {
      const res = await adminFetch(`${API_BASE}/reviews/admin/${reviewId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update review status");

      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: newStatus } : r))
      );
      setActionMessage(`Review status updated to ${newStatus}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update review status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this customer review permanently?")) return;

    setUpdatingId(reviewId);
    setActionMessage("");
    setErrorMessage("");

    try {
      const res = await adminFetch(`${API_BASE}/reviews/${reviewId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete review");

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setActionMessage("Review deleted successfully.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete review.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      r.productName?.toLowerCase().includes(q) ||
      r.customerName?.toLowerCase().includes(q) ||
      r.customerPhone?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q) ||
      r.title?.toLowerCase().includes(q) ||
      r.orderId?.toLowerCase().includes(q);

    return matchesStatus && matchesQuery;
  });

  const renderStars = (rating: number) => (
    <div className="flex items-center space-x-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= rating ? "fill-[#111111] text-[#111111]" : "fill-transparent text-[#D4D4D0]"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl text-[#111111]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5E5E2] pb-4 gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B] block">
            Storefront Moderation
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
            Verified Customer Reviews ({reviews.length})
          </h1>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-[#2E6B44]">
          <ShieldCheck className="w-4 h-4 text-[#2E6B44] shrink-0" />
          <span>Audit Authenticated Purchases</span>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-[#2E6B44]/10 border border-[#2E6B44] text-[#2E6B44] text-xs font-semibold flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-[#A83232]/10 border border-[#A83232] text-[#A83232] text-xs font-semibold flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SEARCH & FILTER BAR */}
      <div className="bg-white border border-[#E5E5E2] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by figure, customer, order ID..."
            className="w-full bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#111111] pl-9 pr-3 py-2 text-xs text-[#111111] focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-[#6B6B6B] uppercase font-bold text-[10px] shrink-0">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F7F7F5] border border-[#E5E5E2] px-3 py-2 text-xs font-semibold text-[#111111] focus:outline-none"
          >
            <option value="ALL">All Reviews</option>
            <option value="APPROVED">Approved Only</option>
            <option value="HIDDEN">Hidden Only</option>
          </select>
        </div>
      </div>

      {/* REVIEWS TABLE */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-[#6B6B6B] bg-white border border-[#E5E5E2]">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#111111]" /> Loading customer reviews...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-12 text-center space-y-2 bg-white border border-[#E5E5E2] text-xs text-[#6B6B6B]">
          <Package className="w-8 h-8 mx-auto text-[#6B6B6B] opacity-40" />
          <p className="font-semibold text-[#111111]">No Reviews Found</p>
          <p>No customer reviews match your search filter.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5E2] overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E2] bg-[#F7F7F5] text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                <th className="p-4">Product Figure</th>
                <th className="p-4">Rating & Review</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Order Link</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E2]">
              {filteredReviews.map((r) => (
                <tr key={r.id} className="hover:bg-[#F7F7F5]/50 transition-colors">
                  {/* Product Column */}
                  <td className="p-4 align-top max-w-[200px]">
                    <div className="flex space-x-3 items-center">
                      <div className="relative w-12 h-12 bg-[#F7F7F5] border border-[#E5E5E2] shrink-0 overflow-hidden">
                        {r.productImage ? (
                          <Image src={r.productImage} alt={r.productName} fill className="object-contain p-0.5" />
                        ) : (
                          <Package className="w-5 h-5 text-[#6B6B6B] mx-auto mt-3 opacity-40" />
                        )}
                      </div>
                      <div className="min-w-0">
                        {r.productSlug ? (
                          <Link href={`/products/${r.productSlug}`} target="_blank" className="font-bold text-[#111111] hover:underline line-clamp-2 leading-snug">
                            {r.productName}
                          </Link>
                        ) : (
                          <span className="font-bold text-[#111111] leading-snug">{r.productName}</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Rating & Review Content Column */}
                  <td className="p-4 align-top space-y-1 max-w-[320px]">
                    <div className="flex items-center space-x-2">
                      {renderStars(r.rating)}
                      <span className="font-mono font-bold text-[#111111]">{r.rating}/5</span>
                      {r.isVerifiedPurchase && (
                        <span className="text-[9px] font-bold text-[#2E6B44] uppercase tracking-wider flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-0.5" /> Verified
                        </span>
                      )}
                    </div>

                    {r.title && <h5 className="font-bold text-[#111111]">{r.title}</h5>}
                    {r.comment && <p className="text-[#6B6B6B] leading-relaxed break-words">{r.comment}</p>}
                    <span className="text-[10px] font-mono text-[#6B6B6B] block pt-1">{formatDate(r.createdAt)}</span>
                  </td>

                  {/* Customer Info Column */}
                  <td className="p-4 align-top space-y-0.5">
                    <span className="font-bold text-[#111111] block">{r.customerName}</span>
                    <span className="font-mono text-[11px] text-[#6B6B6B] block">{r.customerPhone}</span>
                  </td>

                  {/* Order Reference Column */}
                  <td className="p-4 align-top">
                    {r.orderId ? (
                      <Link
                        href={`/admin/orders/${r.orderId}`}
                        className="font-mono text-xs font-bold text-[#111111] hover:underline bg-[#F7F7F5] border border-[#E5E5E2] px-2 py-1 inline-block"
                      >
                        Order Details →
                      </Link>
                    ) : (
                      <span className="text-[11px] text-[#6B6B6B] font-mono">N/A</span>
                    )}
                  </td>

                  {/* Status Column */}
                  <td className="p-4 align-top">
                    <span
                      className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        r.status === "APPROVED"
                          ? "bg-[#2E6B44] text-white"
                          : "bg-[#A83232] text-white"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>

                  {/* Actions Column */}
                  <td className="p-4 align-top text-right space-x-2 shrink-0">
                    <button
                      onClick={() => handleToggleStatus(r.id, r.status)}
                      disabled={updatingId === r.id}
                      className="p-1.5 border border-[#E5E5E2] hover:border-[#111111] text-[#111111] transition-colors inline-flex items-center space-x-1"
                      title={r.status === "APPROVED" ? "Hide Review" : "Approve Review"}
                    >
                      {r.status === "APPROVED" ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleDeleteReview(r.id)}
                      disabled={updatingId === r.id}
                      className="p-1.5 border border-[#E5E5E2] hover:border-[#A83232] hover:bg-[#A83232] hover:text-white text-[#A83232] transition-colors inline-flex items-center"
                      title="Delete Review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
