"use client";

import React, { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

interface ProductSortSelectorProps {
  currentSort?: string;
}

export function ProductSortSelector({ currentSort = "newest" }: ProductSortSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const selectedValue = searchParams.get("sortBy") || currentSort || "newest";

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", newSort);
    params.set("page", "1");

    startTransition(() => {
      router.push(`/shop?${params.toString()}`);
    });
  };

  return (
    <div className={`flex items-center space-x-2 bg-white border border-[#E5E5E2] px-3 py-1.5 min-h-[38px] transition-opacity ${isPending ? "opacity-60" : "opacity-100"}`}>
      <ArrowUpDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
      <span className="text-[#6B6B6B] uppercase font-semibold text-[10px]">Sort:</span>
      <select
        value={selectedValue}
        onChange={handleSortChange}
        disabled={isPending}
        className="bg-transparent font-semibold text-[#111111] focus:outline-none cursor-pointer text-xs"
      >
        <option value="featured">Featured</option>
        <option value="newest">Newest</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="name-asc">Name: A-Z</option>
      </select>
    </div>
  );
}
