"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  FolderTree,
  Tag,
  Users,
  BarChart3,
  Sliders,
  ExternalLink,
  ShieldCheck,
  LogOut,
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("fictionfigure_token");
    router.push("/login");
  };

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/inventory", label: "Inventory", icon: Boxes },
    { href: "/admin/categories", label: "Categories", icon: FolderTree },
    { href: "/admin/discounts", label: "Discounts", icon: Tag },
    { href: "/admin/customers", label: "Customers", icon: Users },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/settings", label: "Store Settings", icon: Sliders },
  ];

  return (
    <aside className="w-64 bg-[#111111] text-white flex flex-col shrink-0 min-h-screen border-r border-[#2A2A2A]">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#2A2A2A] flex items-center space-x-3">
        <Image
          src="/fictionfigure-icon.svg"
          alt="FictionFigure Icon"
          width={28}
          height={28}
          className="h-7 w-auto object-contain"
        />
        <div className="flex-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#6B6B6B] block">
            Commerce Console
          </span>
          <h2 className="text-sm font-bold tracking-tight text-white font-mono">
            FICTIONFIGURE <span className="text-[10px] text-[#2E6B44] uppercase font-mono">ADMIN</span>
          </h2>
        </div>
        <ShieldCheck className="w-5 h-5 text-[#2E6B44] shrink-0" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 text-xs font-semibold uppercase tracking-wider">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 transition-colors ${
                isActive
                  ? "bg-white text-[#111111] font-bold"
                  : "text-[#A0A0A0] hover:text-white hover:bg-[#1E1E1E]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer link to main Storefront & Sign Out */}
      <div className="p-4 border-t border-[#2A2A2A] space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between p-3 bg-[#1E1E1E] text-xs font-semibold uppercase tracking-wider text-[#A0A0A0] hover:text-white transition-colors"
        >
          <span>View Storefront</span>
          <ExternalLink className="w-4 h-4" />
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-3 bg-[#A83232]/20 border border-[#A83232]/40 hover:bg-[#A83232]/40 text-xs font-semibold uppercase tracking-wider text-white transition-colors"
        >
          <span>Admin Sign Out</span>
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
