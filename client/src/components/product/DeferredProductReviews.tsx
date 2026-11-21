"use client";

import dynamic from "next/dynamic";
import { useNearViewport } from "@/lib/useNearViewport";

interface Props { productId: string; productSlug: string; productName: string; }
function ReviewPlaceholder() {
  return <div className="space-y-4" aria-busy="true"><p className="ff-eyebrow">Verified collector reviews</p><h2 className="ff-section-title">Collector Experiences &amp; Ratings</h2><div className="h-48 rounded-2xl bg-surface-elevated animate-pulse" aria-hidden /></div>;
}
const Reviews = dynamic(() => import("./ProductReviews").then(module => module.ProductReviews), { ssr: false, loading: ReviewPlaceholder });

export function DeferredProductReviews(props: Props) {
  const { ref, near } = useNearViewport();
  return <div ref={ref} className="min-h-[300px]">{near ? <Reviews {...props} /> : <ReviewPlaceholder />}</div>;
}
