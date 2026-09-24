"use client";

import React from "react";
import Link from "next/link";
import { User, Package, MapPin, Heart, ShieldCheck, Bell } from "lucide-react";

interface AccountTabNavProps {
  activeTab: "profile" | "orders" | "addresses" | "wishlist" | "restock-requests";
  orderCount?: number;
  addressCount?: number;
  wishlistCount?: number;
  restockCount?: number;
  isAdmin?: boolean;
}

export function AccountTabNav({ activeTab, orderCount, addressCount, wishlistCount, restockCount, isAdmin }: AccountTabNavProps) {
  return (
    <div className="w-full max-w-full overflow-x-auto whitespace-nowrap border-b border-[#E5E5E2] bg-white text-xs font-semibold uppercase tracking-wider">
      <div className="flex w-max min-w-full">
        <Link
          href="/account"
          className={`px-4 sm:px-6 py-3.5 border-b-2 flex items-center space-x-2 shrink-0 transition-colors ${
            activeTab === "profile"
              ? "border-[#111111] text-[#111111] font-bold"
              : "border-transparent text-[#6B6B6B] hover:text-[#111111] hover:bg-[#F7F7F5]"
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
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
          <Package className="w-4 h-4 shrink-0" />
          <span>Orders {orderCount !== undefined ? `(${orderCount})` : ""}</span>
        </Link>

        <Link
          href="/account/addresses"
          className={`px-4 sm:px-6 py-3.5 border-b-2 flex items-center space-x-2 shrink-0 transition-colors ${
            activeTab === "addresses"
              ? "border-[#111111] text-[#111111] font-bold"
              : "border-transparent text-[#6B6B6B] hover:text-[#111111] hover:bg-[#F7F7F5]"
          }`}
        >
          <MapPin className="w-4 h-4 shrink-0" />
          <span>Saved Addresses {addressCount !== undefined ? `(${addressCount})` : ""}</span>
        </Link>

        <Link
          href="/account/wishlist"
          className={`px-4 sm:px-6 py-3.5 border-b-2 flex items-center space-x-2 shrink-0 transition-colors ${
            activeTab === "wishlist"
              ? "border-[#111111] text-[#111111] font-bold"
              : "border-transparent text-[#6B6B6B] hover:text-[#111111] hover:bg-[#F7F7F5]"
          }`}
        >
          <Heart className="w-4 h-4 shrink-0" />
          <span>Wishlist {wishlistCount !== undefined ? `(${wishlistCount})` : ""}</span>
        </Link>

        <Link
          href="/account/restock-requests"
          className={`px-4 sm:px-6 py-3.5 border-b-2 flex items-center space-x-2 shrink-0 transition-colors ${
            activeTab === "restock-requests"
              ? "border-[#111111] text-[#111111] font-bold"
              : "border-transparent text-[#6B6B6B] hover:text-[#111111] hover:bg-[#F7F7F5]"
          }`}
        >
          <Bell className="w-4 h-4 shrink-0" />
          <span>Restock Requests {restockCount !== undefined ? `(${restockCount})` : ""}</span>
        </Link>

        {isAdmin && (
          <Link
            href="/admin"
            className="px-4 sm:px-6 py-3.5 bg-[#2E6B44] text-white font-bold tracking-widest flex items-center space-x-2 shrink-0 ml-auto"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Admin Console</span>
          </Link>
        )}
      </div>
    </div>
  );
}
