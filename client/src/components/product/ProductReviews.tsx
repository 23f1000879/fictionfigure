"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Star, CheckCircle2, AlertCircle, Loader2, MessageSquarePlus, Edit3, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

interface ReviewItem {
  id: string;
  productId: string;
  orderId?: string | null;
  authorName: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

interface ProductReviewsProps {
  productId: string;
  productSlug: string;
  productName: string;
}

export function ProductReviews({ productId, productSlug, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
  });
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });

  const [sortBy, setSortBy] = useState("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Authentication & Verification state
  const [userReview, setUserReview] = useState<any>(null);
  const [canReview, setCanReview] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const getAuthToken = () => {
    return typeof window !== "undefined" ? localStorage.getItem("fictionfigure_token") : null;
  };

  const fetchReviews = async (page = 1, append = false) => {
    try {
      if (page === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      const token = getAuthToken();
      setIsLoggedIn(Boolean(token));

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `${API_BASE}/reviews/product/${productId}?page=${page}&limit=10&sortBy=${sortBy}`,
        { headers }
      );
      const data = await res.json();

      if (res.ok) {
        setSummary(data.summary || { averageRating: 0, totalReviews: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
        setPagination(data.pagination || { totalCount: 0, totalPages: 1, currentPage: 1, limit: 10 });
        setUserReview(data.userReview || null);
        setCanReview(Boolean(data.canReview));

        if (append) {
          setReviews((prev) => [...prev, ...(data.reviews || [])]);
        } else {
          setReviews(data.reviews || []);
        }

        // Pre-fill form if editing existing review
        if (data.userReview) {
          setRating(data.userReview.rating || 5);
          setTitle(data.userReview.title || "");
          setComment(data.userReview.comment || "");
        }
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReviews(1, false);
  }, [productId, sortBy]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setFormSuccess("");

    const token = getAuthToken();
    if (!token) {
      setFormError("Authentication required. Please sign in.");
      setIsSubmitting(false);
      return;
    }

    try {
      const isEditing = Boolean(userReview);
      const url = isEditing
        ? `${API_BASE}/reviews/${userReview.id}`
        : `${API_BASE}/reviews/product/${productId}`;
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");

      setFormSuccess(isEditing ? "Your review has been updated." : "Thank you! Your verified purchase review has been submitted.");
      setIsFormOpen(false);
      fetchReviews(1, false);
    } catch (err: any) {
      setFormError(err.message || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (count: number, interactive = false, iconSize = "w-4 h-4") => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = interactive
            ? star <= (hoverRating || rating)
            : star <= count;

          return (
            <button
              key={star}
              type={interactive ? "button" : undefined}
              disabled={!interactive}
              onClick={() => interactive && setRating(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={interactive ? "focus:outline-none transition-transform hover:scale-110 p-0.5" : "cursor-default"}
              aria-label={interactive ? `Rate ${star} star${star > 1 ? "s" : ""}` : undefined}
            >
              <Star
                className={`${iconSize} transition-colors ${
                  isFilled
                    ? "fill-[#F5C518] text-[#F5C518]"
                    : "fill-transparent text-white/20"
                }`}
              />
            </button>
          );
        })}
      </div>
    );
  };

  const totalCalc = summary.totalReviews || 1;

  return (
    <section className="bg-[#121318] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-8 text-white shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-6 gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F5C518] block mb-1">
            VERIFIED COLLECTOR REVIEWS
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-outfit">
            Collector Experiences & Ratings
          </h2>
        </div>

        {/* Review Action Trigger Button */}
        {isLoggedIn ? (
          canReview ? (
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-[#F5C518] text-[#0A0A0C] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#ffe066] transition-colors space-x-2 shrink-0 self-start sm:self-auto shadow-lg shadow-[#F5C518]/10"
            >
              {userReview ? <Edit3 className="w-3.5 h-3.5" /> : <MessageSquarePlus className="w-3.5 h-3.5" />}
              <span>{userReview ? "Edit Your Review" : "Write a Verified Review"}</span>
            </button>
          ) : (
            <div className="bg-[#181920] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-400 shrink-0 self-start sm:self-auto">
              <span className="font-semibold text-white">Verified Purchase Required:</span> Only customers who ordered & received this item can review.
            </div>
          )
        ) : (
          <Link
            href={`/login?redirect=/products/${productSlug}`}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-white/5 border border-white/10 hover:border-[#F5C518] hover:text-[#F5C518] rounded-xl text-xs font-semibold uppercase tracking-wider text-white transition-all shrink-0 self-start sm:self-auto"
          >
            Sign in to Write a Review →
          </Link>
        )}
      </div>

      {formSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 shrink-0 text-emerald-400" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* RATING SUMMARY & DISTRIBUTION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#181920] border border-white/5 rounded-2xl p-6 text-xs">
        {/* Rating Average Box */}
        <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-6 space-y-2.5 text-center">
          <span className="text-4xl sm:text-5xl font-extrabold font-mono text-white">
            {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : "0.0"}
          </span>
          {renderStars(Math.round(summary.averageRating), false, "w-5 h-5")}
          <span className="text-xs font-medium text-zinc-400 block">
            Based on {summary.totalReviews} verified {summary.totalReviews === 1 ? "review" : "reviews"}
          </span>
        </div>

        {/* Rating Distribution Breakdown Bars */}
        <div className="md:col-span-2 space-y-2.5 flex flex-col justify-center">
          {[5, 4, 3, 2, 1].map((num) => {
            const count = summary.distribution[num] || 0;
            const pct = Math.round((count / totalCalc) * 100);

            return (
              <div key={num} className="flex items-center space-x-3 text-xs">
                <span className="font-mono font-bold text-zinc-300 w-8 shrink-0">{num} ★</span>
                <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#F5C518] h-full transition-all duration-500 rounded-full"
                    style={{ width: `${summary.totalReviews > 0 ? pct : 0}%` }}
                  />
                </div>
                <span className="font-mono text-zinc-400 w-8 text-right shrink-0">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* REVIEWS LIST HEADER & SORTING */}
      <div className="flex justify-between items-center border-b border-white/10 pb-3 text-xs">
        <span className="font-bold uppercase tracking-wider text-zinc-300">
          All Reviews ({summary.totalReviews})
        </span>

        <div className="flex items-center space-x-2">
          <span className="text-zinc-400 hidden sm:inline uppercase text-[10px] font-semibold">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#181920] border border-white/10 rounded-lg text-white text-xs font-medium px-3 py-1.5 focus:outline-none focus:border-[#F5C518]"
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      </div>

      {/* REVIEWS CARDS LIST */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-zinc-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#F5C518]" /> Loading verified reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center space-y-3 bg-[#181920]/50 border border-white/5 rounded-2xl p-8">
          <Star className="w-8 h-8 text-zinc-600 mx-auto opacity-40" />
          <h4 className="text-sm font-semibold text-white">No Reviews Yet</h4>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Be the first verified customer to review this figure after receiving your order.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {reviews.map((r) => (
            <div key={r.id} className="py-6 first:pt-0 last:pb-0 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  {renderStars(r.rating, false, "w-4 h-4")}
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3 mr-1 shrink-0 text-emerald-400" />
                    Verified Purchase
                  </span>
                </div>

                <div className="text-[11px] text-zinc-500 font-mono">
                  {formatDate(r.createdAt)}
                </div>
              </div>

              {r.title && (
                <h4 className="text-sm font-bold text-white">{r.title}</h4>
              )}

              {r.comment && (
                <p className="text-xs text-zinc-300 leading-relaxed break-words">
                  {r.comment}
                </p>
              )}

              <div className="text-[11px] font-semibold text-zinc-400">
                {r.authorName}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION / LOAD MORE */}
      {pagination.currentPage < pagination.totalPages && (
        <div className="text-center pt-4">
          <button
            onClick={() => fetchReviews(pagination.currentPage + 1, true)}
            disabled={isLoadingMore}
            className="px-8 py-3 bg-white/5 border border-white/10 hover:border-[#F5C518] hover:text-[#F5C518] rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all inline-flex items-center space-x-2"
          >
            {isLoadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
            <span>LOAD MORE REVIEWS →</span>
          </button>
        </div>
      )}

      {/* MODAL FORM FOR SUBMITTING / EDITING A REVIEW */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121318] border border-white/15 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Close review modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> VERIFIED PURCHASE REVIEW
              </span>
              <h3 className="text-lg font-bold text-white">{userReview ? "Edit Your Review" : "Write a Review"}</h3>
              <p className="text-xs text-zinc-400 truncate">{productName}</p>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-xl flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-5 text-xs">
              {/* Rating Selector */}
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-zinc-200 block">
                  How would you rate this product? <span className="text-[#F5C518]">*</span>
                </label>
                <div className="flex items-center space-x-2 pt-1">
                  {renderStars(rating, true, "w-6 h-6")}
                  <span className="font-mono text-sm font-bold text-[#F5C518] ml-2">{rating} / 5 Stars</span>
                </div>
              </div>

              {/* Review Title (Optional) */}
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-zinc-200 block">
                  Review Headline (Optional)
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Exceptional sculpture quality & secure packaging!"
                  className="w-full bg-[#181920] border border-white/10 rounded-xl focus:border-[#F5C518] p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none"
                />
              </div>

              {/* Review Comment (Optional) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold uppercase tracking-wider text-zinc-200">
                    Your Detailed Review (Optional)
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">{comment.length} / 2000</span>
                </div>
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about figure detail, paint job, box condition, or packaging..."
                  className="w-full bg-[#181920] border border-white/10 rounded-xl focus:border-[#F5C518] p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none resize-y"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 border border-white/10 rounded-xl text-xs font-semibold uppercase text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-7 py-2.5 bg-[#F5C518] text-[#0A0A0C] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#ffe066] transition-colors flex items-center space-x-2"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                  <span>{userReview ? "UPDATE REVIEW" : "SUBMIT REVIEW"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

