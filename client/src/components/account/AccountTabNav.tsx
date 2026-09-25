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

export function AccountTabNav({
  activeTab,
  orderCount,
  addressCount,
  wishlistCount,
  restockCount,
  isAdmin,
}: AccountTabNavProps) {
  return (
    <div className="w-full max-w-full overflow-x-auto whitespace-nowrap bg-white border border-[#E5E5E2] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl shadow-2xs scrollbar-none">
      <div className="flex items-center gap-1.5 sm:gap-2 w-max min-w-full">
        <Link
          href="/account"
          className={`px-3.5 sm:px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shrink-0 transition-all min-h-[44px] ${
            activeTab === "profile"
              ? "bg-[#111111] text-white shadow-xs"
              : "bg-transparent text-[#6B6B6B] hover:text-[#111111] hover:bg-[#F7F7F5]"
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span>Profile</span>
        </Link>

        <Link
          href="/account/orders"
          className={`px-3.5 sm:px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shrink-0 transition-all min-h-[44px] ${
            activeTab === "orders"
              ? "bg-[#111111] text-white shadow-xs"
              : "bg-transparent text-[#6B6B6B] hover:text-[#111111] hover:bg-[#F7F7F5]"
          }`}
        >
          <Package className="w-4 h-4 shrink-0" />
          <span>Orders</span>
          {orderCount !== undefined && (
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                activeTab === "orders" ? "bg-white/20 text-white" : "bg-[#F7F7F5] text-[#6B6B6B]"
              }`}
            >
              {orderCount}
            </span>
          )}
        </Link>

        <Link
          href="/account/addresses"
          className={`px-3.5 sm:px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shrink-0 transition-all min-h-[44px] ${
            activeTab === "addresses"
              ? "bg-[#111111] text-white shadow-xs"
              : "bg-transparent text-[#6B6B6B] hover:text-[#111111] hover:bg-[#F7F7F5]"
          }`}
        >
          <MapPin className="w-4 h-4 shrink-0" />
          <span>Addresses</span>
          {addressCount !== undefined && (
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                activeTab === "addresses" ? "bg-white/20 text-white" : "bg-[#F7F7F5] text-[#6B6B6B]"
              }`}
            >
              {addressCount}
            </span>
          )}
        </Link>

        <Link
          href="/account/wishlist"
          className={`px-3.5 sm:px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shrink-0 transition-all min-h-[44px] ${
            activeTab === "wishlist"
              ? "bg-[#111111] text-white shadow-xs"
              : "bg-transparent text-[#6B6B6B] hover:text-[#111111] hover:bg-[#F7F7F5]"
          }`}
        >
          <Heart className="w-4 h-4 shrink-0" />
          <span>Vault</span>
          {wishlistCount !== undefined && (
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                activeTab === "wishlist" ? "bg-white/20 text-white" : "bg-[#F7F7F5] text-[#6B6B6B]"
              }`}
            >
              {wishlistCount}
            </span>
          )}
        </Link>

        <Link
          href="/account/restock-requests"
          className={`px-3.5 sm:px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shrink-0 transition-all min-h-[44px] ${
            activeTab === "restock-requests"
              ? "bg-[#111111] text-white shadow-xs"
              : "bg-transparent text-[#6B6B6B] hover:text-[#111111] hover:bg-[#F7F7F5]"
          }`}
        >
          <Bell className="w-4 h-4 shrink-0" />
          <span>Restocks</span>
          {restockCount !== undefined && (
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                activeTab === "restock-requests" ? "bg-white/20 text-white" : "bg-[#F7F7F5] text-[#6B6B6B]"
              }`}
            >
              {restockCount}
            </span>
          )}
        </Link>

        {isAdmin && (
          <Link
            href="/admin"
            className="px-3.5 sm:px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#2E6B44] text-white flex items-center space-x-2 shrink-0 ml-auto hover:bg-[#255737] transition-all min-h-[44px]"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Admin Console</span>
          </Link>
        )}
      </div>
    </div>
  );
}
