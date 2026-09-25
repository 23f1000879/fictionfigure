"use client";

import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const roundedStyles = {
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
  "2xl": "rounded-3xl",
  full: "rounded-full",
};

export function Skeleton({
  rounded = "xl",
  className = "",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`
        bg-white/[0.05] animate-pulse relative overflow-hidden
        before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite]
        before:bg-gradient-to-r before:from-transparent before:via-white/[0.04] before:to-transparent
        ${roundedStyles[rounded]}
        ${className}
      `}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-[#121318] border border-white/[0.08] rounded-2xl p-3 sm:p-4 space-y-4">
      <Skeleton className="w-full aspect-[3/4] rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="w-1/3 h-3 rounded-md" />
        <Skeleton className="w-4/5 h-4 rounded-md" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="w-24 h-6 rounded-md" />
        <Skeleton className="w-16 h-4 rounded-md" />
      </div>
      <Skeleton className="w-full h-11 rounded-xl" />
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <div className="bg-[#121318] border border-white/[0.08] rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
        <div className="space-y-2">
          <Skeleton className="w-32 h-4 rounded-md" />
          <Skeleton className="w-48 h-3 rounded-md" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="w-20 h-6 rounded-full" />
        <Skeleton className="w-20 h-4 rounded-md" />
        <Skeleton className="w-24 h-9 rounded-xl" />
      </div>
    </div>
  );
}
