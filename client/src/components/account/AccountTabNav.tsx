"use client";

import React from "react";
import Link from "next/link";
import { User, Package, Heart, ShieldCheck } from "lucide-react";

interface AccountTabNavProps {
  activeTab: "profile" | "orders" | "wishlist";
  orderCount?: number;
  wishlistCount?: number;
  isAdmin?: boolean;
}

export function AccountTabNav({ activeTab, orderCount, wishlistCount, isAdmin }: AccountTabNavProps) {
  return (
    <div className="w-full overflow-x-auto whitespace-nowrap scrollbar-none border-b border-[#E5E5E2] bg-white text-xs font-semibold uppercase tracking-wider">
      <div className="flex min-w-full">
        <Link
          href="/account"
          className={`px-4 sm:px-6 py-3.5 border-b-2 flex items-center space-x-2 shrink-0 transition-colors ${
            activeTab === "profile"
              ? "border-[#111111] text-[#111111] font-bold"
              : "border-transparent text-[#6B6B6B] hover:text-[#111111] hover:bg-[#F7F7F5]"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </Link>

        <Link
          href="/account/orders"
          className={`px-4 sm:px-6 py-3.5 border-b-2 flex items-center space-x-2 shrink-0 transition-colors ${
            activeTab === "orders"
              ? "border-[#111111] text-[#111111] font-bold"
              : "border-transparent text-[#6B6B6B] hover:text-[#111111] hover:bg-[#F7F7F5]"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Orders {orderCount !== undefined ? `(${orderCount})` : ""}</span>
        </Link>

        <Link
          href="/account/wishlist"
          className={`px-4 sm:px-6 py-3.5 border-b-2 flex items-center space-x-2 shrink-0 transition-colors ${
            activeTab === "wishlist"
              ? "border-[#111111] text-[#111111] font-bold"
              : "border-transparent text-[#6B6B6B] hover:text-[#111111] hover:bg-[#F7F7F5]"
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Wishlist & Vault {wishlistCount !== undefined ? `(${wishlistCount})` : ""}</span>
        </Link>

        {isAdmin && (
          <Link
            href="/admin"
            className="px-4 sm:px-6 py-3.5 bg-[#2E6B44] text-white font-bold tracking-widest flex items-center space-x-2 shrink-0 ml-auto"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Console</span>
          </Link>
        )}
      </div>
    </div>
  );
}
